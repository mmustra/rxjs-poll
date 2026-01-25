import { Observable } from 'rxjs';

import { PollConfig } from './config.type';
import { PollState } from './poll.type';

/**
 * Factory that creates a polling Observable
 * @param state - Poll state object containing polling metadata
 * @returns Observable that emits values of type T
 */
export type PollerFactory<T> = (state: PollState<T>) => Observable<T>;

/**
 * Options for building a repeat poller observable.
 * @property nextDelayTime - Function that returns the next polling delay (ms)
 * @property pauseWhenHidden - Whether polling should pause when the document is hidden
 */
export type PollerBuilderOptions<T> = {
  nextDelayTime: () => number;
} & Pick<PollConfig<T>, 'pauseWhenHidden'>;

/**
 * Function type that produces the next delay time based on the provided value.
 * @param value - Last emitted value
 * @returns Next delay time in milliseconds
 */
export type NextTimeProducer<T> = (value: T) => number;
