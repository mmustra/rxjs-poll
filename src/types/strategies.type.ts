import { strategyType } from '../constants/strategies.const';
import { PollState } from './poll.type';
import { MinMax } from './utils.type';

export type StrategyType = (typeof strategyType)[keyof typeof strategyType];

export type DynamicFunction<T> = (state: PollState<T>) => number | MinMax;
