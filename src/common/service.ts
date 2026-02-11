import { defaultState } from '../constants/state.const';
import { ExtendedPollConfig, NormalizedPollConfig } from '../types/config.type';
import { PollState } from '../types/poll.type';
import { RetryKey } from '../types/retry.type';

/**
 * Polling state service that manages poll state and provides methods for state manipulation.
 */
export class PollService<T> {
  private readonly _config: ExtendedPollConfig<T>;
  private readonly _state: PollState<T>;

  constructor(extendedConfig: ExtendedPollConfig<T>) {
    this._config = extendedConfig;
    this._state = { ...defaultState };
  }

  get config(): Readonly<NormalizedPollConfig<T>> {
    return this._config;
  }

  get state(): Readonly<PollState<T>> {
    return this._state;
  }

  setValue(value: T): void {
    this._state.value = value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError(error: any): void {
    this._state.error = error;
  }

  resetError(): void {
    this._state.error = undefined;
    this._state.consecutiveRetryCount = 0;
  }

  incrementPoll(): void {
    this._state.pollCount += 1;
  }

  incrementRetry(): void {
    this._state.retryCount += 1;
    this._state.consecutiveRetryCount += 1;
  }

  isRetryLimit(): boolean {
    const retryKey: RetryKey = this._config.retry.consecutiveOnly ? 'consecutiveRetryCount' : 'retryCount';
    return this._state[retryKey] > this._config.retry.limit;
  }

  getDelayTime(): number {
    return this._config.getDelayTime(this._state);
  }

  getRetryTime(): number {
    return this._config.getRetryTime(this._state);
  }
}
