import { EMPTY, of, switchMap, take, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { getPollerFactory$, visibilityState$ } from '../../src/common/observables';
import { setPageActive } from '../../utils/test-helpers';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  setPageActive(true);
  jest.clearAllMocks();
});

describe('getPoller$', () => {
  it('should handle repeat type', () => {
    const getTime = jest.fn().mockReturnValue(10);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const result$ = getPollerFactory$('repeat', source$)(getTime).pipe(take(3));
      const expected = '---a 9ms ---a 9ms ---(a|)';
      expectObservable(result$).toBe(expected, { a: 'value' });
    });

    expect(getTime).toHaveBeenCalledWith('value');
  });

  it('should handle interval type', () => {
    const getTime = jest.fn().mockReturnValue(10);

    testScheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('--a|', { a: 'value' });
      const result$ = getPollerFactory$('interval', source$)(getTime).pipe(take(2));

      const expected = '---a 6ms ---(a|)';
      expectObservable(result$).toBe(expected, { a: 'value' });
    });
  });

  it('should handle interval type to interrupt incomplete sources', () => {
    let subscriptionCount = 0;
    const getTime = jest.fn().mockReturnValue(10);

    testScheduler.run(({ cold, expectObservable }) => {
      const createSource = () => {
        subscriptionCount++;

        if (subscriptionCount === 1) {
          return cold('-----a|', { a: 'initial' });
        } else if (subscriptionCount === 2) {
          return cold('---------------a|', { a: 'interrupted' });
        } else {
          return cold('-----a|', { a: 'success' });
        }
      };

      const source$ = cold('a|', { a: 'trigger' }).pipe(switchMap(() => createSource()));
      const result$ = getPollerFactory$('interval', source$)(getTime).pipe(take(2));
      const expected = '6ms a 19ms (b|)';

      expectObservable(result$).toBe(expected, { a: 'initial', b: 'success' });
    });

    expect(getTime).toHaveBeenCalledWith('initial');
  });
});

describe('visibilityState$', () => {
  it('should run when on active tab', async () => {
    testScheduler.run(({ expectObservable }) => {
      const source$ = visibilityState$.pipe(
        switchMap((isVisible) => (isVisible ? of('a') : of('b'))),
        take(1)
      );
      const expected = '(a|)';

      expectObservable(source$).toBe(expected);
    });
  });

  it('should pause when on other tab', async () => {
    setPageActive(false);

    testScheduler.run(({ expectObservable }) => {
      const source$ = visibilityState$.pipe(
        switchMap((isVisible) => (isVisible ? of('a') : of('b'))),
        take(1)
      );
      const expected = '(b|)';

      expectObservable(source$).toBe(expected);
    });
  });

  it('should run/pause when switching between tabs', () => {
    setPageActive(false);

    const addEventListener = jest
      .spyOn(document, 'addEventListener')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((eventType: string, listener: any) =>
        timer(4).subscribe(() => {
          setPageActive(true);
          listener();
        })
      );

    testScheduler.run(({ expectObservable }) => {
      const source$ = visibilityState$.pipe(switchMap((isVisible) => (isVisible ? of('a') : EMPTY)));
      const expected = '----(a|)';

      expectObservable(source$.pipe(take(1))).toBe(expected);
    });

    addEventListener.mockRestore();
  });
});
