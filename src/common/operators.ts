import { MonoTypeOperatorFunction, retry, tap, throwError, timer } from 'rxjs';

export function retryPoll<T>(
  isLimit: () => boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTime: (error: any) => number,
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
