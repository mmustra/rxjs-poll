import { PollState } from '../types/poll.type';

export const defaultState = {
  value: undefined,
  error: undefined,
  pollCount: 0,
  retryCount: 0,
  consecutiveRetryCount: 0,
} as const satisfies PollState<unknown>;
