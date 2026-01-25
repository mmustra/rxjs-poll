import { MonoTypeOperatorFunction, retry, tap, throwError, timer } from 'rxjs';

/**
 * Custom retry operator for polling with configurable retry logic.
 * @param getTime - Function that returns retry delay in milliseconds based on error
 * @param isLimit - Function that checks if retry limit has been reached
 * @param resetError - Function that resets error state after successful emission
 * @returns Operator function that adds retry logic to the source observable
 * @note Parameter order changed from previous version: getTime is now first, followed by isLimit
 */
export function retryPoll<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTime: (error: any) => number,
  isLimit: () => boolean,
  resetError: () => void
): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(
      retry({
        delay: (error) => (isLimit() ? throwError(() => error) : timer(getTime(error))),
      }),
      tap(() => resetError())
    );
}
