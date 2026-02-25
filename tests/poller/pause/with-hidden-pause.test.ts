import { of, switchMap, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { getHiddenNotifier$, withHiddenPause$ } from '../../../src/poller/pause/with-hidden-pause';
import { createTestScheduler } from '../../_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  jest.clearAllMocks();
});

describe('getHiddenNotifier$', () => {
  it('should reflect document.hidden when used with real document', () => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });

    testScheduler.run(({ expectObservable }) => {
      const source$ = getHiddenNotifier$().pipe(
        switchMap((isHidden) => (isHidden ? of('a') : of('b'))),
        take(1)
      );

      expectObservable(source$).toBe('(b|)', { b: 'b' });
    });
  });
});

describe('withHiddenPause$', () => {
  it('should run when notifier is false', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const notifier$ = of(false);
      const poller$ = cold('a|', { a: 'value' });
      const cycler$ = cold('--x', { x: 0 as 0 });
      const result$ = withHiddenPause$(poller$, cycler$, notifier$).pipe(take(1));

      expectObservable(result$).toBe('(a|)', { a: 'value' });
    });
  });

  it('should pause when notifier is true (takeUntil pauser$)', () => {
    const notifier$ = of(true);
    testScheduler.run(({ cold, expectObservable }) => {
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const cycler$ = cold('---x', { x: 0 as 0 });
      const result$ = withHiddenPause$(poller$, cycler$, notifier$);

      expectObservable(result$).toBe('a-b|', { a: 'A', b: 'B' });
    });
  });

  it('should resume new run when notifier switches from true to false', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const notifier$ = cold('t-f', { t: true, f: false });
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const cycler$ = cold('x', { x: 0 as 0 });
      const result$ = withHiddenPause$(poller$, cycler$, notifier$).pipe(take(2));

      expectObservable(result$).toBe('a-(a|)', { a: 'A' });
    });
  });
});
