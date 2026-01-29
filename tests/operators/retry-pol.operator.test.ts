import { TestScheduler } from 'rxjs/testing';

import { retryPoll } from '../../src/operators/retry-pol.operator';
import { NormalizedPollConfig } from '../../src/types/config.type';
import { PollStateService } from '../../src/types/service.type';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

const createMockService = <T>(isRetryLimit: () => boolean, getRetryTime: () => number): PollStateService<T> => ({
  config: { pauseWhenHidden: false } as NormalizedPollConfig<T>,
  state: { value: undefined, error: undefined, pollCount: 0, retryCount: 0, consecutiveRetryCount: 0 },
  setValue: jest.fn(),
  setError: jest.fn(),
  resetError: jest.fn(),
  isRetryLimit,
  getDelayTime: jest.fn(() => 1000),
  getRetryTime,
  incrementPoll: jest.fn(),
  incrementRetry: jest.fn(),
});

describe('retryPoll', () => {
  it('should emit value and reset error on success', () => {
    const pollService = createMockService<string>(
      () => false,
      () => 100
    );

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|');
      const expected = '--a|';

      const result$ = source$.pipe(retryPoll(pollService));

      expectObservable(result$).toBe(expected, { a: 'a' });
    });

    expect(pollService.resetError).toHaveBeenCalled();
  });

  it('should throw error immediately when limit is reached', () => {
    const isRetryLimit = jest.fn().mockReturnValue(true);
    const getRetryTime = jest.fn();
    const pollService = createMockService<string>(isRetryLimit, getRetryTime);

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
    let callCount = 0;
    const isRetryLimit = jest.fn(() => ++callCount === 2);
    const getRetryTime = jest.fn().mockReturnValue(100);
    const pollService = createMockService<string>(isRetryLimit, getRetryTime);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--#', undefined, new Error('test error'));
      const expected = '-- 100ms --#';

      const result$ = source$.pipe(retryPoll(pollService));

      expectObservable(result$).toBe(expected, undefined, new Error('test error'));
    });

    expect(isRetryLimit).toHaveBeenCalledTimes(2);
    expect(getRetryTime).toHaveBeenCalledTimes(1);
  });
});
