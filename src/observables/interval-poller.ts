import { Observable, of, Subject, switchMap, tap } from 'rxjs';

import { PollService } from '../common/service';
import { isBrowser } from '../common/utils';
import { retryPoll } from '../operators/retry-poll.operator';
import { withDocumentVisibility$ } from './document-visibility';
import { getPauseDelay$ } from './pause-delay';
import { repeatWith$ } from './repeat-with';

/**
 * Builds an interval-based poller that polls at fixed intervals regardless of source duration.
 * If a source takes longer than the interval, it will be interrupted.
 * @param source$ - The source observable to poll
 * @param pollService - Poll state service managing configuration and state
 * @returns Observable that emits values from the source at fixed intervals
 */
export function buildIntervalPoller$<T>(source$: Observable<T>, pollService: PollService<T>): Observable<T> {
  if (!isBrowser() || !pollService.config.pauseWhenHidden) {
    return repeatWith$(of(null), () => {
      pollService.incrementPoll();
      return pollService.getDelayTime();
    }).pipe(
      switchMap(() => source$),
      retryPoll(pollService)
    );
  }

  const pauseTrigger$ = new Subject<void>();
  let time = 0;
  let sourceStartTime = 0;
  let sourceEndTime = 0;

  const poller$ = repeatWith$(of(null), () => {
    pollService.incrementPoll();
    time = pollService.getDelayTime();
    return time;
  }).pipe(
    switchMap(() =>
      source$.pipe(
        tap({
          subscribe: () => {
            sourceStartTime = performance.now();
          },
          finalize: () => {
            sourceEndTime = performance.now();
            pauseTrigger$.next();
          },
        })
      )
    ),
    retryPoll(pollService, () => {
      time = pollService.getRetryTime();
      return time;
    })
  );

  const pauser$ = pauseTrigger$.pipe(
    switchMap(() =>
      getPauseDelay$({
        time,
        sourceStartTime,
        sourceEndTime,
      })
    )
  );

  return withDocumentVisibility$(poller$, pauser$);
}
