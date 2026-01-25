import { defer, Observable, of, switchMap, timer } from 'rxjs';

import { isBrowser } from '../common/utils';
import { PollerBuilderOptions } from '../types/observables.type';
import { withDocumentVisibility$ } from './document-visibility';
import { repeatWith$ } from './repeat-with';

/**
 * Builds an interval-based poller that polls at fixed intervals regardless of source duration.
 * If a source takes longer than the interval, it will be interrupted.
 * @param sharedSource$ - The shared source observable to poll
 * @param options - See {@link PollerBuilderOptions}
 * @returns Observable that emits values from the source at fixed intervals
 */
export function buildIntervalPoller$<T>(
  sharedSource$: Observable<T>,
  { nextDelayTime, pauseWhenHidden }: PollerBuilderOptions<T>
): Observable<T> {
  if (!isBrowser() || !pauseWhenHidden) {
    return repeatWith$(of(null), () => nextDelayTime()).pipe(switchMap(() => sharedSource$));
  }

  let currentDelay = 0;
  const trigger$ = repeatWith$(of(null), () => {
    currentDelay = nextDelayTime();
    return currentDelay;
  });
  const pauser$ = defer(() => timer(currentDelay));

  return withDocumentVisibility$(trigger$, pauser$).pipe(switchMap(() => sharedSource$));
}
