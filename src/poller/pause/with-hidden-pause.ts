import {
  exhaustMap,
  filter,
  fromEvent,
  map,
  NEVER,
  Observable,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

/**
 * Wraps a poller observable with document visibility control.
 * Lets the current cycle finish before pausing; pauses when hidden and resumes when visible.
 *
 * @param poller$ - The polling observable to wrap
 * @param cycler$ - Observable that emits when the current poll cycle completes
 * @param notifier$ - Optional visibility stream; uses document visibility when omitted
 * @returns Observable that emits values from poller$ with visibility-aware pausing
 */
export function withHiddenPause$<T>(
  poller$: Observable<T>,
  cycler$: Observable<0>,
  notifier$?: Observable<boolean>
): Observable<T> {
  const isHidden$ = notifier$ ?? getHiddenNotifier$();
  const pause$ = isHidden$.pipe(switchMap((isHidden) => (isHidden ? cycler$ : NEVER)));
  let isFirstEmission = true;

  return isHidden$.pipe(
    filter((isHidden) => !isHidden || isFirstEmission),
    exhaustMap(() => poller$.pipe(takeUntil(pause$))),
    tap(() => (isFirstEmission = false))
  );
}

let hiddenNotifier$: Observable<boolean> | undefined;

/**
 * Returns a shared observable that tracks document visibility (hidden vs visible).
 * Singleton: same observable is reused on subsequent calls.
 *
 * @returns Observable that emits true when document is hidden, false when visible
 */
export function getHiddenNotifier$(): Observable<boolean> {
  if (hiddenNotifier$) {
    return hiddenNotifier$;
  }

  hiddenNotifier$ = fromEvent(document, 'visibilitychange').pipe(
    startWith(null),
    map(() => document.hidden),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  return hiddenNotifier$;
}
