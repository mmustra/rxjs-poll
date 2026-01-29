import { MonoTypeOperatorFunction } from 'rxjs';

import { extendConfig } from './common/config';
import { createPollService } from './common/service';
import { createPoller$ } from './observables/factory';
import { PollConfig } from './types/config.type';
import { Nil } from './types/utils.type';

/**
 * ### RxJS Poll Operator
 *
 * Automatically re-executes a source observable after completion, \
 * using delay strategies and retry mechanisms for handling errors.
 *
 * #### Example
 *
 * ```ts
 * import { poll } from 'rxjs-poll';
 * import { takeWhile } from 'rxjs';
 *
 * request$
 *   .pipe(
 *     poll(),
 *     takeWhile(({ status }) => status !== 'done', true)
 *   )
 *   .subscribe();
 * ```
 *
 * @param config - {@link PollConfig} object used for configuration
 * @return Function that returns an Observable handling resubscription \
 * to the source on complete or error
 */
export function poll<T>(config?: PollConfig<T> | Nil): MonoTypeOperatorFunction<T> {
  return (source$) => {
    const extendedConfig = extendConfig(config);
    const pollService = createPollService(extendedConfig);
    const poller$ = createPoller$(source$, pollService);

    return poller$;
  };
}
