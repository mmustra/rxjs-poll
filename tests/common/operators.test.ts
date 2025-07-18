import { TestScheduler } from 'rxjs/testing';

import { retryPoll } from '../../src/common/operators';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

describe('retryPoll', () => {
  it('should emit value and reset error on success', () => {
    const resetError = jest.fn();

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|');
      const expected = '--a|';

      const result$ = source$.pipe(
        retryPoll(
          () => false,
          () => 100,
          resetError
        )
      );

      expectObservable(result$).toBe(expected);
      expectObservable(result$).toBe(expected, { a: 'a' });
    });

    expect(resetError).toHaveBeenCalled();
  });

  it('should throw error immediately when limit is reached', () => {
    const getTime = jest.fn();
    const isLimit = jest.fn().mockReturnValue(true);
    const resetError = jest.fn();

    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('test error');
      const source$ = cold('--#', undefined, error);
      const expected = '--#';

      const result$ = source$.pipe(retryPoll(isLimit, getTime, resetError));

      expectObservable(result$).toBe(expected, undefined, error);
    });

    expect(getTime).not.toHaveBeenCalled();
  });

  it('should retry with delay when error occurs and limit not reached', () => {
    let callCount = 0;
    const isLimit = jest.fn(() => ++callCount === 2); // Stop after 2 attempts
    const getTime = jest.fn().mockReturnValue(100);
    const resetError = jest.fn();

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--#', undefined, new Error('test error'));
      const expected = '-- 100ms --#';

      const result$ = source$.pipe(retryPoll(isLimit, getTime, resetError));

      expectObservable(result$).toBe(expected, undefined, new Error('test error'));
    });

    expect(isLimit).toHaveBeenCalledTimes(2);
    expect(getTime).toHaveBeenCalledTimes(1);
  });
});
