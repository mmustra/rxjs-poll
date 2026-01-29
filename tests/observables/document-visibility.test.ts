import { EMPTY, of, switchMap, take, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { getDocumentVisibility$ } from '../../src/observables/document-visibility';
import { setDocumentVisibility } from '../../utils/test-helpers';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  setDocumentVisibility(true);
  jest.clearAllMocks();
});

describe('visibilityState$', () => {
  it('should run when on active tab', async () => {
    testScheduler.run(({ expectObservable }) => {
      const source$ = getDocumentVisibility$().pipe(
        switchMap((isVisible) => (isVisible ? of('a') : of('b'))),
        take(1)
      );
      const expected = '(a|)';

      expectObservable(source$).toBe(expected);
    });
  });

  it('should pause when on other tab', async () => {
    setDocumentVisibility(false);
    document.dispatchEvent(new Event('visibilitychange'));

    testScheduler.run(({ expectObservable }) => {
      const source$ = getDocumentVisibility$().pipe(
        switchMap((isVisible) => (isVisible ? of('a') : of('b'))),
        take(1)
      );
      const expected = '(b|)';

      expectObservable(source$).toBe(expected);
    });
  });

  it('should run/pause when switching between tabs', () => {
    setDocumentVisibility(false);
    document.dispatchEvent(new Event('visibilitychange'));

    testScheduler.run(({ expectObservable }) => {
      const source$ = getDocumentVisibility$().pipe(switchMap((isVisible) => (isVisible ? of('a') : EMPTY)));

      // Schedule visibility change at frame 4
      timer(4).subscribe(() => {
        setDocumentVisibility(true);
        document.dispatchEvent(new Event('visibilitychange'));
      });

      const expected = '----(a|)';
      expectObservable(source$.pipe(take(1))).toBe(expected);
    });
  });
});
