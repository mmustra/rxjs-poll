import { strategyType } from '../constants/strategies.const';
import { PollState } from './poll.type';
import { MinMax } from './utils.type';

/**
 * Available timing strategy types for delay and retry configurations
 * - "constant": Fixed time value
 * - "linear": Linearly increasing time based on attempt count
 * - "exponential": Exponentially increasing time based on attempt count
 * - "random": Random time within specified range
 * - "dynamic": Custom function that returns time based on poll state
 */
export type StrategyType = (typeof strategyType)[keyof typeof strategyType];

/**
 * Function for dynamic timing strategies that calculates delay/retry time
 * based on current poll state
 * @param state - Current poll state containing counts, latest value, and error
 * @returns Either a fixed time in milliseconds or a [min, max] range for random selection
 */
export type DynamicFunction<T> = (state: PollState<T>) => number | MinMax;
