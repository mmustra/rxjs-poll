import {
  isBrowser,
  isDocumentVisible,
  isFunction,
  normalizeNumber,
  pickNumber,
  randomNumber,
} from '../../src/common/utils';

describe('normalizeNumber', () => {
  it('should handle basic number inputs', () => {
    expect(normalizeNumber(5)).toBe(5);
    expect(normalizeNumber(-3)).toBe(3);
    expect(normalizeNumber(0)).toBe(0);
  });

  it('should handle null/undefined with default value', () => {
    expect(normalizeNumber(null)).toBe(0);
    expect(normalizeNumber(undefined)).toBe(0);
    expect(normalizeNumber(null, 10)).toBe(10);
  });

  it('should handle NaN and infinite values', () => {
    expect(normalizeNumber(NaN)).toBe(0);
    expect(normalizeNumber(Infinity)).toBe(0);
    expect(normalizeNumber(-Infinity)).toBe(0);
    expect(normalizeNumber(Infinity, 5, false)).toBe(Infinity);
  });

  it('should handle MinMax arrays', () => {
    expect(normalizeNumber([1, -2])).toEqual([1, 2]);
    expect(normalizeNumber([Infinity, 5])).toEqual([0, 5]);
    expect(normalizeNumber([NaN, -3], 1)).toEqual([1, 3]);
  });
});

describe('pickNumber', () => {
  it('should return the number when passed a single number', () => {
    expect(pickNumber(42)).toBe(42);
    expect(pickNumber(0)).toBe(0);
    expect(pickNumber(-10)).toBe(-10);
  });

  it('should return a number within the range when passed MinMax array', () => {
    const min = 5;
    const max = 10;
    const result = pickNumber([min, max]);

    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should handle case when min and max values are switched', () => {
    const min = 10;
    const max = 5;
    const result = pickNumber([min, max]);

    expect(result).toBeGreaterThanOrEqual(max);
    expect(result).toBeLessThanOrEqual(min);
  });

  it('should handle edge case where min equals max', () => {
    const value = 7;

    expect(pickNumber([value, value])).toBe(value);
  });
});

describe('randomNumber', () => {
  it('should return a number that is different from min and max', () => {
    const min = 1;
    const max = 1000;
    const results = new Set<number>();

    for (let i = 0; i < 1000; i++) {
      const result = randomNumber(min, max);

      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
      expect(Number.isInteger(result)).toBe(true);

      results.add(result);

      if (results.size >= 2) {
        break;
      }
    }

    expect(results.size).toBeGreaterThan(1);
  });

  it('should return the same number when min equals max', () => {
    expect(randomNumber(5, 5)).toBe(5);
    expect(randomNumber(0, 0)).toBe(0);
    expect(randomNumber(-3, -3)).toBe(-3);
  });

  it('should handle case when min and max values are switched', () => {
    const min = 10;
    const max = 5;

    const result = randomNumber(min, max);
    expect(result).toBeGreaterThanOrEqual(max);
    expect(result).toBeLessThanOrEqual(min);
  });

  it('should handle negative ranges', () => {
    const min = -10;
    const max = -5;
    const result = randomNumber(min, max);

    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should handle ranges crossing zero', () => {
    const min = -5;
    const max = 5;
    const result = randomNumber(min, max);

    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('isFunction', () => {
  it('should return true for functions', () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(function () {})).toBe(true);
    expect(isFunction(async () => {})).toBe(true);
    expect(isFunction(Math.random)).toBe(true);
    // eslint-disable-next-line no-console
    expect(isFunction(console.log)).toBe(true);
  });

  it('should return false for non-functions', () => {
    expect(isFunction(null)).toBe(false);
    expect(isFunction(undefined)).toBe(false);
    expect(isFunction(42)).toBe(false);
    expect(isFunction('string')).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction([])).toBe(false);
    expect(isFunction(true)).toBe(false);
    expect(isFunction(Symbol('test'))).toBe(false);
  });

  it('should provide correct type narrowing', () => {
    const value: unknown = () => 'test';

    if (isFunction(value)) {
      expect(typeof value()).toBe('string');
    }
  });
});

describe('isBrowser', () => {
  it('should return true when window and document are available', () => {
    expect(isBrowser()).toBe(true);
  });
});

describe('isDocumentVisible', () => {
  it('should return true when document is visible', () => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });

    expect(isDocumentVisible()).toBe(true);
  });

  it('should return false when document is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    });

    expect(isDocumentVisible()).toBe(false);
  });
});
