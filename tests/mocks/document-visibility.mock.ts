import { BehaviorSubject, Observable } from 'rxjs';

const actual = jest.requireActual('../../src/observables/document-visibility');
const visibility$ = new BehaviorSubject(true);

export function documentVisibility$(): BehaviorSubject<boolean> {
  return visibility$;
}

export function withDocumentVisibility$<T>(poller$: Observable<T>, pauser$: Observable<unknown>): Observable<T> {
  return actual.withDocumentVisibility$(poller$, pauser$, visibility$);
}

export { getDocumentVisibility$ } from '../../src/observables/document-visibility';
