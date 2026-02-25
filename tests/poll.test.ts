import { Observable, switchMap, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { poll } from '../src/poll';
import { createTestScheduler } from './_helpers/test-scheduler';
import { hiddenNotifier$ } from './_mocks/hidden-pauser.mock';

jest.mock('../src/poller/pause/with-hidden-pause', () => require('./_mocks/hidden-pauser.mock'));

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  hiddenNotifier$.next(false);
  jest.clearAllMocks();
});

describe('poll operator - delay behavior', () => {
  describe('repeat type (delay after source completes)', () => {
    it('should poll in active tab with delay between completions', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 1 },
            pause: { whenHidden: false },
          }),
          take(2)
        );

        expectObservable(result$).toBe('--a--(a|)', { a: 'success' });
      });
    });
  });

  describe('interval type (fixed interval from start)', () => {
    it('should poll at fixed intervals regardless of source duration', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            type: 'interval',
            delay: { strategy: 'constant', time: 10 },
            pause: { whenHidden: false },
          }),
          take(2)
        );

        const expected = '---a 6ms ---(a|)';

        expectObservable(result$).toBe(expected, { a: 'success' });
      });
    });

    it('should interrupt long-running sources when interval elapses', () => {
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
            pause: { whenHidden: false },
          }),
          take(2)
        );

        const expected = '6ms a 19ms (b|)';

        expectObservable(result$).toBe(expected, { a: 'first', b: 'third' });
      });
    });
  });
});

describe('poll operator - retry behavior', () => {
  it('should not throw for scattered errors when consecutiveOnly is true', () => {
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

  it('should throw for scattered errors when consecutiveOnly is false', () => {
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

  it('should throw immediately when retry limit is 0', () => {
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
});

describe('poll operator - pause behavior', () => {
  describe('whenHidden option', () => {
    it('should guarantee first emission even when tab starts hidden', () => {
      hiddenNotifier$.next(true);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'dynamic', time: () => 1 },
            pause: { whenHidden: true },
          }),
          take(1)
        );

        expectObservable(result$).toBe('--(a|)', { a: 'success' });
      });
    });

    it('should guarantee first emission when tab starts hidden (interval mode)', () => {
      hiddenNotifier$.next(true);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('10ms a|', { a: 'success' });

        testScheduler.schedule(() => hiddenNotifier$.next(false), 5);

        const result$ = source$.pipe(
          poll({
            type: 'interval',
            delay: { strategy: 'dynamic', time: () => 100 },
            pause: { whenHidden: true },
          }),
          take(1)
        );

        expectObservable(result$).toBe('11ms (a|)', { a: 'success' });
      });
    });

    it('should complete current cycle when tab becomes hidden mid-source', () => {
      hiddenNotifier$.next(false);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('---a--b--(c|)', { a: 'A', b: 'B', c: 'C' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 20 },
            pause: { whenHidden: true },
          }),
          take(1)
        );

        testScheduler.schedule(() => {
          hiddenNotifier$.next(true);
        }, 5);

        const expected = '---------(c|)';

        expectObservable(result$).toBe(expected, { c: 'C' });
      });
    });

    it('should complete current cycle when tab becomes hidden mid-source (interval mode)', () => {
      hiddenNotifier$.next(false);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('----a--b--(c|)', { a: 'A', b: 'B', c: 'C' });

        const result$ = source$.pipe(
          poll({
            type: 'interval',
            delay: { strategy: 'constant', time: 30 },
            pause: { whenHidden: true },
          }),
          take(1)
        );

        testScheduler.schedule(() => {
          hiddenNotifier$.next(true);
        }, 6);

        const expected = '----------(c|)';

        expectObservable(result$).toBe(expected, { c: 'C' });
      });
    });

    it('should pause next poll when tab becomes hidden after source completes', () => {
      hiddenNotifier$.next(false);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a---|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'dynamic', time: () => 10 },
            pause: { whenHidden: true },
          }),
          take(2)
        );

        testScheduler.schedule(() => {
          hiddenNotifier$.next(true);
        }, 2);

        expectObservable(result$).toBe('-----a-------', { a: 'success' });
      });
    });

    it('should pause polling when whenHidden is true and tab becomes hidden', () => {
      hiddenNotifier$.next(false);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a---|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pause: { whenHidden: true },
          }),
          take(2)
        );

        testScheduler.schedule(() => {
          hiddenNotifier$.next(true);
        }, 2);

        expectObservable(result$).toBe('-----a-------', { a: 'success' });
      });
    });

    it('should continue polling when whenHidden is false and tab becomes hidden', () => {
      hiddenNotifier$.next(false);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a---|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pause: { whenHidden: false },
          }),
          take(2)
        );

        testScheduler.schedule(() => {
          hiddenNotifier$.next(true);
        }, 2);

        expectObservable(result$).toBe('-----a--------------(a|)', { a: 'success' });
      });
    });
  });

  describe('notifier option', () => {
    it('should pause and resume based on custom notifier', () => {
      testScheduler.run(({ cold }) => {
        const notifier$ = cold('t-f-f', { t: true, f: false });
        const source$ = cold('-a|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pause: { notifier: notifier$, whenHidden: false },
          }),
          take(2)
        );

        const values: string[] = [];
        result$.subscribe((v) => values.push(v));

        testScheduler.flush();
        expect(values).toEqual(['success', 'success']);
      });
    });

    it('should combine notifier and whenHidden (both must be false to poll)', () => {
      hiddenNotifier$.next(false);

      testScheduler.run(({ cold }) => {
        const notifier$ = cold('f---t', { f: false, t: true });
        const source$ = cold('-a|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pause: { notifier: notifier$, whenHidden: true },
          }),
          take(2)
        );

        const values: string[] = [];
        result$.subscribe((v) => values.push(v));

        testScheduler.flush();
        expect(values).toEqual(['success']);
      });
    });

    it('should resume when both notifier and hidden become false', () => {
      hiddenNotifier$.next(true);

      testScheduler.run(({ cold }) => {
        const notifier$ = cold('t-f', { t: true, f: false });
        const source$ = cold('-a---|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pause: { notifier: notifier$, whenHidden: true },
          }),
          take(1)
        );

        const values: string[] = [];
        result$.subscribe((v) => values.push(v));

        testScheduler.schedule(() => {
          hiddenNotifier$.next(false);
        }, 5);

        testScheduler.flush();

        expect(values).toEqual(['success']);
      });
    });
  });
});
