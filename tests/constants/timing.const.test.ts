import { timingToleranceMs } from '../../src/constants/timing.const';

describe('timing.const', () => {
  it('timingToleranceMs should be a positive number with correct value', () => {
    expect(typeof timingToleranceMs).toBe('number');
    expect(timingToleranceMs).toBeGreaterThan(0);
    expect(timingToleranceMs).toBe(100);
  });
});
