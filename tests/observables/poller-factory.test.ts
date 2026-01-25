import { switchMap, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { extendConfig } from '../../src/common/config';
import { createState } from '../../src/common/state';
import { getPollerFactory } from '../../src/observables/poller-factory';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

describe('getPoller$', () => {
  it('should handle repeat type', () => {
    const config = extendConfig<string>({ type: 'repeat', delay: { strategy: 'constant', time: 10 } });
    const state = createState<string>();

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });

      const result$ = getPollerFactory(source$, config)(state).pipe(take(3));
      const expected = '---a 9ms ---a 9ms ---(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle interval type', () => {
    const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });
    const state = createState<string>();

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });

      const result$ = getPollerFactory(source$, config)(state).pipe(take(2));

      const expected = '---a 6ms ---(a|)';
      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle interval type to interrupt incomplete sources', () => {
    const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });
    const state = createState<string>();
    let subscriptionCount = 0;

    testScheduler.run(({ cold, expectObservable }) => {
      const createSource = () => {
        subscriptionCount++;

        if (subscriptionCount === 1) {
          return cold('-----a|', { a: 'initial' });
        } else if (subscriptionCount === 2) {
          return cold('---------------a|', { a: 'interrupted' });
        } else {
          return cold('-----a|', { a: 'success' });
        }
      };

      const source$ = cold('a|', { a: 'trigger' }).pipe(switchMap(() => createSource()));
      const result$ = getPollerFactory(source$, config)(state).pipe(take(2));
      const expected = '6ms a 19ms (b|)';

      expectObservable(result$).toBe(expected, { a: 'initial', b: 'success' });
    });
  });
});
