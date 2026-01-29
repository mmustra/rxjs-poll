import { createPollService } from '../../src/common/service';
import { ExtendedPollConfig } from '../../src/types/config.type';

const createMockConfig = <T>(overrides?: Partial<ExtendedPollConfig<T>>): ExtendedPollConfig<T> => ({
  type: 'repeat',
  delay: { strategy: 'constant', time: 1000 },
  retry: { strategy: 'exponential', time: 1000, limit: 3, consecutiveOnly: true },
  pauseWhenHidden: true,
  getDelayTime: jest.fn(() => 1000),
  getRetryTime: jest.fn(() => 2000),
  ...overrides,
});

describe('createPollService', () => {
  describe('initialization', () => {
    it('should create service with initial state', () => {
      const config = createMockConfig();
      const service = createPollService(config);

      expect(service.state).toEqual({
        value: undefined,
        error: undefined,
        pollCount: 0,
        retryCount: 0,
        consecutiveRetryCount: 0,
      });
    });

    it('should expose config via getter', () => {
      const config = createMockConfig();
      const service = createPollService(config);

      expect(service.config).toBe(config);
    });
  });

  describe('setValue', () => {
    it('should update state value', () => {
      const service = createPollService(createMockConfig<string>());

      service.setValue('test-value');

      expect(service.state.value).toBe('test-value');
    });

    it('should support generic types', () => {
      type TestData = { id: number; name: string };
      const service = createPollService(createMockConfig<TestData>());

      service.setValue({ id: 1, name: 'test' });

      expect(service.state.value).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('setError', () => {
    it('should update state error', () => {
      const service = createPollService(createMockConfig());
      const error = new Error('test error');

      service.setError(error);

      expect(service.state.error).toBe(error);
    });
  });

  describe('resetError', () => {
    it('should clear error and reset consecutiveRetryCount', () => {
      const service = createPollService(createMockConfig());

      service.setError(new Error('test'));
      service.incrementRetry(); // Increments both retry counts

      service.resetError();

      expect(service.state.error).toBeUndefined();
      expect(service.state.consecutiveRetryCount).toBe(0);
      expect(service.state.retryCount).toBe(1); // Should not be reset
    });
  });

  describe('incrementPoll', () => {
    it('should increment poll count', () => {
      const service = createPollService(createMockConfig());

      service.incrementPoll();

      expect(service.state.pollCount).toBe(1);
    });
  });

  describe('incrementRetry', () => {
    it('should increment both retry counts', () => {
      const service = createPollService(createMockConfig());

      service.incrementRetry();

      expect(service.state.retryCount).toBe(1);
      expect(service.state.consecutiveRetryCount).toBe(1);
    });
  });

  describe('isRetryLimit', () => {
    it('should return false when under limit', () => {
      const config = createMockConfig({
        retry: { strategy: 'constant', time: 1000, limit: 3, consecutiveOnly: false },
      });
      const service = createPollService(config);

      service.incrementRetry();
      const result = service.isRetryLimit();

      expect(result).toBe(false);
      expect(service.state.retryCount).toBe(1);
      expect(service.state.consecutiveRetryCount).toBe(1);
    });

    it('should return true when retryCount exceeds limit (consecutiveOnly: false)', () => {
      const config = createMockConfig({
        retry: { strategy: 'constant', time: 1000, limit: 2, consecutiveOnly: false },
      });
      const service = createPollService(config);

      service.incrementRetry(); // retryCount: 1
      service.incrementRetry(); // retryCount: 2
      service.incrementRetry(); // retryCount: 3
      const result = service.isRetryLimit();

      expect(result).toBe(true);
      expect(service.state.retryCount).toBe(3);
    });

    it('should return true when consecutiveRetryCount exceeds limit (consecutiveOnly: true)', () => {
      const config = createMockConfig({ retry: { strategy: 'constant', time: 1000, limit: 2, consecutiveOnly: true } });
      const service = createPollService(config);

      service.incrementRetry(); // consecutiveRetryCount: 1
      service.incrementRetry(); // consecutiveRetryCount: 2
      service.incrementRetry(); // consecutiveRetryCount: 3
      const result = service.isRetryLimit();

      expect(result).toBe(true);
      expect(service.state.consecutiveRetryCount).toBe(3);
    });
  });

  describe('getDelayTime', () => {
    it('should call config.getDelayTime with current state', () => {
      const getDelayTime = jest.fn(() => 1500);
      const config = createMockConfig({ getDelayTime });
      const service = createPollService(config);

      const result = service.getDelayTime();

      expect(result).toBe(1500);
      expect(getDelayTime).toHaveBeenCalledWith(service.state);
    });

    it('should pass updated state to config.getDelayTime', () => {
      const getDelayTime = jest.fn((state) => state.pollCount * 100);
      const config = createMockConfig({ getDelayTime });
      const service = createPollService(config);

      service.incrementPoll(); // pollCount: 1
      const result1 = service.getDelayTime();
      service.incrementPoll(); // pollCount: 2
      const result2 = service.getDelayTime();

      expect(result1).toBe(100);
      expect(result2).toBe(200);
      expect(service.state.pollCount).toBe(2);
    });
  });

  describe('getRetryTime', () => {
    it('should call config.getRetryTime without modifying state', () => {
      const getRetryTime = jest.fn(() => 2500);
      const config = createMockConfig({ getRetryTime });
      const service = createPollService(config);

      const result = service.getRetryTime();

      expect(result).toBe(2500);
      expect(service.state.retryCount).toBe(0);
      expect(service.state.consecutiveRetryCount).toBe(0);
      expect(getRetryTime).toHaveBeenCalledWith(service.state);
    });

    it('should pass current state to config.getRetryTime', () => {
      const getRetryTime = jest.fn((state) => state.retryCount * 500);
      const config = createMockConfig({ getRetryTime });
      const service = createPollService(config);

      service.incrementRetry(); // retryCount: 1
      service.incrementRetry(); // retryCount: 2

      const result = service.getRetryTime();

      expect(result).toBe(1000); // 2 * 500
      expect(service.state.retryCount).toBe(2); // Should remain 2 after getRetryTime
      expect(getRetryTime).toHaveBeenCalledWith(service.state);
    });
  });
});
