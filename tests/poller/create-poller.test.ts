import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { extendConfig } from '../../src/common/config';
import { createPoller$ } from '../../src/poller/create-poller';
import { createTestScheduler } from '../_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  jest.clearAllMocks();
});

describe('createPoller$', () => {
  it('should handle repeat type', () => {
    const config = extendConfig<string>({ type: 'repeat', delay: { strategy: 'constant', time: 10 } });

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });

      const result$ = createPoller$(source$, config).pipe(take(3));
      const expected = '---a 9ms ---a 9ms ---(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle interval type', () => {
    const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });

      const result$ = createPoller$(source$, config).pipe(take(2));

      const expected = '---a 6ms ---(a|)';
      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });
});
