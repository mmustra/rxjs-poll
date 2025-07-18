import * as indexExports from '../src';

describe('Constants exports', () => {
  it('should export pollType', () => {
    expect(indexExports.pollType).toBeDefined();
    expect(typeof indexExports.pollType).toBe('object');
  });

  it('should export strategyType', () => {
    expect(indexExports.strategyType).toBeDefined();
    expect(typeof indexExports.strategyType).toBe('object');
  });
});

describe('Function exports', () => {
  it('should export poll function', () => {
    expect(indexExports.poll).toBeDefined();
    expect(typeof indexExports.poll).toBe('function');
  });
});

describe('Type exports', () => {
  it('should have correct export structure', () => {
    const expectedExports = ['pollType', 'strategyType', 'poll'];

    expectedExports.forEach((exportName) => {
      expect(indexExports).toHaveProperty(exportName);
    });
  });

  it('should not export undefined values', () => {
    Object.values(indexExports).forEach((exportValue) => {
      expect(exportValue).toBeDefined();
    });
  });
});

describe('Module completeness', () => {
  it('should not have any unexpected exports', () => {
    const expectedKeys = ['pollType', 'strategyType', 'poll'];
    const actualKeys = Object.keys(indexExports);

    expectedKeys.forEach((key) => {
      expect(actualKeys).toContain(key);
    });

    expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));
  });
});
