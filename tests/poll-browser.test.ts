import { delay, delayWhen, from, last, map, mergeMap, of, raceWith, take, takeWhile, throwError, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { poll } from '../src';
import { controlConfig } from '../src/common/config';
import { MinMax, randomNumber } from '../src/common/utils';

beforeEach(() => {
  jest.clearAllMocks();
  setPageActive(true);

  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
});

jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

describe('Browser Environment', () => {
  it('Should poll with default values', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const outputDelay = controlConfig.delay - 1;
      const source$ = of('a').pipe(map((a) => (++counter > 3 ? 'b' : a)));
      const expected = `a ${outputDelay}ms a ${outputDelay}ms a ${outputDelay}ms (b|)`;

      expectObservable(
        source$.pipe(
          poll(),
          takeWhile((result) => result === 'a', true)
        )
      ).toBe(expected);
    });
  });

  it('Should poll with random delay', () => {
    const delayRange = [1000, 2000] as MinMax;
    const outputDelay = randomNumber(...delayRange) - 1;

    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = of('a').pipe(map((a) => (++counter > 3 ? 'b' : a)));
      const expected = `a ${outputDelay}ms a ${outputDelay}ms a ${outputDelay}ms (b|)`;

      expectObservable(
        source$.pipe(
          poll({ delay: delayRange }),
          takeWhile((result) => result === 'a', true)
        )
      ).toBe(expected);
    });
  });

  it('Should poll once source completes for "repeat"', () => {
    testScheduler.run(({ expectObservable }) => {
      const outputDelay = controlConfig.delay - 1;
      const source$ = from(['a', 'a', 'a', 'a', 'b']);
      const expected = `b ${outputDelay}ms b ${outputDelay}ms b ${outputDelay}ms (b|)`;

      expectObservable(source$.pipe(poll({ type: 'repeat' }), take(4))).toBe(expected);
    });
  });

  it('Should poll once source completes for "interval"', () => {
    testScheduler.run(({ expectObservable }) => {
      const outputDelay = controlConfig.delay - 1;
      const source$ = from(['a', 'a', 'a', 'a', 'b']);
      const expected = `b ${outputDelay}ms b ${outputDelay}ms b ${outputDelay}ms (b|)`;

      expectObservable(source$.pipe(poll({ type: 'interval' }), take(4))).toBe(expected);
    });
  });

  it('Should poll with interval and drop incomplete sources', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = of('a').pipe(
        delayWhen(() => timer(3500 / ++counter)),
        map(() => counter)
      );
      const expected = '3875ms (a|)';

      expectObservable(source$.pipe(poll({ type: 'interval', delay: 1000 }), take(1))).toBe(expected, { a: 4 });
    });
  });

  it('Should poll when in background mode and page is not active', () => {
    setPageActive(false);

    testScheduler.run(({ expectObservable }) => {
      const source$ = of('a').pipe(poll({ delay: 2, isBackgroundMode: true }));
      const timeout$ = of('b').pipe(delay(5000));
      const expected = 'a-(a|)';

      expectObservable(source$.pipe(raceWith(timeout$), take(2))).toBe(expected);
    });
  });

  it('Should pause when not in background mode and page is not active', () => {
    setPageActive(false);

    testScheduler.run(({ expectObservable }) => {
      const source$ = of('a').pipe(poll({ delay: 2, isBackgroundMode: false }));
      const timeout$ = of('b').pipe(delay(5000));
      const expected = '5000ms (b|)';

      expectObservable(source$.pipe(raceWith(timeout$), take(1))).toBe(expected);
    });
  });

  it('Should poll when switching page to active', () => {
    setPageActive(false);

    // Ref: https://github.com/jiayihu/rx-polling/blob/master/test/index.spec.ts#L98
    const addEventListener = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((eventType: string, listener: any) =>
        timer(4).subscribe(() => {
          setPageActive(true);

          listener();
        })
      );

    testScheduler.run(({ expectObservable }) => {
      const source$ = of('a');
      const expected = '----(a|)';

      expectObservable(source$.pipe(poll({ isBackgroundMode: false }), take(1))).toBe(expected);
    });

    addEventListener.mockRestore();
  });

  it('Should not error for consecutive rule "true"', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 2 ? throwError(() => 'error') : a)));
      const expected = 'a 1999ms a 1999ms a 1999ms (a|)';

      expectObservable(
        source$.pipe(poll({ isConsecutiveRule: true, type: 'repeat', delay: 1000, retries: 1 }), take(4))
      ).toBe(expected);
    });
  });

  it('Should error for consecutive rule "false"', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 2 ? throwError(() => 'error') : a)));
      const expected = 'a 1999ms a 999ms #';

      expectObservable(source$.pipe(poll({ isConsecutiveRule: false, type: 'repeat', delay: 1000, retries: 1 }))).toBe(
        expected
      );
    });
  });

  it('Should allow static and random number when using delay function', () => {
    const pollDelay = 1000;
    const delayRange = [1000, 2000] as MinMax;
    const randomDelay = randomNumber(...delayRange) - 1;

    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 2 ? throwError(() => 'error') : a)));
      const expected = `a ${randomDelay + pollDelay}ms a ${randomDelay + pollDelay}ms (a|)`;

      expectObservable(
        source$.pipe(
          poll({
            type: 'repeat',
            delay({ error }) {
              if (error) {
                return delayRange;
              }

              return pollDelay;
            },
            retries: 1,
          }),
          take(3)
        )
      ).toBe(expected);
    });
  });

  it('Should get delay from value using delay function - repeat', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const counterMax = 3;
      const source$ = of('a').pipe(map(() => 'x'.repeat(++counter)));
      const expected = `${controlConfig.delay * triangular(counterMax - 1)}ms (a|)`;

      expectObservable(
        source$.pipe(
          poll({
            delay: ({ value }) => value.length * controlConfig.delay,
          }),
          take(counterMax),
          last()
        )
      ).toBe(expected, { a: 'x'.repeat(counterMax) });
    });
  });

  it('Should get delay from value using delay function - interval', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const counterMax = 5;
      const source$ = of('a').pipe(map(() => 'x'.repeat(++counter)));
      const expected = `${controlConfig.delay * triangular(counterMax - 1)}ms (a|)`;

      expectObservable(
        source$.pipe(
          poll({
            type: 'interval',
            delay: ({ value }) => value.length * controlConfig.delay,
          }),
          take(counterMax),
          last()
        )
      ).toBe(expected, { a: 'x'.repeat(counterMax) });
    });
  });

  it('Should have backoff strategy for consecutive retries', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 3 ? throwError(() => 'error') : a)));
      const expected = 'a 3999ms a 3999ms a 3999ms (a|)';

      expectObservable(
        source$.pipe(
          poll({
            type: 'repeat',
            delay({ consecutiveRetries, error }) {
              if (error) {
                const nextDelay = 2 ** (consecutiveRetries - 1) * 1000;
                return nextDelay;
              }

              return 1000;
            },
            retries: 2,
          }),
          take(4)
        )
      ).toBe(expected);
    });
  });

  it('Should have correct polls + retries count for "repeat" using delay function', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      let totalPolls = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 2 ? throwError(() => 'error') : a)));
      const expected = '6000ms (a|)';

      expectObservable(
        source$.pipe(
          poll({
            type: 'repeat',
            delay({ polls, retries }) {
              totalPolls = polls + retries;

              return 1000;
            },
            retries: 1,
          }),
          take(4),
          last(),
          map(() => totalPolls)
        )
      ).toBe(expected, { a: 6 });
    });
  });

  it('Should have correct polls + retries count for "interval" using delay function', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      let totalPolls = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 2 ? throwError(() => 'error') : a)));
      const expected = '6000ms (a|)';

      expectObservable(
        source$.pipe(
          poll({
            type: 'interval',
            delay({ polls, retries }) {
              totalPolls = polls + retries;

              return 1000;
            },
            retries: 1,
          }),
          take(4),
          last(),
          map(() => totalPolls)
        )
      ).toBe(expected, { a: 6 });
    });
  });

  it('Should have correct retries and consecutiveRetries counts using delay function', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      let totalConsecutiveRetries = 0;
      let totalAllretries = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 3 ? throwError(() => 'error') : a)));
      const expected = '9000ms (a|)';

      expectObservable(
        source$.pipe(
          poll({
            type: 'repeat',
            delay({ retries, consecutiveRetries }) {
              totalConsecutiveRetries += consecutiveRetries;
              totalAllretries = retries + totalConsecutiveRetries;

              return 1000;
            },
            retries: 2,
          }),
          take(4),
          last(),
          map(() => totalAllretries)
        )
      ).toBe(expected, { a: 15 });
    });
  });

  it('Should correctly switch state error flag using delay function', () => {
    testScheduler.run(({ expectObservable }) => {
      let counter = 0;
      let totalErrors = 0;
      const source$ = of('a').pipe(mergeMap((a) => (counter++ % 2 ? throwError(() => 'error') : a)));
      const expected = '6000ms (a|)';

      expectObservable(
        source$.pipe(
          poll({
            type: 'repeat',
            delay({ error }) {
              totalErrors += Number(!!error);

              return 1000;
            },
            retries: 1,
          }),
          take(4),
          last(),
          map(() => totalErrors)
        )
      ).toBe(expected, { a: 3 });
    });
  });
});

let testScheduler: TestScheduler;
function setPageActive(isActive: boolean) {
  // NOTE recommended for handling "document.hidden", but currently won't work with jsdom.reconfigure()
  // ref: https://github.com/jestjs/jest/issues/7142#issuecomment-429101915
  //      https://github.com/jsdom/jsdom/pull/2392
  Object.defineProperty(document, 'hidden', {
    value: !isActive,
    configurable: true,
  });
}

function triangular(value: number): number {
  let a = 0;

  for (let i = 1; i <= value; i++) {
    a += i;
  }

  return a;
}
