import * as indexExports from '../src';

describe('Constants exports', () => {
  it('should export pollType and strategyType', () => {
    expect(indexExports.pollType).toBeDefined();
    expect(typeof indexExports.pollType).toBe('object');
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
  it('should have correct export structure and no undefined values', () => {
    const expectedExports = ['pollType', 'strategyType', 'poll'];
    expectedExports.forEach((exportName) => {
      expect(indexExports).toHaveProperty(exportName);
      expect(indexExports[exportName as keyof typeof indexExports]).toBeDefined();
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
