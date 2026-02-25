import { Observable, Subject, switchMap, tap } from 'rxjs';

import { CycleControl, PollerFactory } from '../../types/poller-factory.type';
import { getCycleTimer$ } from './cycle-timer';
import { PollService } from './poll-service';
import { repeatWith$ } from './repeat-with';
import { retryPoll } from './retry-poll.operator';

/**
 * Repeat direct poller: runs source, then waits delay, then repeats; retries on error.
 *
 * @param source$ - Source observable to repeat
 * @param pollService - Poll service for delay time and retry
 * @returns Observable that repeats the source with delay and retry
 */
function createDirectPoller$<T>(source$: Observable<T>, pollService: PollService<T>): Observable<T> {
  return repeatWith$(source$, () => {
    pollService.incrementPoll();
    return pollService.getDelayTime();
  }).pipe(retryPoll(pollService));
}

/**
 * Repeat cycle control: same as direct but exposes cycler$ for pause (cycle end + delay).
 *
 * @param source$ - Source observable to repeat
 * @param pollService - Poll service for delay/retry time and state
 * @returns Object with poller$ and cycler$ for visibility/pause composition
 */
function createCycleControl$<T>(source$: Observable<T>, pollService: PollService<T>): CycleControl<T> {
  const cycle$ = new Subject<void>();
  let time = 0;

  const poller$ = repeatWith$(
    source$.pipe(
      tap({
        complete: () => {
          pollService.incrementPoll();
          time = pollService.getDelayTime();
          cycle$.next();
        },
      })
    ),
    () => time
  ).pipe(
    retryPoll(pollService, () => {
      time = pollService.getRetryTime();
      cycle$.next();
      return time;
    })
  );

  const cycler$ = cycle$.pipe(switchMap(() => getCycleTimer$({ time })));

  return { poller$, cycler$ };
}

export const repeatPollerFactory: PollerFactory = { createDirectPoller$, createCycleControl$ };
