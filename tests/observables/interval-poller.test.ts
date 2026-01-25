import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { buildIntervalPoller$ } from '../../src/observables/interval-poller';
import { PollerBuilderOptions } from '../../src/types/observables.type';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

describe('buildIntervalPoller$', () => {
  it('should emit at fixed intervals regardless of source duration', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const options: PollerBuilderOptions<string> = {
        nextDelayTime: jest.fn().mockReturnValue(10),
        pauseWhenHidden: false,
      };

      const result$ = buildIntervalPoller$(source$, options).pipe(take(2));
      const expected = '2ms a 9ms (a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should call nextDelayTime for each interval', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const nextDelayTime = jest.fn().mockReturnValue(10);
      const options: PollerBuilderOptions<string> = {
        nextDelayTime,
        pauseWhenHidden: false,
      };

      const result$ = buildIntervalPoller$(source$, options).pipe(take(2));
      const expected = '2ms a 9ms (a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
      testScheduler.flush();

      expect(nextDelayTime).toHaveBeenCalled();
    });
  });

  it('should support dynamic delay times', () => {
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

      const result$ = buildIntervalPoller$(source$, options).pipe(take(3));
      const expected = '2ms a 4ms a 9ms (a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });
});
