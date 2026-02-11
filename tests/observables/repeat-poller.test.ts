import { take, takeUntil } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { PollService } from '../../src/common/service';
import * as utils from '../../src/common/utils';
import { timingToleranceMs } from '../../src/constants/timing.const';
import { buildRepeatPoller$ } from '../../src/observables/repeat-poller';
import { ExtendedPollConfig } from '../../src/types/config.type';

jest.mock('../../src/common/utils', () => ({
  ...jest.requireActual('../../src/common/utils'),
  isBrowser: jest.fn(() => true),
}));

jest.mock('../../src/observables/document-visibility', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withDocumentVisibility$: (poller$: any, pauser$: any) => poller$.pipe(takeUntil(pauser$)),
}));

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

const createMockConfig = <T>(overrides?: Partial<ExtendedPollConfig<T>>): ExtendedPollConfig<T> => ({
  type: 'repeat',
  delay: { strategy: 'constant', time: 1000 },
  retry: { strategy: 'constant', time: 1000, limit: 3, consecutiveOnly: true },
  pauseWhenHidden: false,
  getDelayTime: () => 1000,
  getRetryTime: () => 1000,
  ...overrides,
});

describe('buildRepeatPoller$', () => {
  it('should wait for source to complete before starting delay', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('----a|', { a: 'value' });
      const getDelayTime = jest.fn().mockReturnValue(10);
      const pollService = new PollService(createMockConfig<string>({ getDelayTime }));

      const result$ = buildRepeatPoller$(source$, pollService).pipe(take(3));
      const expected = '----a 10ms ----a 10ms ----(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
      testScheduler.flush();
      expect(getDelayTime).toHaveBeenCalled();
    });
  });

  it('should handle sources with multiple emissions', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const pollService = new PollService(createMockConfig<string>({ getDelayTime: () => 5 }));

      const result$ = buildRepeatPoller$(source$, pollService).pipe(take(6));
      const expected = '--a-b-c 5ms --a-b-(c|)';

      expectObservable(result$).toBe(expected, { a: 'A', b: 'B', c: 'C' });
    });
  });

  it('should delay based on dynamic values from nextDelayTime', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      let callCount = 0;
      const getDelayTime = jest.fn(() => {
        callCount++;
        return callCount * 5;
      });
      const pollService = new PollService(createMockConfig<string>({ getDelayTime }));

      const result$ = buildRepeatPoller$(source$, pollService).pipe(take(3));
      const expected = '--a 5ms --a 10ms --(a|)';

      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle immediate next poll when diffTime is negative or zero (browser with pauseWhenHidden)', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const getDelayTime = jest.fn(() => timingToleranceMs / 2);
      const pollService = new PollService(createMockConfig<string>({ pauseWhenHidden: true, getDelayTime }));

      const result$ = buildRepeatPoller$(source$, pollService).pipe(take(1));

      const expected = '--(a|)';
      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should schedule pause with positive diffTime when delay is longer than tolerance (browser with pauseWhenHidden)', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const getDelayTime = jest.fn(() => timingToleranceMs * 2);
      const pollService = new PollService(createMockConfig<string>({ pauseWhenHidden: true, getDelayTime }));

      const result$ = buildRepeatPoller$(source$, pollService).pipe(take(1));

      const expected = '--(a|)';
      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should use non-visibility repeat path when not in browser', () => {
    const isBrowserSpy = jest.spyOn(utils, 'isBrowser').mockReturnValue(false);

    try {
      testScheduler.run(({ cold, expectObservable }) => {
        const source$ = cold('----a|', { a: 'value' });
        const getDelayTime = jest.fn(() => 10);
        const pollService = new PollService(createMockConfig<string>({ pauseWhenHidden: true, getDelayTime }));

        const result$ = buildRepeatPoller$(source$, pollService).pipe(take(3));
        const expected = '----a 10ms ----a 10ms ----(a|)';

        expectObservable(result$).toBe(expected, { a: 'value' });
      });
    } finally {
      isBrowserSpy.mockRestore();
    }
  });
});
