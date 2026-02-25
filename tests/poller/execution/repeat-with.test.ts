import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { repeatWith$ } from '../../../src/poller/execution/repeat-with';
import { createTestScheduler } from '../../_helpers/test-scheduler';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  jest.clearAllMocks();
});

describe('repeatWith$', () => {
  it('should repeat source with delay between repetitions', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const getTime = jest.fn().mockReturnValue(10);

      const result$ = repeatWith$(source$, getTime).pipe(take(3));
      const expected = '--a 10ms --a 10ms --(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
      testScheduler.flush();
      expect(getTime).toHaveBeenCalledTimes(2);
    });
  });

  it('should support dynamic delay times', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      let callCount = 0;
      const getTime = jest.fn(() => {
        callCount++;
        return callCount * 10;
      });

      const result$ = repeatWith$(source$, getTime).pipe(take(3));
      const expected = '--a 10ms --a 20ms --(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle source that emits multiple values', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a-b|', { a: 'A', b: 'B' });
      const getTime = jest.fn().mockReturnValue(10);

      const result$ = repeatWith$(source$, getTime).pipe(take(4));
      const expected = '--a-b 10ms --a-(b|)';

      expectObservable(result$).toBe(expected, { a: 'A', b: 'B' });
    });
  });

  it('should propagate errors from source', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const error = new Error('source error');
      const source$ = cold('--#', undefined, error);
      const getTime = jest.fn().mockReturnValue(10);

      const result$ = repeatWith$(source$, getTime);

      expectObservable(result$).toBe('--#', undefined, error);
      testScheduler.flush();
      expect(getTime).not.toHaveBeenCalled();
    });
  });
});
