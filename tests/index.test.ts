import * as indexExports from '../src';

const EXPECTED_EXPORTS = ['pollType', 'strategyType', 'poll'] as const;

describe('index', () => {
  it('should export pollType, strategyType, and poll with correct types', () => {
    expect(indexExports.pollType).toBeDefined();
    expect(typeof indexExports.pollType).toBe('object');
    expect(indexExports.strategyType).toBeDefined();
    expect(typeof indexExports.strategyType).toBe('object');
    expect(indexExports.poll).toBeDefined();
    expect(typeof indexExports.poll).toBe('function');
    EXPECTED_EXPORTS.forEach((name) => {
      expect(indexExports).toHaveProperty(name);
      expect(indexExports[name]).toBeDefined();
    });
  });

  it('should only export pollType, strategyType, and poll', () => {
    expect(Object.keys(indexExports)).toEqual([...EXPECTED_EXPORTS]);
  });
});
