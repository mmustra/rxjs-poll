import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { extendConfig } from '../../../src/common/config';
import { PollService } from '../../../src/poller/execution/poll-service';
import { repeatPollerFactory } from '../../../src/poller/execution/repeat-factory';
import { createTestScheduler } from '../../_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  jest.clearAllMocks();
});

describe('repeatPollerFactory', () => {
  describe('createDirectPoller$', () => {
    it('should emit from source with delay between repetitions', () => {
      const config = extendConfig<string>({ type: 'repeat', delay: { strategy: 'constant', time: 10 } });
      const pollService = new PollService(config);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const result$ = repeatPollerFactory.createDirectPoller$(source$, pollService).pipe(take(2));
        expectObservable(result$).toBe('--a 10ms --(a|)', { a: 'value' });
      });
    });
  });

  describe('createCycleControl$', () => {
    it('should return poller$ and cycler$', () => {
      const config = extendConfig<string>({ type: 'repeat', delay: { strategy: 'constant', time: 10 } });
      const pollService = new PollService(config);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const { poller$, cycler$ } = repeatPollerFactory.createCycleControl$(source$, pollService);
        const pollerResult$ = poller$.pipe(take(2));
        const cyclerResult$ = cycler$.pipe(take(1));

        expectObservable(pollerResult$).toBe('--a 10ms --(a|)', { a: 'value' });
        expectObservable(cyclerResult$).toBe('---(n|)', { n: 0 });
      });
    });
  });
});
