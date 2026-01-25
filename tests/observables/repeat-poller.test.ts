import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { buildRepeatPoller$ } from '../../src/observables/repeat-poller';
import { PollerBuilderOptions } from '../../src/types/observables.type';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

describe('buildRepeatPoller$', () => {
  it('should wait for source to complete before starting delay', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('----a|', { a: 'value' });
      const options: PollerBuilderOptions<string> = {
        nextDelayTime: jest.fn().mockReturnValue(10),
        pauseWhenHidden: false,
      };

      const result$ = buildRepeatPoller$(source$, options).pipe(take(3));
      const expected = '----a 10ms ----a 10ms ----(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle sources with multiple emissions', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const options: PollerBuilderOptions<string> = {
        nextDelayTime: jest.fn().mockReturnValue(5),
        pauseWhenHidden: false,
      };

      const result$ = buildRepeatPoller$(source$, options).pipe(take(6));
      const expected = '--a-b-c 5ms --a-b-(c|)';

      expectObservable(result$).toBe(expected, { a: 'A', b: 'B', c: 'C' });
    });
  });

  it('should call nextDelayTime after each source completion', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const nextDelayTime = jest.fn().mockReturnValue(10);
      const options: PollerBuilderOptions<string> = {
        nextDelayTime,
        pauseWhenHidden: false,
      };

      const result$ = buildRepeatPoller$(source$, options).pipe(take(3));
      const expected = '--a 10ms --a 10ms --(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
      testScheduler.flush();

      expect(nextDelayTime).toHaveBeenCalled();
    });
  });

  it('should delay based on dynamic values from nextDelayTime', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      let callCount = 0;
      const nextDelayTime = jest.fn(() => {
        callCount++;
        return callCount * 5;
      });
      const options: PollerBuilderOptions<string> = {
        nextDelayTime,
        pauseWhenHidden: false,
      };

      const result$ = buildRepeatPoller$(source$, options).pipe(take(3));
      const expected = '--a 5ms --a 10ms --(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });
});
