import { MonoTypeOperatorFunction, retry, tap, throwError, timer } from 'rxjs';

import { PollStateService } from '../types/service.type';

/**
 * Custom retry operator for polling with configurable retry logic.
 * Handles retry counting, limit checking, and error state management.
 * @param pollService - Poll state service managing configuration and state
 * @param getRetryTime - Optional function to override retry time calculation
 * @returns Operator function that adds retry logic to the source observable
 */
export function retryPoll<T>(
  pollService: PollStateService<T>,
  getRetryTime?: () => number
): MonoTypeOperatorFunction<T> {
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
