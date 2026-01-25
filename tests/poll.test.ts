import { Observable, switchMap, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { poll } from '../src/poll';
import { PollState } from '../src/types/poll.type';
import { setDocumentVisibility } from '../utils/test-helpers';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  setDocumentVisibility(true);
  jest.clearAllMocks();
});

describe('poll operator (repeat) - delay strategies', () => {
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

describe('poll operator (repeat) - retry strategies', () => {
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

describe('poll operator (repeat) - extras', () => {
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

  it('should guarantee first emission when tab starts hidden', () => {
    let pollCallCount = 0;

    setDocumentVisibility(false);
    // Trigger visibility change event to update the cached visibility observable
    document.dispatchEvent(new Event('visibilitychange'));

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          delay: {
            strategy: 'dynamic',
            time: () => {
              pollCallCount++;
              return 1;
            },
          },
          pauseWhenHidden: true,
        }),
        take(2)
      );

      expectObservable(result$).toBe('--a------', { a: 'success' });
    });

    expect(pollCallCount).toBeGreaterThanOrEqual(1);
  });

  it('should complete emission then pause polling when tab becomes hidden while source is running', () => {
    setDocumentVisibility(true);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a---|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          delay: {
            strategy: 'dynamic',
            time: () => {
              return 10;
            },
          },
          pauseWhenHidden: true,
        }),
        take(2)
      );

      testScheduler.schedule(() => {
        setDocumentVisibility(false);
        document.dispatchEvent(new Event('visibilitychange'));
      }, 2);

      expectObservable(result$).toBe('-----a-------', { a: 'success' });
    });
  });
});

describe('poll operator (interval) - interval type behavior', () => {
  it('should poll at fixed intervals regardless of source duration', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          type: 'interval',
          delay: { strategy: 'constant', time: 10 },
          pauseWhenHidden: false,
        }),
        take(2)
      );

      const expected = '---a 6ms ---(a|)';

      expectObservable(result$).toBe(expected, { a: 'success' });
    });
  });

  it('should interrupt long-running sources', () => {
    let subscriptionCount = 0;

    testScheduler.run(({ cold, expectObservable }) => {
      const createSource = () => {
        subscriptionCount++;

        if (subscriptionCount === 1) {
          return cold('-----a|', { a: 'first' });
        } else if (subscriptionCount === 2) {
          return cold('---------------a|', { a: 'interrupted' });
        } else {
          return cold('-----a|', { a: 'third' });
        }
      };

      const source$ = cold('a|', { a: 'trigger' }).pipe(switchMap(() => createSource()));

      const result$ = source$.pipe(
        poll({
          type: 'interval',
          delay: { strategy: 'constant', time: 10 },
          pauseWhenHidden: false,
        }),
        take(2)
      );

      const expected = '6ms a 19ms (b|)';

      expectObservable(result$).toBe(expected, { a: 'first', b: 'third' });
    });
  });

  it('should guarantee first emission when tab starts hidden (interval mode)', () => {
    let pollCallCount = 0;

    setDocumentVisibility(false);
    // Trigger visibility change event to update the cached visibility observable
    document.dispatchEvent(new Event('visibilitychange'));

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          type: 'interval',
          delay: {
            strategy: 'dynamic',
            time: () => {
              pollCallCount++;
              return 1;
            },
          },
          pauseWhenHidden: true,
        }),
        take(2)
      );

      expectObservable(result$).toBe('--a------', { a: 'success' });
    });

    expect(pollCallCount).toBeGreaterThanOrEqual(1);
  });
});
