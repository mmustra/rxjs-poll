import { defaultState } from '../../src/constants/state.const';

describe('state.const', () => {
  describe('defaultState', () => {
    it('should have correct default values', () => {
      expect(defaultState).toEqual({
        value: undefined,
        error: undefined,
        pollCount: 0,
        retryCount: 0,
        consecutiveRetryCount: 0,
      });
    });
  });
});
