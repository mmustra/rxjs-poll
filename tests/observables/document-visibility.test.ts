import { of, switchMap, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { getDocumentVisibility$, withDocumentVisibility$ } from '../../src/observables/document-visibility';

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  jest.clearAllMocks();
});

describe('getDocumentVisibility$', () => {
  it('should return observable that reflects document when used with real document', () => {
    testScheduler.run(({ expectObservable }) => {
      const source$ = getDocumentVisibility$().pipe(
        switchMap((isVisible) => (isVisible ? of('a') : of('b'))),
        take(1)
      );

      expectObservable(source$).toBe('(a|)', { a: 'a' });
    });
  });
});

describe('withDocumentVisibility$', () => {
  it('should run when visibility is true', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const visibility$ = of(true);
      const poller$ = cold('a|', { a: 'value' });
      const pauser$ = cold('--x');
      const result$ = withDocumentVisibility$(poller$, pauser$, visibility$).pipe(take(1));

      expectObservable(result$).toBe('(a|)', { a: 'value' });
    });
  });

  it('should pause when visibility is false (takeUntil pauser$)', () => {
    const visibility$ = of(false);
    testScheduler.run(({ cold, expectObservable }) => {
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const pauser$ = cold('---x');
      const result$ = withDocumentVisibility$(poller$, pauser$, visibility$);

      expectObservable(result$).toBe('a-b|', { a: 'A', b: 'B' });
    });
  });

  it('should resume new run when visibility switches from false to true', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const visibility$ = cold('f-t', { f: false, t: true });
      const poller$ = cold('a-b-c|', { a: 'A', b: 'B', c: 'C' });
      const pauser$ = cold('x');
      const result$ = withDocumentVisibility$(poller$, pauser$, visibility$).pipe(take(2));

      expectObservable(result$).toBe('a-(a|)', { a: 'A' });
    });
  });
});
