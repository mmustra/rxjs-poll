import { Observable, takeLast, tap } from 'rxjs';

import { PollService } from '../common/service';
import { pollType } from '../constants/poll.const';
import { buildIntervalPoller$ } from './interval-poller';
import { buildRepeatPoller$ } from './repeat-poller';

/**
 * Creates a polling observable that repeatedly executes the source observable.
 * Selects between interval-based or repeat-based polling based on configuration.
 * @param source$ - The source observable to poll
 * @param pollService - Poll service managing configuration and state
 * @returns Observable that emits values from the source with configured polling behavior
 */
export function createPoller$<T>(source$: Observable<T>, pollService: PollService<T>): Observable<T> {
  const completed$ = source$.pipe(
    takeLast(1),
    tap((value) => pollService.setValue(value))
  );

  const poller$ =
    pollService.config.type === pollType.REPEAT
      ? buildRepeatPoller$(completed$, pollService)
      : buildIntervalPoller$(completed$, pollService);

  return poller$;
}
