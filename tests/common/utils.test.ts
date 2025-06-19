import { normalizeNumber } from '../../src/common/utils';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Utils', () => {
  describe('normalizeNumber', () => {
    it('Should normalize number', () => {
      const expected = 2;

      expect(normalizeNumber(2)).toEqual(expected);
      expect(normalizeNumber(-2)).toEqual(expected);
    });

    it('Should normalize MinMax', () => {
      const expected = [1, 2];

      expect(normalizeNumber([1, 2])).toEqual(expected);
      expect(normalizeNumber([-1, -2])).toEqual(expected);
    });

    it('Should normalize to 0 if invalid', () => {
      const expected1 = 0;
      const expected2 = [1, 0];
      const expected3 = [0, 2];
      const expected4 = [0, 0];

      expect(normalizeNumber(null)).toEqual(expected1);
      expect(normalizeNumber(undefined)).toEqual(expected1);
      expect(normalizeNumber(NaN)).toEqual(expected1);
      expect(normalizeNumber(Infinity)).toEqual(expected1);
      expect(normalizeNumber(-Infinity)).toEqual(expected1);
      expect(normalizeNumber([-1, null])).toEqual(expected2);
      expect(normalizeNumber([undefined, 2])).toEqual(expected3);
      expect(normalizeNumber([null, undefined])).toEqual(expected4);
    });

    it('Should normalize to default if invalid', () => {
      const expected = 100;

      expect(normalizeNumber(null, expected)).toEqual(expected);
      expect(normalizeNumber(undefined, expected)).toEqual(expected);
      expect(normalizeNumber(NaN, expected)).toEqual(expected);
      expect(normalizeNumber(-Infinity, expected)).toEqual(expected);
    });

    it('Should normalize to infinity', () => {
      const expected = Infinity;

      expect(normalizeNumber(expected, 0, false)).toEqual(expected);
      expect(normalizeNumber(null, expected)).toEqual(expected);
    });
  });
});
