import { EMPTY, MonoTypeOperatorFunction, of, switchMap } from 'rxjs';

import { extendConfig } from './common/config';
import { getPollerFactory$, visibilityState$ } from './common/observables';
import { retryPoll } from './common/operators';
import { PollConfig } from './types/config.type';
import { PollState, RetryKey } from './types/poll.type';
import { Nil } from './types/utils.type';

/**
 * ### RxJS Poll Operator
 *
 * Automatically re-executes a source observable after completion, \
 * using delay strategies and retry mechanisms for handling errors.
 *
 * #### Example
 *
 * ```ts
 * import { poll } from 'rxjs-poll';
 * import { takeWhile } from 'rxjs';
 *
 * request$
 *   .pipe(
 *     poll(),
 *     takeWhile(({ isDone }) => !isDone, true)
 *   )
 *   .subscribe();
 * ```
 *
 * @param config - {@link PollConfig} object used for configuration
 *
 * @return Function that returns an Observable handling resubscription \
 * to the source on complete or error
 */
export function poll<T>(config?: PollConfig<T> | Nil): MonoTypeOperatorFunction<T> {
  return (source$) => {
    const { type, retry, pauseWhenHidden, getDelayTime, getRetryTime } = extendConfig(config);
    const retryKey: RetryKey = retry.consecutiveOnly ? 'consecutiveRetryCount' : 'retryCount';
    const state: PollState<T> = {
      value: undefined,
      error: undefined,
      pollCount: 0,
      retryCount: 0,
      consecutiveRetryCount: 0,
    };

    const nextDelayTime = (value: T): number => {
      state.pollCount += 1;
      state.value = value;

      return getDelayTime(state);
    };

    const nextRetryTime = (error: any): number => {
      state.error = error;

      return getRetryTime(state);
    };

    const resetError = (): void => {
      state.error = undefined;
      state.consecutiveRetryCount = 0;
    };

    const isRetryLimit = (): boolean => {
      state.retryCount += 1;
      state.consecutiveRetryCount += 1;

      return state[retryKey] > retry.limit;
    };

    const visibility$ = pauseWhenHidden ? visibilityState$ : of(true);
    const poller$ = getPollerFactory$(type, source$)(nextDelayTime);

    return visibility$.pipe(
      switchMap((isVisible) => (isVisible ? poller$.pipe(retryPoll(isRetryLimit, nextRetryTime, resetError)) : EMPTY))
    );
  };
}
