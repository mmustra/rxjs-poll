import { Observable, takeLast, tap } from 'rxjs';

import { pollType } from '../constants/poll.const';
import { ExtendedPollConfig } from '../types/config.type';
import { PollerContext } from '../types/poller-context.type';
import { intervalPollerFactory } from './execution/interval-factory';
import { PollService } from './execution/poll-service';
import { repeatPollerFactory } from './execution/repeat-factory';
import { composePause$ } from './pause/compose-pause';

/**
 * Creates a polling observable that repeatedly executes the source.
 * Uses interval or repeat strategy and composes pause behavior from config.
 *
 * @param source$ - The source observable to poll
 * @param extendedConfig - Extended poll configuration
 * @returns Observable that emits values from the source with configured polling and pause
 */
export function createPoller$<T>(source$: Observable<T>, extendedConfig: ExtendedPollConfig<T>): Observable<T> {
  const pollService = new PollService(extendedConfig);
  const completed$ = source$.pipe(
    takeLast(1),
    tap((value) => pollService.setValue(value))
  );

  const factory = pollService.config.type === pollType.REPEAT ? repeatPollerFactory : intervalPollerFactory;
  const ctx: PollerContext<T> = {
    source$: completed$,
    pollService,
    factory,
  };

  const { poller$ } = composePause$(ctx);

  return poller$;
}
