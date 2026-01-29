/**
 * @jest-environment node
 */

import { isBrowser } from '../../src/common/utils';

describe('isBrowser', () => {
  it('should return false in Node.js environment', () => {
    expect(isBrowser()).toBe(false);
  });
});
