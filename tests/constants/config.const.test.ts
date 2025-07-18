import { controlConfig } from '../../src/constants/config.const';

describe('controlConfig', () => {
  it('should have correct default configuration', () => {
    expect(controlConfig).toEqual({
      type: 'repeat',
      delay: {
        strategy: 'constant',
        time: 1000,
      },
      retry: {
        strategy: 'exponential',
        time: 1000,
        limit: 3,
        consecutiveOnly: true,
      },
      pauseWhenHidden: true,
    });
  });
});
