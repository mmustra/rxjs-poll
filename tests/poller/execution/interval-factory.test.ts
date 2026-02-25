import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { extendConfig } from '../../../src/common/config';
import { intervalPollerFactory } from '../../../src/poller/execution/interval-factory';
import { PollService } from '../../../src/poller/execution/poll-service';
import { createTestScheduler } from '../../_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  jest.clearAllMocks();
});

describe('intervalPollerFactory', () => {
  describe('createDirectPoller$', () => {
    it('should emit from source with delay between polls', () => {
      const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });
      const pollService = new PollService(config);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const result$ = intervalPollerFactory.createDirectPoller$(source$, pollService).pipe(take(2));
        expectObservable(result$).toBe('--a 9ms (a|)', { a: 'value' });
      });
    });
  });

  describe('createCycleControl$', () => {
    it('should return poller$ and cycler$, and cycler$ should use sourceStartTime/sourceEndTime', () => {
      const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });
      const pollService = new PollService(config);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const { poller$, cycler$ } = intervalPollerFactory.createCycleControl$(source$, pollService);
        const pollerResult$ = poller$.pipe(take(2));
        const cyclerResult$ = cycler$.pipe(take(1));

        expectObservable(pollerResult$).toBe('--a 9ms (a|)', { a: 'value' });
        expectObservable(cyclerResult$).toBe('3ms (n|)', { n: 0 });
      });
    });

    it('should use getRetryTime callback when source errors and retries', () => {
      const config = extendConfig<string>({
        type: 'interval',
        delay: { strategy: 'constant', time: 10 },
        retry: { strategy: 'constant', time: 5, limit: 2 },
      });
      const pollService = new PollService(config);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--#', undefined, new Error('fail'));
        const result$ = intervalPollerFactory.createCycleControl$(source$, pollService).poller$.pipe(take(1));
        expectObservable(result$).toBe('-- 5ms ---------#', undefined, new Error('fail'));
      });
    });
  });
});
