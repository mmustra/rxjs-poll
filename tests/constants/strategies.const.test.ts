import { strategyType } from '../../src/constants/strategies.const';

describe('strategies.const', () => {
  it('should export strategyType constants', () => {
    expect(strategyType).toEqual({
      CONSTANT: 'constant',
      LINEAR: 'linear',
      EXPONENTIAL: 'exponential',
      RANDOM: 'random',
      DYNAMIC: 'dynamic',
    });
  });
});
