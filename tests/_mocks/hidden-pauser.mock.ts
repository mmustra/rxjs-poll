import { BehaviorSubject, Observable } from 'rxjs';

const actual = jest.requireActual('../../src/poller/pause/with-hidden-pause');
export const hiddenNotifier$ = new BehaviorSubject(false);

export function withHiddenPause$<T>(
  poller$: Observable<T>,
  cycler$: Observable<0>
  // notifier$ is ignored in tests; we always use hiddenNotifier$
): Observable<T> {
  return actual.withHiddenPause$(poller$, cycler$, hiddenNotifier$);
}

export function getHiddenNotifier$(): Observable<boolean> {
  return hiddenNotifier$;
}
