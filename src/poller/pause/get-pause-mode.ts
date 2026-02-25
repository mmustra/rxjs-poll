import { isBrowser } from '../../common/utils';
import { defaultNotifier$ } from '../../constants/notifier.const';
import { PollerContext } from '../../types/poller-context.type';

export type PauseMode = 'none' | 'notifier' | 'hidden' | 'both';

/**
 * Resolves which pause mode to use from poller context (browser, whenHidden, notifier).
 *
 * @param ctx - Poller context
 * @returns The effective pause mode
 */
export function getPauseMode<T>(ctx: PollerContext<T>): PauseMode {
  const inBrowser = isBrowser();
  const { notifier, whenHidden } = ctx.pollService.config.pause;
  const isDefaultNotifier = notifier === defaultNotifier$;

  if ((!inBrowser || !whenHidden) && isDefaultNotifier) {
    return 'none';
  }

  if ((!inBrowser || !whenHidden) && !isDefaultNotifier) {
    return 'notifier';
  }

  if (whenHidden && isDefaultNotifier) {
    return 'hidden';
  }

  return 'both';
}
