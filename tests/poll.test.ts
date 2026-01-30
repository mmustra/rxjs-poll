import { delay, Observable, of, switchMap, take } from 'rxjs';
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

  it('should guarantee started cycle finishes when tab becomes hidden during multi-emission source', () => {
    setDocumentVisibility(true);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('---a--b--(c|)', { a: 'A', b: 'B', c: 'C' });

      const result$ = source$.pipe(
        poll({
          delay: {
            strategy: 'constant',
            time: 20,
          },
          pauseWhenHidden: true,
        }),
        take(1)
      );

      testScheduler.schedule(() => {
        setDocumentVisibility(false);
        document.dispatchEvent(new Event('visibilitychange'));
      }, 5);

      const expected = '---------(c|)';

      expectObservable(result$).toBe(expected, { c: 'C' });
    });
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

  describe('pauseWhenHidden: true vs false', () => {
    it('when pauseWhenHidden is true, polling pauses when tab becomes hidden (only one emission in window)', () => {
      setDocumentVisibility(true);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a---|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pauseWhenHidden: true,
          }),
          take(2)
        );

        testScheduler.schedule(() => {
          setDocumentVisibility(false);
          document.dispatchEvent(new Event('visibilitychange'));
        }, 2);

        // Tab hidden at frame 2 → next poll is paused; only first emission within 13 frames
        expectObservable(result$).toBe('-----a-------', { a: 'success' });
      });
    });

    it('when pauseWhenHidden is false, polling continues when tab becomes hidden (second emission on schedule)', () => {
      setDocumentVisibility(true);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('-a---|', { a: 'success' });

        const result$ = source$.pipe(
          poll({
            delay: { strategy: 'constant', time: 10 },
            pauseWhenHidden: false,
          }),
          take(2)
        );

        testScheduler.schedule(() => {
          setDocumentVisibility(false);
          document.dispatchEvent(new Event('visibilitychange'));
        }, 2);

        // Tab hidden at frame 2 is ignored → second poll after 10ms (frame 15), source completes at 20
        expectObservable(result$).toBe('-----a--------------(a|)', { a: 'success' });
      });
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

  it('should guarantee first emission when tab starts hidden (interval mode)', (done) => {
    jest.useFakeTimers();

    let pollCallCount = 0;
    const emissions: string[] = [];
    let testError: Error | undefined;

    setDocumentVisibility(false);
    document.dispatchEvent(new Event('visibilitychange'));

    const source$ = of('success').pipe(delay(10));

    const result$ = source$.pipe(
      poll({
        type: 'interval',
        delay: {
          strategy: 'dynamic',
          time: () => {
            pollCallCount++;
            return 100;
          },
        },
        pauseWhenHidden: true,
      }),
      take(2)
    );

    const subscription = result$.subscribe({
      next: (value) => emissions.push(value),
      complete: () => {
        try {
          expect(emissions).toEqual(['success', 'success']);
          expect(pollCallCount).toBeGreaterThanOrEqual(1);
          subscription.unsubscribe();
        } catch (err) {
          testError = err as Error;
        }
      },
      error: (err) => {
        testError = err as Error;
        subscription.unsubscribe();
      },
    });

    // Make document visible immediately to allow first emission (which is guaranteed behavior)
    setTimeout(() => {
      setDocumentVisibility(true);
      document.dispatchEvent(new Event('visibilitychange'));
    }, 10);

    try {
      // Advance timers to allow all emissions to complete
      jest.advanceTimersByTime(10); // Make visible
      jest.advanceTimersByTime(20); // First emission completes
      jest.advanceTimersByTime(100); // Wait for interval delay
      jest.advanceTimersByTime(1000); // Complete remaining timers and second emission
    } finally {
      jest.useRealTimers();
      if (testError) {
        done(testError);
      } else {
        done();
      }
    }
  });

  it('should guarantee started cycle finishes when tab becomes hidden during multi-emission source (interval mode)', (done) => {
    jest.useFakeTimers();

    setDocumentVisibility(true);

    const emissions: string[] = [];
    let emissionIndex = 0;
    let testError: Error | undefined;

    const source$ = new Observable<string>((subscriber) => {
      const values = ['A', 'B', 'C'];

      const emit = () => {
        if (emissionIndex < values.length) {
          setTimeout(() => {
            subscriber.next(values[emissionIndex]);
            emissionIndex++;
            if (emissionIndex < values.length) {
              emit();
            } else {
              subscriber.complete();
            }
          }, 20);
        }
      };

      emit();
    });

    const result$ = source$.pipe(
      poll({
        type: 'interval',
        delay: {
          strategy: 'constant',
          time: 300,
        },
        pauseWhenHidden: true,
      }),
      take(1)
    );

    const subscription = result$.subscribe({
      next: (value) => emissions.push(value),
      complete: () => {
        try {
          // Should only receive the last emission 'C' because take(1) completes after first value
          expect(emissions).toEqual(['C']);
          subscription.unsubscribe();
        } catch (err) {
          testError = err as Error;
        }
      },
      error: (err) => {
        testError = err as Error;
        subscription.unsubscribe();
      },
    });

    // Hide document after source has started emitting
    setTimeout(() => {
      setDocumentVisibility(false);
      document.dispatchEvent(new Event('visibilitychange'));
    }, 30);

    try {
      // Advance timers to let all emissions complete
      jest.advanceTimersByTime(20); // First emission 'A'
      jest.advanceTimersByTime(20); // Second emission 'B'
      jest.advanceTimersByTime(10); // Hide document
      jest.advanceTimersByTime(20); // Third emission 'C' (cycle completes despite being hidden)
      jest.advanceTimersByTime(1000); // Complete any remaining timers
    } finally {
      jest.useRealTimers();
      if (testError) {
        done(testError);
      } else {
        done();
      }
    }
  });

  it('should guarantee started cycle finishes when tab becomes hidden during multi-emission source (interval mode)', () => {
    setDocumentVisibility(true);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('----a--b--(c|)', { a: 'A', b: 'B', c: 'C' });

      const result$ = source$.pipe(
        poll({
          type: 'interval',
          delay: {
            strategy: 'constant',
            time: 30,
          },
          pauseWhenHidden: true,
        }),
        take(1)
      );

      testScheduler.schedule(() => {
        setDocumentVisibility(false);
        document.dispatchEvent(new Event('visibilitychange'));
      }, 6);

      const expected = '----------(c|)';

      expectObservable(result$).toBe(expected, { c: 'C' });
    });
  });
});
