import { distinctUntilChanged, merge, NEVER, Observable, race, share, switchMap, take } from 'rxjs';

import { defaultNotifier$ } from '../../constants/notifier.const';

/**
 * Wraps a poller with a notifier: when notifier$ emits true polling is paused, when false it resumes.
 * If notifier$ never emits, polling starts (same as resume).
 *
 * @param poller$ - The polling observable to wrap
 * @param notifier$ - Emits true to pause, false to resume
 * @returns Observable that emits from poller$ when not paused
 */
export function withNotifierPause$<T>(poller$: Observable<T>, notifier$: Observable<boolean>): Observable<T> {
  const sharedNotifier$ = notifier$.pipe(share());
  const initialNotifier$ = race(sharedNotifier$, defaultNotifier$).pipe(take(1));
  /**
   * NOTICE: merge(initialNotifier$, sharedNotifier$) -> initialNotifier$.sharedNotifier$ wins; merge($sharedNotifier$, $initialNotifier$) -> initialNotifier$.defaultNotifier$ wins (sometimes)
   * - Order matters as share() uses a plain Subject (no replay)
   * - Subscribers of sharedNotifier$ are not direct subs to notifier$; if notifier$ is a BehaviorSubject, "last value" only
   * applies to direct subs, so the second sub (race) gets nothing -> defaultNotifier$ wins -> spurious false
   * - With of(x), wrong order can appear to work: source completes, share() resets, second sub gets a fresh run
   * - shareReplay(1) would replay to late subs; we use share() to avoid holding state
   */
  return merge(initialNotifier$, sharedNotifier$).pipe(
    distinctUntilChanged(),
    switchMap((isPaused) => (isPaused ? NEVER : poller$))
  );
}
