import { EMPTY, MonoTypeOperatorFunction, of, retry, switchMap, tap, throwError, timer } from 'rxjs';

import { normalizeConfig, PollConfig, PollState, RetryKey } from './common/config';
import { getPoller$, visibilityState$ } from './common/observables';
import { Nil } from './common/utils';

/**
 * ### RxJS Poll Operator
 *
 * Polls source using "repeat" or "interval" approach. First emission is sent immediately, \
 * then the polling will start. Values will emit until stopped by the user.
 *
 * Read {@link https://www.npmjs.com/package/rxjs-poll|docs} for more info.
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
 * @param config - {@link PollConfig} object used for polling configuration
 *
 * @return A function that returns an Observable that will resubscribe to the source on \
 * complete or error
 */
export function poll<T>(config?: PollConfig<T> | Nil): MonoTypeOperatorFunction<T> {
  return (source$) => {
    const { type, retries, isBackgroundMode, isConsecutiveRule, getDelay } = normalizeConfig(config);
    const retryKey: RetryKey = isConsecutiveRule ? 'consecutiveRetries' : 'retries';
    const state: PollState<T> = {
      polls: 0,
      retries: 0,
      consecutiveRetries: 0,

      value: null as any,
      error: null,
    };

    const nextPollDelay = (value: T): number => {
      state.polls += 1;
      state.value = value;

      return getDelay(state);
    };

    const visibility$ = isBackgroundMode ? of(true) : visibilityState$;
    const poller$ = getPoller$(type, source$, nextPollDelay);

    return visibility$.pipe(
      switchMap((isVisible) =>
        isVisible
          ? poller$.pipe(
              retry({
                delay(error) {
                  state.error = error;
                  state.retries += 1;
                  state.consecutiveRetries += 1;

                  return state[retryKey] > retries ? throwError(() => error) : timer(getDelay(state));
                },
              }),
              tap(() => {
                state.error = null;
                state.consecutiveRetries = 0;
              })
            )
          : EMPTY
      )
    );
  };
}
