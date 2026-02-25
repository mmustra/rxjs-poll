import { Observable, of, Subject, switchMap, tap } from 'rxjs';

import { CycleControl, PollerFactory } from '../../types/poller-factory.type';
import { getCycleTimer$ } from './cycle-timer';
import { PollService } from './poll-service';
import { repeatWith$ } from './repeat-with';
import { retryPoll } from './retry-poll.operator';

/**
 * Interval direct poller: fixed delay then one source run, with retry on error.
 *
 * @param source$ - Source observable to run after each delay
 * @param pollService - Poll service for delay time and retry
 * @returns Observable that emits source values on the polling cadence
 */
function createDirectPoller$<T>(source$: Observable<T>, pollService: PollService<T>): Observable<T> {
  return repeatWith$(of(null), () => {
    pollService.incrementPoll();
    return pollService.getDelayTime();
  }).pipe(
    switchMap(() => source$),
    retryPoll(pollService)
  );
}

/**
 * Interval cycle control: same as direct but exposes cycler$ for pause (cycle end + delay).
 *
 * @param source$ - Source observable to run after each delay
 * @param pollService - Poll service for delay/retry time and state
 * @returns Object with poller$ and cycler$ for visibility/pause composition
 */
function createCycleControl$<T>(source$: Observable<T>, pollService: PollService<T>): CycleControl<T> {
  const cycle$ = new Subject<void>();
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
          complete: () => {
            sourceEndTime = performance.now();
            cycle$.next();
          },
          error: () => {
            sourceEndTime = performance.now();
          },
        })
      )
    ),
    retryPoll(pollService, () => {
      time = pollService.getRetryTime();
      cycle$.next();
      return time;
    })
  );

  const cycler$ = cycle$.pipe(
    switchMap(() =>
      getCycleTimer$({
        time,
        sourceStartTime,
        sourceEndTime,
      })
    )
  );

  return { poller$, cycler$ };
}

export const intervalPollerFactory: PollerFactory = { createDirectPoller$, createCycleControl$ };
