import { pollMode, pollType } from '../constants/poll.const';
import { RetryKey } from './retry.type';

/**
 * Defines the polling behavior mode
 * - "delay": Delay mode
 * - "retry": Retry mode
 */
export type PollMode = (typeof pollMode)[keyof typeof pollMode];

/**
 * Defines the polling behavior type
 * - "repeat": Polls after current source completes
 * - "interval": Polls in intervals, dropping any ongoing source operations
 */
export type PollType = (typeof pollType)[keyof typeof pollType];

/**
 * Current polling state information available to timing functions
 */
export type PollState<T> = {
  /** Latest value from the source. For "interval" polling type, first emission is undefined. */
  value: T | undefined;
  /** Latest error when retrying */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any | undefined;
  /** Total number of successful poll operations */
  pollCount: number;
  /**
   * Properties for counting retries
   * - "retryCount": Total number of retry attempts
   * - "consecutiveRetryCount": Current number of consecutive retry attempts
   */
} & Record<RetryKey, number>;

/**
 * All possible keys in the PollState object
 */
export type PollStateKeys = keyof PollState<unknown>;

/**
 * Function that produces time values based on poll state
 * Used for dynamic timing strategies in delay and retry configurations
 * @param state - Current poll state containing counts, value, and error information
 * @returns Time in milliseconds for the next delay/retry
 */
export type PollTimeProducer<T> = (state: PollState<T>) => number;
