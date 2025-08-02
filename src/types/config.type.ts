import { PollTimeProducer, PollType } from './poll.type';
import { DynamicFunction, StrategyType } from './strategies.type';
import { MinMax, Nil } from './utils.type';

/**
 * Configuration object for the poll operator
 * @template T - Type of the observable value being polled
 */
export type PollConfig<T> = {
  /**
   * Defines the polling behavior:
   * - "repeat": Polls after current source completes
   * - "interval": Polls in intervals, dropping any ongoing source operations
   * @default "repeat"
   */
  type?: PollType | Nil;
  /**
   * Configuration for polling delays (between successful operations)
   */
  delay?: PollDelayConfig<T> | Nil;
  /**
   * Configuration for retry behavior (on errors)
   */
  retry?: PollRetryConfig<T> | Nil;
  /**
   * [Browser only] Controls polling behavior when page isn't visible
   * - "true": Pause polling when tab isn't active, and resume on active
   * - "false": Poll even when tab isn't focused
   * @default true
   */
  pauseWhenHidden?: boolean | Nil;
};

/**
 * Type-safe delay configuration with strategy-specific time constraints.
 * Ensures that the `time` property type matches the selected strategy:
 *
 * **Strategy:**
 * - "constant": Fixed timing
 * - "random": Random timing within a range
 * - "dynamic": Custom function-based timing
 *
 * **Time:**
 * - "constant": number
 * - "random": [min, max]
 * - "dynamic": (state) => number | [min, max]
 *
 * @template T - Type of the observable value being polled
 * @default { strategy: "constant", time: 1000 }
 */
export type PollDelayConfig<T> =
  | { time: DynamicFunction<T>; strategy: Extract<StrategyType, 'dynamic'> }
  | { time: MinMax; strategy: Extract<StrategyType, 'random'> }
  | { time: number; strategy: Extract<StrategyType, 'constant'> };

/**
 * Type-safe retry configuration with strategy-specific time constraints and optional settings.
 * Allows either full configuration with strategy/time or minimal configuration with just limit/consecutiveOnly.
 *
 * **Strategy:**
 * - "constant": Fixed timing
 * - "linear": Linearly increasing timing
 * - "exponential": Exponentially increasing timing
 * - "random": Random timing within a range
 * - "dynamic": Custom function-based timing
 *
 * **Time:**
 * - "constant": number
 * - "linear": number
 * - "exponential": number
 * - "random": [min, max]
 * - "dynamic": (state) => number | [min, max]
 *
 * **Options:**
 * - "limit": Maximum retry attempts before throwing error
 * - "consecutiveOnly": Whether to count only consecutive retries or all retries
 *
 * @template T - Type of the observable value being polled
 * @default { strategy: "exponential", time: 1000, limit: 3, consecutiveOnly: true }
 */
export type PollRetryConfig<T> =
  | ((
      | { time: DynamicFunction<T>; strategy: Extract<StrategyType, 'dynamic'> }
      | { time: MinMax; strategy: Extract<StrategyType, 'random'> }
      | { time: number; strategy: Exclude<StrategyType, 'dynamic' | 'random'> }
    ) & { limit?: number; consecutiveOnly?: boolean })
  | { limit?: number; consecutiveOnly?: boolean; strategy?: never; time?: never };

/**
 * Extended configuration that includes computed time producer functions
 * @template T - Type of the observable value being polled
 */
export type ExtendedPollConfig<T> = NormalizedPollConfig<T> & {
  getDelayTime: PollTimeProducer<T>;
  getRetryTime: PollTimeProducer<T>;
};

/**
 * Normalized configuration with all optional fields resolved to their default values
 * @template T - Type of the observable value being polled
 */
export type NormalizedPollConfig<T> = {
  type: PollType;
  delay: NormalizedPollDelayConfig<T>;
  retry: NormalizedPollRetryConfig<T>;
  pauseWhenHidden: boolean;
};

/**
 * Normalized delay configuration with resolved defaults
 * @template T - Type of the observable value being polled
 */
export type NormalizedPollDelayConfig<T> = {
  time: number | MinMax | DynamicFunction<T>;
  strategy: StrategyType;
};

/**
 * Normalized retry configuration with resolved defaults
 * @template T - Type of the observable value being polled
 */
export type NormalizedPollRetryConfig<T> = {
  time: number | MinMax | DynamicFunction<T>;
  strategy: StrategyType;
  limit: number;
  consecutiveOnly: boolean;
};
