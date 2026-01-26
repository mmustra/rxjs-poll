import { auditTime, finalize, Observable, Subject } from 'rxjs';

import { isBrowser } from '../common/utils';
import { PollerBuilderOptions } from '../types/observables.type';
import { withDocumentVisibility$ } from './document-visibility';
import { repeatWith$ } from './repeat-with';

/**
 * Builds a repeat-based poller that waits for source completion before starting the next delay.
 * Each poll cycle completes the source before scheduling the next poll.
 * @param source$ - The source observable to poll
 * @param options - See {@link PollerBuilderOptions}
 * @returns Observable that emits values from the source with delays between completions
 */
export function buildRepeatPoller$<T>(
  source$: Observable<T>,
  { nextDelayTime, pauseWhenHidden }: PollerBuilderOptions<T>
): Observable<T> {
  if (!isBrowser() || !pauseWhenHidden) {
    return repeatWith$(source$, () => nextDelayTime());
  }

  const pauseTrigger$ = new Subject<void>();
  let currentDelay = 0;

  const poller$ = repeatWith$(source$.pipe(finalize(() => pauseTrigger$.next())), () => {
    currentDelay = nextDelayTime();
    return currentDelay;
  });

  const pauser$ = pauseTrigger$.pipe(auditTime(currentDelay));

  return withDocumentVisibility$(poller$, pauser$);
}
