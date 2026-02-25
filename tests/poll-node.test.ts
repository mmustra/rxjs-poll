/**
 * @jest-environment node
 */

import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { poll } from '../src/poll';
import { createTestScheduler } from './_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
});

describe('poll operator - extras', () => {
  it('should always work in node env (pause: { whenHidden: true })', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('-a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          pause: { whenHidden: true },
        }),
        take(2)
      );

      expectObservable(result$).toBe('--a--(a|)', { a: 'success' });
    });
  });

  it('should always work in node env (pause: { whenHidden: false })', () => {
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

  it('should respect pause.notifier in node env (various toggles)', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const notifier$ = cold('t-f-t---f|', { f: false, t: true });
      const source$ = cold('a|', { a: 'success' });

      const result$ = source$.pipe(
        poll({
          delay: { strategy: 'constant', time: 1 },
          pause: { notifier: notifier$, whenHidden: false },
        }),
        take(3)
      );
      expectObservable(result$).toBe('---a-----a-(a|)', { a: 'success' });
    });
  });
});
