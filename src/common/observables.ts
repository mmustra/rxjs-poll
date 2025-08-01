import { fromEvent, map, Observable, of, repeat, shareReplay, startWith, switchMap, takeLast, tap, timer } from 'rxjs';

import { PollType } from '../types/poll.type';
import { isBrowser, isDocumentVisible } from './utils';

export const visibilityState$ = pageVisibility$().pipe(shareReplay({ bufferSize: 1, refCount: true }));

export function getPoller$<T>(type: PollType, source$: Observable<T>, getTime: (value: T) => number): Observable<T> {
  let lastValue: T;
  const completed$ = source$.pipe(
    takeLast(1),
    tap((value) => {
      lastValue = value;
    })
  );

  return type === 'repeat'
    ? repeatWith$(completed$, () => getTime(lastValue))
    : repeatWith$(of(null), () => getTime(lastValue)).pipe(switchMap(() => completed$));
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
