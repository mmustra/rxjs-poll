import { Observable, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { poll } from '../src/poll';
import { PollState } from '../src/types/poll.type';
import { setPageActive } from '../utils/test-helpers';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  setPageActive(true);
  jest.clearAllMocks();
});

describe('poll operator - delay strategies', () => {
  it('should emit using constant strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a-a|', { a: 'success' });
      const expected = '----a----a----a----a----(a|)';

      const result$ = source$.pipe(poll({ delay: { strategy: 'constant', time: 1 } }), take(5));

      expectObservable(result$).toBe(expected, { a: 'success' });
    });
  });

  it('should emit using linear strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a-a|', { a: 'success' });
      const expected = '----a----a-----a------a-------(a|)';

      const result$ = source$.pipe(poll({ delay: { strategy: 'linear', time: 1 } }), take(5));

      expectObservable(result$).toBe(expected, { a: 'success' });
    });
  });

  it('should emit using exponential strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a-a|', { a: 'success' });
      const expected = '----a----a-----a-------a-----------(a|)';

      const result$ = source$.pipe(poll({ delay: { strategy: 'exponential', time: 1 } }), take(5));

      expectObservable(result$).toBe(expected, { a: 'success' });
    });
  });

  it('should emit using random strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a-a|', { a: 'success' });
      const expected = '----a------a------a------a------(a|)';

      jest.spyOn(require('../src/common/utils'), 'randomNumber').mockReturnValue(3);

      const result$ = source$.pipe(poll({ delay: { strategy: 'random', time: [2, 4] } }), take(5));

      expectObservable(result$).toBe(expected, { a: 'success' });
    });
  });

  it('should emit using dynamic strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a-a|', { a: 'success' });
      const expected = '----a-----a-------a---------a-----------(a|)';

      const dynamicDelay = (state: PollState<unknown>) => state.pollCount * 2;
      const result$ = source$.pipe(poll({ delay: { strategy: 'dynamic', time: dynamicDelay } }), take(5));

      expectObservable(result$).toBe(expected, { a: 'success' });
    });
  });
});

describe('poll operator - retry strategies', () => {
  it('should retry using constant strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '--------#';

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: { strategy: 'constant', time: 1, limit: 2 },
        })
      );

      expectObservable(result$).toBe(expected, undefined, error);
    });
  });

  it('should retry using linear strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '---------#';

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: { strategy: 'linear', time: 1, limit: 2 },
        })
      );

      expectObservable(result$).toBe(expected, undefined, error);
    });
  });

  it('should retry using exponential strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '------------#';

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: { strategy: 'exponential', time: 2, limit: 2 },
        })
      );

      expectObservable(result$).toBe(expected, undefined, error);
    });
  });

  it('should retry using random strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '------------#';

      jest.spyOn(require('../src/common/utils'), 'randomNumber').mockReturnValue(3);

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: { strategy: 'random', time: [2, 4], limit: 2 },
        })
      );

      expectObservable(result$).toBe(expected, undefined, error);
    });
  });

  it('should retry using dynamic strategy', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '---------------#';

      const dynamicRetry = (state: PollState<unknown>) => state.retryCount * 3;
      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: { strategy: 'dynamic', time: dynamicRetry, limit: 2 },
        })
      );

      expectObservable(result$).toBe(expected, undefined, error);
    });
  });
});

describe('poll operator - extras', () => {
  it('should not throw for scattered errors (consecutiveOnly: true)', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = new Observable((subscriber) => {
        if (counter > 8) {
          subscriber.complete();
          return;
        }

        if (counter % 2) {
          subscriber.error('error');
        } else {
          subscriber.next('a');
          subscriber.complete();
        }

        counter++;
      });

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: {
            strategy: 'constant',
            time: 1,
            limit: 2,
            consecutiveOnly: true,
          },
        }),
        take(5)
      );

      expectObservable(result$).toBe('a-a-a-a-(a|)');
    });
  });

  it('should throw for scattered errors (consecutiveOnly: false)', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = new Observable((subscriber) => {
        if (counter > 8) {
          subscriber.complete();
          return;
        }

        if (counter % 2) {
          subscriber.error('error');
        } else {
          subscriber.next('a');
          subscriber.complete();
        }

        counter++;
      });

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: {
            strategy: 'constant',
            time: 1,
            limit: 2,
            consecutiveOnly: false,
          },
        }),
        take(5)
      );

      expectObservable(result$).toBe(`a-a-a#`);
    });
  });

  it('should throw immediately when limit is 0', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = new Observable((subscriber) => {
        if (counter > 8) {
          subscriber.complete();
          return;
        }

        if (counter % 2) {
          subscriber.error('error');
        } else {
          subscriber.next('a');
          subscriber.complete();
        }

        counter++;
      });

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          retry: {
            strategy: 'constant',
            time: 1,
            limit: 0,
            consecutiveOnly: false,
          },
        }),
        take(5)
      );

      expectObservable(result$).toBe(`a#`);
    });
  });

  it('should poll in active tab', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          pauseWhenHidden: true,
        }),
        take(2)
      );

      expectObservable(result$).toBe('--a--(a|)', { a: 'success' });
    });
  });

  it('should pause when on other tab', () => {
    let isTriggered = false;

    setPageActive(false);

    testScheduler.run(async ({ cold, expectObservable }) => {
      const source$ = cold('-a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          delay: {
            strategy: 'dynamic',
            time: () => {
              isTriggered = true;
              return 1;
            },
          },
          pauseWhenHidden: true,
        }),
        take(1)
      );

      expectObservable(result$).toBe('---');
    });

    expect(isTriggered).toBe(false);
  });
});
