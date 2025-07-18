import { PollTimeProducer, PollType } from './poll.type';
import { DynamicFunction, StrategyType } from './strategies.type';
import { MinMax, Nil } from './utils.type';

export type PollConfig<T> = {
  type?: PollType | Nil;
  delay?: PollDelayConfig<T> | Nil;
  retry?: PollRetryConfig<T> | Nil;
  pauseWhenHidden?: boolean | Nil;
};

export type NormalizedPollConfig<T> = {
  type: PollType;
  delay: NormalizedPollDelayConfig<T>;
  retry: NormalizedPollRetryConfig<T>;
  pauseWhenHidden: boolean;
};

export type ExtendedPollConfig<T> = NormalizedPollConfig<T> & {
  getDelayTime: PollTimeProducer<T>;
  getRetryTime: PollTimeProducer<T>;
};

export type PollDelayConfig<T> =
  | { time: DynamicFunction<T>; strategy: Extract<StrategyType, 'dynamic'> }
  | { time: MinMax; strategy: Extract<StrategyType, 'random'> }
  | { time: number; strategy: Extract<StrategyType, 'constant'> };

export type NormalizedPollDelayConfig<T> = {
  time: number | MinMax | DynamicFunction<T>;
  strategy: StrategyType;
};

export type PollRetryConfig<T> =
  | ((
      | { time: DynamicFunction<T>; strategy: Extract<StrategyType, 'dynamic'> }
      | { time: MinMax; strategy: Extract<StrategyType, 'random'> }
      | { time: number; strategy: Exclude<StrategyType, 'dynamic' | 'random'> }
    ) & { limit?: number; consecutiveOnly?: boolean })
  | { limit?: number; consecutiveOnly?: boolean; strategy?: never; time?: never };

export type NormalizedPollRetryConfig<T> = {
  time: number | MinMax | DynamicFunction<T>;
  strategy: StrategyType;
  limit: number;
  consecutiveOnly: boolean;
};
