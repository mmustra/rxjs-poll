import { take, takeUntil } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import * as utils from '../../src/common/utils';
import { buildIntervalPoller$ } from '../../src/observables/interval-poller';
import { NormalizedPollConfig } from '../../src/types/config.type';
import { PollStateService } from '../../src/types/service.type';

jest.mock('../../src/common/utils', () => ({
  ...jest.requireActual('../../src/common/utils'),
  isBrowser: jest.fn(() => true),
}));

jest.mock('../../src/observables/document-visibility', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withDocumentVisibility$: (poller$: any, pauser$: any) => poller$.pipe(takeUntil(pauser$)),
}));

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

const createMockService = <T>(getDelayTime: () => number): PollStateService<T> => ({
  config: { pauseWhenHidden: false } as NormalizedPollConfig<T>,
  state: { value: undefined, error: undefined, pollCount: 0, retryCount: 0, consecutiveRetryCount: 0 },
  setValue: jest.fn(),
  setError: jest.fn(),
  resetError: jest.fn(),
  incrementPoll: jest.fn(),
  incrementRetry: jest.fn(),
  isRetryLimit: jest.fn(() => false),
  getDelayTime,
  getRetryTime: jest.fn(() => 1000),
});

describe('buildIntervalPoller$', () => {
  it('should emit at fixed intervals regardless of source duration', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const getDelayTime = jest.fn().mockReturnValue(10);
      const pollService = createMockService<string>(getDelayTime);

      const result$ = buildIntervalPoller$(source$, pollService).pipe(take(2));
      const expected = '2ms a 9ms (a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
      testScheduler.flush();
      expect(getDelayTime).toHaveBeenCalled();
    });
  });

  it('should support dynamic delay times', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      let callCount = 0;
      const getDelayTime = jest.fn(() => {
        callCount++;
        return callCount * 5;
      });
      const pollService = createMockService<string>(getDelayTime);

      const result$ = buildIntervalPoller$(source$, pollService).pipe(take(3));
      const expected = '2ms a 4ms a 9ms (a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should use getRetryTime override when error occurs with pauseWhenHidden (browser)', () => {
    testScheduler.run(({ cold }) => {
      const source$ = cold('-#', undefined, new Error('failure'));
      const getDelayTime = jest.fn(() => 10);
      const getRetryTime = jest.fn(() => 20);

      const pollService: PollStateService<string> = {
        config: { pauseWhenHidden: true } as NormalizedPollConfig<string>,
        state: { value: undefined, error: undefined, pollCount: 0, retryCount: 0, consecutiveRetryCount: 0 },
        setValue: jest.fn(),
        setError: jest.fn(),
        resetError: jest.fn(),
        incrementPoll: jest.fn(),
        incrementRetry: jest.fn(),
        isRetryLimit: jest.fn(() => false),
        getDelayTime,
        getRetryTime,
      };

      const result$ = buildIntervalPoller$(source$, pollService);

      result$.subscribe({
        error: () => {
          // ignore terminal error, we're only interested in retry behaviour
        },
      });

      testScheduler.flush();

      expect(getRetryTime).toHaveBeenCalled();
    });
  });

  it('should handle immediate next pause when source duration exceeds interval time (browser with pauseWhenHidden)', () => {
    const performanceSpy = jest.spyOn(performance, 'now');

    try {
      performanceSpy.mockImplementationOnce(() => 0).mockImplementationOnce(() => 250);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const getDelayTime = jest.fn(() => 50);
        const pollService: PollStateService<string> = {
          config: { pauseWhenHidden: true } as NormalizedPollConfig<string>,
          state: { value: undefined, error: undefined, pollCount: 0, retryCount: 0, consecutiveRetryCount: 0 },
          setValue: jest.fn(),
          setError: jest.fn(),
          resetError: jest.fn(),
          incrementPoll: jest.fn(),
          incrementRetry: jest.fn(),
          isRetryLimit: jest.fn(() => false),
          getDelayTime,
          getRetryTime: jest.fn(() => 1000),
        };

        const result$ = buildIntervalPoller$(source$, pollService).pipe(take(1));

        const expected = '2ms (a|)';
        expectObservable(result$).toBe(expected, { a: 'value' });
      });
    } finally {
      performanceSpy.mockRestore();
    }
  });

  it('should schedule pause with positive diffTime when source duration is shorter than interval (browser with pauseWhenHidden)', () => {
    const performanceSpy = jest.spyOn(performance, 'now');

    try {
      performanceSpy.mockImplementationOnce(() => 0).mockImplementationOnce(() => 50);

      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const getDelayTime = jest.fn(() => 200);
        const pollService: PollStateService<string> = {
          config: { pauseWhenHidden: true } as NormalizedPollConfig<string>,
          state: { value: undefined, error: undefined, pollCount: 0, retryCount: 0, consecutiveRetryCount: 0 },
          setValue: jest.fn(),
          setError: jest.fn(),
          resetError: jest.fn(),
          incrementPoll: jest.fn(),
          incrementRetry: jest.fn(),
          isRetryLimit: jest.fn(() => false),
          getDelayTime,
          getRetryTime: jest.fn(() => 1000),
        };

        const result$ = buildIntervalPoller$(source$, pollService).pipe(take(1));

        const expected = '2ms (a|)';
        expectObservable(result$).toBe(expected, { a: 'value' });
      });
    } finally {
      performanceSpy.mockRestore();
    }
  });

  it('should use non-visibility interval path when not in browser', () => {
    const isBrowserSpy = jest.spyOn(utils, 'isBrowser').mockReturnValue(false);

    try {
      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('--a|', { a: 'value' });
        const getDelayTime = jest.fn(() => 10);
        const pollService: PollStateService<string> = {
          config: { pauseWhenHidden: true } as NormalizedPollConfig<string>,
          state: { value: undefined, error: undefined, pollCount: 0, retryCount: 0, consecutiveRetryCount: 0 },
          setValue: jest.fn(),
          setError: jest.fn(),
          resetError: jest.fn(),
          incrementPoll: jest.fn(),
          incrementRetry: jest.fn(),
          isRetryLimit: jest.fn(() => false),
          getDelayTime,
          getRetryTime: jest.fn(() => 1000),
        };

        const result$ = buildIntervalPoller$(source$, pollService).pipe(take(2));
        const expected = '2ms a 9ms (a|)';

        expectObservable(result$).toBe(expected, { a: 'value' });
      });
    } finally {
      isBrowserSpy.mockRestore();
    }
  });
});
