import { getStrategyTimeProducer } from '../../src/common/strategies';
import { pollType } from '../../src/constants/poll.const';
import { strategyType } from '../../src/constants/strategies.const';
import { NormalizedPollConfig } from '../../src/types/config.type';
import { PollState } from '../../src/types/poll.type';
import { DynamicFunction } from '../../src/types/strategies.type';

jest.mock('../../src/common/utils', () => ({
  randomNumber: jest.fn((min: number, max: number) => min + (max - min) / 2),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getStrategyTimeProducer', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockState = (pollCount = 3, retryCount = 2, consecutiveRetryCount = 1): PollState<any> => ({
    pollCount,
    retryCount,
    consecutiveRetryCount,
    value: undefined,
    error: undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createBaseConfig = (): NormalizedPollConfig<any> => ({
    type: pollType.INTERVAL,
    pauseWhenHidden: true,
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
  });

  describe('strategies', () => {
    it('should have time producers for all types', () => {
      const config = createBaseConfig();
      const state = createMockState();

      Object.values(strategyType).forEach((strategy) => {
        config.delay.strategy = strategy;

        if (strategy === strategyType.RANDOM) {
          config.delay.time = [100, 200];
        } else if (strategy === strategyType.DYNAMIC) {
          config.delay.time = jest.fn(() => 100);
        } else {
          config.delay.time = 100;
        }

        expect(() => {
          const producer = getStrategyTimeProducer('delay', config);
          producer(state);
        }).not.toThrow();
      });
    });
  });

  describe('constant strategy', () => {
    it('should return constant time for delay mode', () => {
      const config = createBaseConfig();
      config.delay.time = 1000;
      config.delay.strategy = strategyType.CONSTANT;

      const producer = getStrategyTimeProducer('delay', config);
      const state = createMockState();

      expect(producer(state)).toBe(1000);
    });

    it('should return constant time for retry mode', () => {
      const config = createBaseConfig();
      config.retry.time = 500;
      config.retry.strategy = strategyType.CONSTANT;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState();

      expect(producer(state)).toBe(500);
    });
  });

  describe('linear strategy', () => {
    it('should use pollCount for delay mode', () => {
      const config = createBaseConfig();
      config.delay.time = 100;
      config.delay.strategy = strategyType.LINEAR;

      const producer = getStrategyTimeProducer('delay', config);
      const state = createMockState(5); // pollCount = 5

      expect(producer(state)).toBe(500); // 5 * 100
    });

    it('should use retryCount for retry mode (non-consecutive)', () => {
      const config = createBaseConfig();
      config.retry.time = 200;
      config.retry.strategy = strategyType.LINEAR;
      config.retry.consecutiveOnly = false;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState(3, 4, 2); // retryCount = 4

      expect(producer(state)).toBe(800); // 4 * 200
    });

    it('should use consecutiveRetryCount for retry mode (consecutive)', () => {
      const config = createBaseConfig();
      config.retry.time = 300;
      config.retry.strategy = strategyType.LINEAR;
      config.retry.consecutiveOnly = true;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState(3, 4, 2); // consecutiveRetryCount = 2

      expect(producer(state)).toBe(600); // 2 * 300
    });
  });

  describe('exponential strategy', () => {
    it('should use pollCount for delay mode', () => {
      const config = createBaseConfig();
      config.delay.time = 100;
      config.delay.strategy = strategyType.EXPONENTIAL;

      const producer = getStrategyTimeProducer('delay', config);
      const state = createMockState(4); // pollCount = 4

      expect(producer(state)).toBe(800); // 2^(4-1) * 100 = 8 * 100
    });

    it('should use retryCount for retry mode (non-consecutive)', () => {
      const config = createBaseConfig();
      config.retry.time = 50;
      config.retry.strategy = strategyType.EXPONENTIAL;
      config.retry.consecutiveOnly = false;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState(3, 3, 2); // retryCount = 3

      expect(producer(state)).toBe(200); // 2^(3-1) * 50 = 4 * 50
    });

    it('should use consecutiveRetryCount for retry mode (consecutive)', () => {
      const config = createBaseConfig();
      config.retry.time = 75;
      config.retry.strategy = strategyType.EXPONENTIAL;
      config.retry.consecutiveOnly = true;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState(3, 4, 3); // consecutiveRetryCount = 3

      expect(producer(state)).toBe(300); // 2^(3-1) * 75 = 4 * 75
    });
  });

  describe('random strategy', () => {
    it('should return random value within range for delay mode', () => {
      const config = createBaseConfig();
      config.delay.time = [100, 500];
      config.delay.strategy = strategyType.RANDOM;

      const producer = getStrategyTimeProducer('delay', config);
      const state = createMockState();

      // Mocked to return middle value
      expect(producer(state)).toBe(300); // 100 + (500-100)/2
    });

    it('should return random value within range for retry mode', () => {
      const config = createBaseConfig();
      config.retry.time = [50, 200];
      config.retry.strategy = strategyType.RANDOM;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState();

      // Mocked to return middle value
      expect(producer(state)).toBe(125); // 50 + (200-50)/2
    });
  });

  describe('dynamic strategy', () => {
    it('should call dynamic function with state for delay mode', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dynamicFn = jest.fn((state: PollState<any>) => state.pollCount * 150);
      const config = createBaseConfig();
      config.delay.time = dynamicFn;
      config.delay.strategy = strategyType.DYNAMIC;

      const producer = getStrategyTimeProducer('delay', config);
      const state = createMockState(6); // pollCount = 6

      const result = producer(state);

      expect(dynamicFn).toHaveBeenCalledWith(state);
      expect(result).toBe(900); // 6 * 150
    });

    it('should call dynamic function with state for retry mode', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dynamicFn = jest.fn((state: PollState<any>) => state.retryCount * 250);
      const config = createBaseConfig();
      config.retry.time = dynamicFn;
      config.retry.strategy = strategyType.DYNAMIC;

      const producer = getStrategyTimeProducer('retry', config);
      const state = createMockState(3, 4, 2); // retryCount = 4

      const result = producer(state);

      expect(dynamicFn).toHaveBeenCalledWith(state);
      expect(result).toBe(1000); // 4 * 250
    });

    it('should handle dynamic function returning MinMax for delay mode', () => {
      const dynamicFn = jest.fn(() => [200, 800]) as DynamicFunction<null>;
      const config = createBaseConfig();
      config.delay.time = dynamicFn;
      config.delay.strategy = strategyType.DYNAMIC;

      const producer = getStrategyTimeProducer('delay', config);
      const state = createMockState();

      const result = producer(state);

      expect(dynamicFn).toHaveBeenCalledWith(state);
      expect(result).toEqual([200, 800]);
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown strategy', () => {
      const config = createBaseConfig();
      // @ts-ignore - intentionally using invalid strategy for test
      config.delay.strategy = 'unknown';

      expect(() => getStrategyTimeProducer('delay', config)).toThrow('rxjs-poll: Unknown strategy!');
    });
  });
});
