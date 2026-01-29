import { map, Observable, of, timer } from 'rxjs';

import { timingToleranceMs } from '../constants/timing.const';
import { PauseDelayOptions } from '../types/observables.type';

/**
 * Returns an observable that emits null after the computed pause delay, or immediately if delay <= 0
 */
export function getPauseDelay$(options: PauseDelayOptions): Observable<null> {
  const { time, sourceStartTime = 0, sourceEndTime = 0 } = options;
  const delayMs = time - (sourceEndTime - sourceStartTime) - timingToleranceMs;

  return delayMs > 0 ? timer(delayMs).pipe(map(() => null)) : of(null);
}
