import { Observable, repeat, timer } from 'rxjs';

/**
 * Repeats the source observable with a delay between each repetition.
 * @param source$ - The source observable to repeat
 * @param getTime - Function that returns the delay time in milliseconds
 * @returns Observable that repeats the source with delays
 */
export function repeatWith$<T>(source$: Observable<T>, getTime: () => number): Observable<T> {
  return source$.pipe(
    repeat({
      delay: () => timer(getTime()),
    })
  );
}
