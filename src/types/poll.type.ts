import { pollMode, pollType } from '../constants/poll.const';

export type PollMode = (typeof pollMode)[keyof typeof pollMode];

export type PollType = (typeof pollType)[keyof typeof pollType];

export type PollState<T> = {
  pollCount: number;
  value: T | undefined;
  error: any | undefined;
} & Record<RetryKey, number>;

export type RetryKey = 'retryCount' | 'consecutiveRetryCount';

export type PollStateKeys = keyof PollState<unknown>;

export type PollTimeProducer<T> = (state: PollState<T>) => number;
