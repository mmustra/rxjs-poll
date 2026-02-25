import { defaultNotifier$ } from '../../src/constants/notifier.const';
import { pollType } from '../../src/constants/poll.const';
import { strategyType } from '../../src/constants/strategies.const';
import { ExtendedPollConfig, NormalizedPollConfig } from '../../src/types/config.type';

export function createMockConfig<T>(overrides?: Partial<ExtendedPollConfig<T>>): ExtendedPollConfig<T> {
  return {
    type: 'repeat',
    delay: { strategy: 'constant', time: 1000 },
    retry: { strategy: 'exponential', time: 1000, limit: 3, consecutiveOnly: true },
    pause: { notifier: defaultNotifier$, whenHidden: true },
    getDelayTime: jest.fn(() => 1000),
    getRetryTime: jest.fn(() => 2000),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createBaseNormalizedConfig<T = any>(
  overrides?: Partial<NormalizedPollConfig<T>>
): NormalizedPollConfig<T> {
  return {
    type: pollType.INTERVAL,
    pause: { notifier: defaultNotifier$, whenHidden: true },
    delay: {
      time: 1000,
      strategy: strategyType.CONSTANT,
    },
    retry: {
      time: 500,
      strategy: strategyType.CONSTANT,
      limit: 3,
      consecutiveOnly: false,
    },
    ...overrides,
  };
}
