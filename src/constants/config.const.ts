import { NormalizedPollConfig } from '../types/config.type';
import { defaultNotifier$ } from './notifier.const';
import { pollType } from './poll.const';
import { strategyType } from './strategies.const';

export const defaultConfig = {
  type: pollType.REPEAT,
  delay: {
    strategy: strategyType.CONSTANT,
    time: 1000,
  },
  retry: {
    strategy: strategyType.EXPONENTIAL,
    time: 1000,
    limit: 3,
    consecutiveOnly: true,
  },
  pause: {
    notifier: defaultNotifier$,
    whenHidden: true,
  },
} as const satisfies NormalizedPollConfig<unknown>;
