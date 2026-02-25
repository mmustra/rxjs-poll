import { MonoTypeOperatorFunction, retry, tap, throwError, timer } from 'rxjs';

import { PollService } from './poll-service';

/**
 * Retry operator for polling: retries on error with configurable delay and limit.
 *
 * @param pollService - Poll service for state and retry time/limit
 * @param getRetryTime - Optional function to override retry delay; uses pollService when omitted
 * @returns MonoTypeOperatorFunction that retries on error and resets error state on success
 */
export function retryPoll<T>(pollService: PollService<T>, getRetryTime?: () => number): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(
      retry({
        delay: (error) => {
          pollService.incrementRetry();

          if (pollService.isRetryLimit()) {
            return throwError(() => error);
          }

          pollService.setError(error);

          return timer(getRetryTime ? getRetryTime() : pollService.getRetryTime());
        },
      }),
      tap(() => pollService.resetError())
    );
}
