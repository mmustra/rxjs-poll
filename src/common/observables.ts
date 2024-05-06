import { fromEvent, map, Observable, of, repeat, shareReplay, startWith, switchMap, takeLast, timer } from 'rxjs';

import { PollType } from './config';
import { isBrowser, isDocumentVisible } from './utils';

export const visibilityState$ = pageVisibility$().pipe(shareReplay({ bufferSize: 1, refCount: true }));

export function getPoller$<T>(type: PollType, source$: Observable<T>, getDelay: () => number): Observable<T> {
  const completed$ = source$.pipe(takeLast(1));

  return type === 'repeat'
    ? completed$.pipe(
        repeat({
          delay: () => timer(getDelay()),
        })
      )
    : dynamicInterval$(getDelay).pipe(switchMap(() => completed$));
}

function pageVisibility$(): Observable<boolean> {
  return isBrowser() ? fromEvent(document, 'visibilitychange').pipe(startWith(null), map(isDocumentVisible)) : of(true);
}

function dynamicInterval$(getDelay: () => number): Observable<null> {
  return of(null).pipe(
    repeat({
      delay: () => timer(getDelay()),
    })
  );
}
