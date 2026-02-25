import { NEVER, of, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { withNotifierPause$ } from '../../../src/poller/pause/with-notifier-pause';
import { createTestScheduler } from '../../_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
});

describe('withNotifierPause$', () => {
  it('should emit from poller$ when notifier emits false', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const notifier$ = of(false);
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const result$ = withNotifierPause$(poller$, notifier$).pipe(take(1));

      expectObservable(result$).toBe('(a|)', { a: 'A' });
    });
  });

  it('should not emit from poller$ when notifier emits true', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const notifier$ = of(true);
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const result$ = withNotifierPause$(poller$, notifier$).pipe(take(1));
      expectObservable(result$).toBe('---------');
    });
  });

  it('should emit from poller$ if notifier never emits any value', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const notifier$ = NEVER;
      const poller$ = cold('a|', { a: 'A' });
      const result$ = withNotifierPause$(poller$, notifier$).pipe(take(1));

      expectObservable(result$).toBe('(a|)', { a: 'A' });
    });
  });

  it('should switch to poller$ when notifier switches from true to false', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const notifier$ = hot('t------f-|', { t: true, f: false });
      const poller$ = cold('a|', { a: 'A' });
      const result$ = withNotifierPause$(poller$, notifier$).pipe(take(1));
      expectObservable(result$).toBe('-------(a|)', { a: 'A' });
    });
  });

  it('should pause when notifier emits true after starting', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const notifier$ = hot('f----t--', { f: false, t: true });
      const poller$ = cold('a-b-c-d-e|', { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' });
      const result$ = withNotifierPause$(poller$, notifier$).pipe(take(3));
      expectObservable(result$).toBe('a-b-(c|)', { a: 'A', b: 'B', c: 'C' });
    });
  });

  it('should not re-trigger switchMap when notifier emits duplicate false (distinctUntilChanged)', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const notifier$ = hot('f-f-f-f-f|', { f: false });
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const result$ = withNotifierPause$(poller$, notifier$).pipe(take(1));

      expectObservable(result$).toBe('(a|)', { a: 'A' });
    });
  });

  it('should not re-trigger switchMap when notifier emits duplicate true (distinctUntilChanged)', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const notifier$ = hot('t-t-t-t-t|', { t: true });
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const result$ = withNotifierPause$(poller$, notifier$);

      expectObservable(result$).toBe('---------');
    });
  });
});
