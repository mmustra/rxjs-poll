import { TestScheduler } from 'rxjs/testing';

import { PollService } from '../../src/common/service';
import { retryPoll } from '../../src/operators/retry-poll.operator';
import { ExtendedPollConfig } from '../../src/types/config.type';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

const createMockConfig = <T>(overrides?: Partial<ExtendedPollConfig<T>>): ExtendedPollConfig<T> => ({
  type: 'repeat',
  delay: { strategy: 'constant', time: 1000 },
  retry: { strategy: 'constant', time: 1000, limit: 10, consecutiveOnly: true },
  pauseWhenHidden: false,
  getDelayTime: () => 1000,
  getRetryTime: () => 100,
  ...overrides,
});

describe('retryPoll', () => {
  it('should emit value and reset error on success', () => {
    const config = createMockConfig<string>({ getRetryTime: () => 100 });
    const pollService = new PollService(config);
    const resetErrorSpy = jest.spyOn(pollService, 'resetError');

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|');
      const expected = '--a|';

      const result$ = source$.pipe(retryPoll(pollService));

      expectObservable(result$).toBe(expected, { a: 'a' });
    });

    expect(resetErrorSpy).toHaveBeenCalled();
  });

  it('should throw error immediately when limit is reached', () => {
    const getRetryTime = jest.fn();
    const config = createMockConfig<string>({
      retry: { strategy: 'constant', time: 1000, limit: 0, consecutiveOnly: true },
      getRetryTime,
    });
    const pollService = new PollService(config);

    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '--#';

      const result$ = source$.pipe(retryPoll(pollService));

      expectObservable(result$).toBe(expected, undefined, error);
    });

    expect(getRetryTime).not.toHaveBeenCalled();
  });

  it('should retry with delay when error occurs and limit not reached', () => {
    const getRetryTime = jest.fn().mockReturnValue(100);
    const config = createMockConfig<string>({
      retry: { strategy: 'constant', time: 1000, limit: 1, consecutiveOnly: true },
      getRetryTime,
    });
    const pollService = new PollService(config);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--#', undefined, new Error('test error'));
      const expected = '-- 100ms --#';

      const result$ = source$.pipe(retryPoll(pollService));

      expectObservable(result$).toBe(expected, undefined, new Error('test error'));
    });

    expect(getRetryTime).toHaveBeenCalledTimes(1);
  });
});
