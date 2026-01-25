import { Observable, share, takeLast, tap } from 'rxjs';

import { ExtendedPollConfig } from '../types/config.type';
import { NextTimeProducer } from '../types/observables.type';
import { PollState, RetryKey } from '../types/poll.type';
import { buildIntervalPoller$ } from './interval-poller';
import { buildRepeatPoller$ } from './repeat-poller';
import { retryPoll } from './retry-operator';

/**
 * Creates a factory function that builds polling observables with retry logic.
 * @param source$ - The source observable to poll
 * @param config - See {@link ExtendedPollConfig}
 * @returns Factory function that creates a poller observable from poll state
 */
export function getPollerFactory<T>(
  source$: Observable<T>,
  { getDelayTime, getRetryTime, pauseWhenHidden, retry, type }: ExtendedPollConfig<T>
): (state: PollState<T>) => Observable<T> {
  const retryKey: RetryKey = retry.consecutiveOnly ? 'consecutiveRetryCount' : 'retryCount';

  let lastValue: T;
  const completed$ = source$.pipe(
    takeLast(1),
    tap((value) => {
      lastValue = value;
    }),
    share()
  );

  return function createPoller(state: PollState<T>) {
    const nextDelayTime: NextTimeProducer<T> = (value) => {
      state.pollCount += 1;
      state.value = value;

      return getDelayTime(state);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextRetryTime: NextTimeProducer<any> = (error) => {
      state.error = error;

      return getRetryTime(state);
    };

    const isRetryLimit = (): boolean => {
      state.retryCount += 1;
      state.consecutiveRetryCount += 1;

      return state[retryKey] > retry.limit;
    };

    const resetError = (): void => {
      state.error = undefined;
      state.consecutiveRetryCount = 0;
    };

    const poller$ =
      type === 'repeat'
        ? buildRepeatPoller$(completed$, {
            nextDelayTime: () => nextDelayTime(lastValue),
            pauseWhenHidden,
          })
        : buildIntervalPoller$(completed$, {
            nextDelayTime: () => nextDelayTime(lastValue),
            pauseWhenHidden,
          });

    return poller$.pipe(retryPoll(nextRetryTime, isRetryLimit, resetError));
  };
}
