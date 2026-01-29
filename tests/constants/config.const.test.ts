import { defaultConfig } from '../../src/constants/config.const';

describe('defaultConfig', () => {
  it('should have correct default values', () => {
    expect(defaultConfig).toEqual({
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
