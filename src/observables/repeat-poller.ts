import { finalize, Observable, Subject, switchMap } from 'rxjs';

import { isBrowser } from '../common/utils';
import { retryPoll } from '../operators/retry-poll.operator';
import { PollStateService } from '../types/service.type';
import { withDocumentVisibility$ } from './document-visibility';
import { getPauseDelay$ } from './pause-delay';
import { repeatWith$ } from './repeat-with';

/**
 * Builds a repeat-based poller that waits for source completion before starting the next delay.
 * Each poll cycle completes the source before scheduling the next poll.
 * @param source$ - The source observable to poll
 * @param pollService - Poll state service managing configuration and state
 * @returns Observable that emits values from the source with delays between completions
 */
export function buildRepeatPoller$<T>(source$: Observable<T>, pollService: PollStateService<T>): Observable<T> {
  if (!isBrowser() || !pollService.config.pauseWhenHidden) {
    return repeatWith$(source$, () => {
      pollService.incrementPoll();
      return pollService.getDelayTime();
    }).pipe(retryPoll(pollService));
  }

  const pauseTrigger$ = new Subject<void>();
  let time = 0;

  const poller$ = repeatWith$(source$.pipe(finalize(() => pauseTrigger$.next())), () => {
    pollService.incrementPoll();
    time = pollService.getDelayTime();
    return time;
  }).pipe(
    retryPoll(pollService, () => {
      time = pollService.getRetryTime();
      return time;
    })
  );

  const pauser$ = pauseTrigger$.pipe(switchMap(() => getPauseDelay$({ time })));

  return withDocumentVisibility$(poller$, pauser$);
}
