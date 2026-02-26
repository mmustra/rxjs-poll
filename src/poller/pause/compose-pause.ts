import { Observable } from 'rxjs';

import { ComposedPollerContext, PollerContext } from '../../types/poller-context.type';
import { getPauseMode } from './get-pause-mode';
import { withHiddenPause$ } from './with-hidden-pause';
import { withNotifierPause$ } from './with-notifier-pause';

/**
 * Composes the poller with the appropriate pause behavior based on context.
 * Applies no pause, notifier-only, document visibility (hidden), or both.
 *
 * @param ctx - Poller context
 * @returns Context with poller$ (and cycler$ when using cycle-based pause) set
 */
export function composePause$<T>(ctx: PollerContext<T>): ComposedPollerContext<T> {
  const { source$, pollService, factory } = ctx;
  const pauseMode = getPauseMode(ctx);

  if (pauseMode === 'none') {
    ctx.poller$ = ctx.poller$ ?? factory.createDirectPoller$(source$, pollService);

    return ctx as ComposedPollerContext<T>;
  }

  const { notifier } = pollService.config.pause;

  if (pauseMode === 'notifier') {
    const directPoller$ = ctx.poller$ ?? factory.createDirectPoller$(source$, pollService);
    ctx.poller$ = withNotifierPause$(directPoller$, notifier);

    return ctx as ComposedPollerContext<T>;
  }

  let poller$: Observable<T>;
  let cycler$: Observable<0>;

  if (ctx.poller$ && ctx.cycler$) {
    poller$ = ctx.poller$;
    cycler$ = ctx.cycler$;
  } else {
    const control = factory.createCycleControl$(source$, pollService);
    poller$ = ctx.poller$ ?? control.poller$;
    cycler$ = ctx.cycler$ ?? control.cycler$;
  }

  ctx.cycler$ = cycler$;

  if (pauseMode === 'hidden') {
    ctx.poller$ = withHiddenPause$(poller$, cycler$);
  } else if (pauseMode === 'both') {
    ctx.poller$ = withNotifierPause$(withHiddenPause$(poller$, cycler$), notifier);
  } else {
    throw new Error(`composePause$: Unsupported pause mode "${pauseMode}"!`);
  }

  return ctx as ComposedPollerContext<T>;
}
