import { defaultState } from '../constants/state.const';
import { ExtendedPollConfig, NormalizedPollConfig } from '../types/config.type';
import { PollState } from '../types/poll.type';
import { RetryKey } from '../types/retry.type';
import { PollStateService } from '../types/service.type';

/**
 * Creates a polling state service that manages poll state and provides methods for state manipulation.
 * @param extendedConfig - Extended poll configuration with computed time producer functions
 * @returns Poll state service with methods for managing poll state and retrieving timing values
 */
export function createPollService<T>(extendedConfig: ExtendedPollConfig<T>): PollStateService<T> {
  const state: PollState<T> = { ...defaultState };

  return {
    get config(): NormalizedPollConfig<T> {
      return extendedConfig;
    },

    get state(): PollState<T> {
      return state;
    },

    setValue: (value: T): void => {
      state.value = value;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setError: (error: any): void => {
      state.error = error;
    },

    resetError: (): void => {
      state.error = undefined;
      state.consecutiveRetryCount = 0;
    },

    incrementPoll: (): void => {
      state.pollCount += 1;
    },

    incrementRetry: (): void => {
      state.retryCount += 1;
      state.consecutiveRetryCount += 1;
    },

    isRetryLimit: (): boolean => {
      const retryKey: RetryKey = extendedConfig.retry.consecutiveOnly ? 'consecutiveRetryCount' : 'retryCount';

      return state[retryKey] > extendedConfig.retry.limit;
    },

    getDelayTime: (): number => {
      return extendedConfig.getDelayTime(state);
    },

    getRetryTime: (): number => {
      return extendedConfig.getRetryTime(state);
    },
  };
}
