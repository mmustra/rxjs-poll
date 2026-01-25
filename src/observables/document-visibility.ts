import {
  combineLatest,
  exhaustMap,
  filter,
  fromEvent,
  map,
  Observable,
  shareReplay,
  startWith,
  take,
  takeUntil,
  tap,
} from 'rxjs';

import { isDocumentVisible } from '../common/utils';

/**
 * Wraps a poller observable with document visibility control.
 * Guarantees first emission regardless of visibility state, then pauses/resumes based on document visibility.
 * @param poller$ - The polling observable to wrap
 * @param pauser$ - Observable that determines when to pause (after first emission)
 * @returns Observable that emits values from poller$ with visibility-aware pausing
 * @note First emission is always guaranteed, even if document is hidden
 */
export function withDocumentVisibility$<T>(poller$: Observable<T>, pauser$: Observable<unknown>): Observable<T> {
  const visibility$ = getDocumentVisibility$();
  const pause$ = combineLatest([visibility$, pauser$.pipe(take(1))]).pipe(filter(([isVisible]) => !isVisible));
  let emissionStarted = true;

  return visibility$.pipe(
    filter((isVisible) => isVisible || emissionStarted),
    exhaustMap(() => poller$.pipe(takeUntil(pause$))),
    tap(() => (emissionStarted = false))
  );
}

let documentVisibility$: Observable<boolean> | undefined;

/**
 * Returns a shared observable that tracks document visibility state.
 * Creates a singleton observable on first call and reuses it for subsequent calls.
 * @returns Observable that emits true when document is visible, false when hidden
 */
export function getDocumentVisibility$(): Observable<boolean> {
  if (documentVisibility$) {
    return documentVisibility$;
  }

  documentVisibility$ = fromEvent(document, 'visibilitychange').pipe(
    startWith(null),
    map(isDocumentVisible),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  return documentVisibility$;
}
