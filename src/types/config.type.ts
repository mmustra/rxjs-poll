import { Observable } from 'rxjs';

import { PollTimeProducer, PollType } from './poll.type';
import { DynamicFunction, StrategyType } from './strategies.type';
import { MinMax, Nil } from './utils.type';

/**
 * Configuration object for the poll operator
 */
export interface PollConfig<T> {
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
   * Configuration for pause behavior
   */
  pause?: PollPauseConfig | Nil;
}

/**
 * Type-safe delay configuration with strategy-specific time constraints.
 * Ensures that the `time` property type matches the selected strategy:
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
 * @default { strategy: "constant", time: 1000 }
 */
export type PollDelayConfig<T> =
  | { time: DynamicFunction<T>; strategy: Extract<StrategyType, 'dynamic'> }
  | { time: MinMax; strategy: Extract<StrategyType, 'random'> }
  | { time: number; strategy: Exclude<StrategyType, 'dynamic' | 'random'> };

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
 * @default { strategy: "exponential", time: 1000, limit: 3, consecutiveOnly: true }
 */
export type PollRetryConfig<T> =
  | (PollDelayConfig<T> & { limit?: number; consecutiveOnly?: boolean })
  | { limit?: number; consecutiveOnly?: boolean; strategy?: never; time?: never };

/**
 * Type-safe pause configuration for polling.
 *
 * **Options:**
 * - "notifier": Observable<boolean> that emits true to pause, false to resume. Use to pause at will.
 *   If it never emits, polling starts (same as resume). To start paused, use an observable that
 *   emits true initially (e.g. BehaviorSubject(true)).
 * - "whenHidden": Pause polling automatically when tab is hidden (if applicable)
 *
 * @default { notifier: false, whenHidden: true }
 */
export interface PollPauseConfig {
  notifier?: Observable<boolean> | Nil;
  whenHidden?: boolean | Nil;
}

/**
 * Extended configuration that includes computed time producer functions
 */
export type ExtendedPollConfig<T> = NormalizedPollConfig<T> & {
  getDelayTime: PollTimeProducer<T>;
  getRetryTime: PollTimeProducer<T>;
};

/**
 * Normalized configuration with all optional fields resolved to their default values
 */
export interface NormalizedPollConfig<T> {
  type: PollType;
  delay: NormalizedPollDelayConfig<T>;
  retry: NormalizedPollRetryConfig<T>;
  pause: NormalizedPollPauseConfig;
}

/**
 * Normalized delay configuration with resolved defaults
 */
export interface NormalizedPollDelayConfig<T> {
  time: number | MinMax | DynamicFunction<T>;
  strategy: StrategyType;
}

/**
 * Normalized retry configuration with resolved defaults
 */
export interface NormalizedPollRetryConfig<T> {
  time: number | MinMax | DynamicFunction<T>;
  strategy: StrategyType;
  limit: number;
  consecutiveOnly: boolean;
}

/**
 * Normalized pause configuration
 */
export interface NormalizedPollPauseConfig {
  notifier: Observable<boolean>;
  whenHidden: boolean;
}
