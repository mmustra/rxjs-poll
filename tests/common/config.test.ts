import { extendConfig } from '../../src/common/config';
import { defaultConfig } from '../../src/constants/config.const';
import { strategyType } from '../../src/constants/strategies.const';
import { PollConfig } from '../../src/types/config.type';
import { PollState } from '../../src/types/poll.type';

it('should extend config with default values when nothing is provided', () => {
  const result = extendConfig();

  expect(result).toEqual({
    ...defaultConfig,
    getDelayTime: expect.any(Function),
    getRetryTime: expect.any(Function),
  });
});

it('should extend config with provided values', () => {
  const config: PollConfig<unknown> = {
    type: 'interval',
    delay: {
      strategy: strategyType.CONSTANT,
      time: 2000,
    },
    retry: {
      strategy: strategyType.LINEAR,
      time: 3000,
      limit: 5,
      consecutiveOnly: false,
    },
    pauseWhenHidden: false,
  };

  const result = extendConfig(config);

  expect(result.type).toBe('interval');
  expect(result.delay.strategy).toBe(strategyType.CONSTANT);
  expect(result.delay.time).toBe(2000);
  expect(result.retry.time).toBe(3000);
  expect(result.retry.strategy).toBe(strategyType.LINEAR);
  expect(result.retry.limit).toBe(5);
  expect(result.retry.consecutiveOnly).toBe(false);
  expect(result.pauseWhenHidden).toBe(false);
  expect(result.getDelayTime).toBeInstanceOf(Function);
  expect(result.getRetryTime).toBeInstanceOf(Function);
});

it("should use function if provided for delay's time", () => {
  const config: PollConfig<unknown> = {
    delay: {
      strategy: strategyType.DYNAMIC,
      time: () => 1000,
    },
  };

  const result = extendConfig(config);
  expect(result.delay.time).toBeInstanceOf(Function);
});

it("should use function if provided for retry's time", () => {
  const config: PollConfig<unknown> = {
    retry: {
      strategy: strategyType.DYNAMIC,
      time: () => 1000,
    },
  };

  const result = extendConfig(config);
  expect(result.retry.time).toBeInstanceOf(Function);
});

it("should allow Infinity provided for retry's limit", () => {
  const config: PollConfig<unknown> = {
    retry: {
      limit: Infinity,
    },
  };

  const result = extendConfig(config);
  expect(result.retry.limit).toBe(Infinity);
});

it('should not mutate input configuration object', () => {
  const originalConfig: PollConfig<unknown> = {
    type: 'interval',
    delay: {
      strategy: strategyType.CONSTANT,
      time: 2000,
    },
    retry: {
      strategy: strategyType.CONSTANT,
      time: 3000,
      limit: 5,
      consecutiveOnly: false,
    },
    pauseWhenHidden: false,
  };

  const configCopy = JSON.parse(JSON.stringify(originalConfig));
  extendConfig(originalConfig);

  expect(originalConfig).toEqual(configCopy);
});

it('should not mutate internal state from dynamic functions', () => {
  const mockState: PollState<unknown> = {
    pollCount: 0,
    retryCount: 0,
    consecutiveRetryCount: 0,
    value: undefined,
    error: undefined,
  };
  const stateCopy = { ...mockState };

  const config = extendConfig({
    delay: {
      strategy: strategyType.DYNAMIC,
      time: (state) => {
        state.pollCount = 10;
        state.retryCount = 5;
        state.consecutiveRetryCount = 3;

        return 1000;
      },
    },
  });

  config.getDelayTime(mockState);

  expect(mockState).toEqual(stateCopy);
});
