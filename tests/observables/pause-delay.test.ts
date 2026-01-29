import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { getPauseDelay$ } from '../../src/observables/pause-delay';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
});

describe('pause-delay', () => {
  describe('getPauseDelay$', () => {
    describe('interval-style (time and source times)', () => {
      it('should emit null after delay when computed delay is positive', () => {
        testScheduler.run(({ expectObservable }) => {
          const result$ = getPauseDelay$({
            time: 200,
            sourceStartTime: 0,
            sourceEndTime: 50,
          }).pipe(take(1));
          expectObservable(result$).toBe('50ms (n|)', { n: null });
        });
      });

      it('should emit null immediately when computed delay is zero or negative', () => {
        testScheduler.run(({ expectObservable }) => {
          const result$ = getPauseDelay$({
            time: 50,
            sourceStartTime: 0,
            sourceEndTime: 250,
          }).pipe(take(1));
          expectObservable(result$).toBe('(n|)', { n: null });
        });
      });
    });

    describe('repeat-style (time only)', () => {
      it('should emit null after delay when time > timingToleranceMs', () => {
        testScheduler.run(({ expectObservable }) => {
          const result$ = getPauseDelay$({ time: 200 }).pipe(take(1));
          expectObservable(result$).toBe('100ms (n|)', { n: null });
        });
      });

      it('should emit null immediately when time <= timingToleranceMs', () => {
        testScheduler.run(({ expectObservable }) => {
          const result$ = getPauseDelay$({ time: 25 }).pipe(take(1));
          expectObservable(result$).toBe('(n|)', { n: null });
        });
      });
    });
  });
});
