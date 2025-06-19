/**
 * @jest-environment node
 */

import { delay, of, raceWith, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { poll } from '../src';

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
});

describe('Node Environment', () => {
  it('Should always poll when background mode is "true"', () => {
    testScheduler.run(({ expectObservable }) => {
      const source$ = of('a').pipe(poll({ delay: 2, isBackgroundMode: true }));
      const timeout$ = of('b').pipe(delay(5000));
      const expected = 'a-(a|)';

      expectObservable(source$.pipe(raceWith(timeout$), take(2))).toBe(expected);
    });
  });

  it('Should always poll when background mode is "false"', () => {
    testScheduler.run(({ expectObservable }) => {
      const source$ = of('a').pipe(poll({ delay: 2, isBackgroundMode: false }));
      const timeout$ = of('b').pipe(delay(5000));
      const expected = 'a-(a|)';

      expectObservable(source$.pipe(raceWith(timeout$), take(2))).toBe(expected);
    });
  });
});

let testScheduler: TestScheduler;
