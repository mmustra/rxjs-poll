import { fromEvent, map, Observable, of, repeat, shareReplay, startWith, switchMap, takeLast, tap, timer } from 'rxjs';

import { PollerFactory } from '../types/observables.type';
import { PollType } from '../types/poll.type';
import { isBrowser, isDocumentVisible } from './utils';

export const visibilityState$ = pageVisibility$().pipe(shareReplay({ bufferSize: 1, refCount: true }));

export function getPollerFactory$<T>(type: PollType, source$: Observable<T>): PollerFactory<T> {
  let lastValue: T;
  const completed$ = source$.pipe(
    takeLast(1),
    tap((value) => {
      lastValue = value;
    })
  );

  return type === 'repeat'
    ? (getNextTime) => repeatWith$(completed$, () => getNextTime(lastValue))
    : (getNextTime) => repeatWith$(of(null), () => getNextTime(lastValue)).pipe(switchMap(() => completed$));
}

function pageVisibility$(): Observable<boolean> {
  return isBrowser() ? fromEvent(document, 'visibilitychange').pipe(startWith(null), map(isDocumentVisible)) : of(true);
}

function repeatWith$<T>(source$: Observable<T>, getTime: () => number): Observable<T> {
  return source$.pipe(
    repeat({
      delay: () => timer(getTime()),
    })
  );
}
