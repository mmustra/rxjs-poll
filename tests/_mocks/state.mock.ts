import { PollState } from '../../src/types/poll.type';

const defaultState: PollState<unknown> = {
  value: undefined,
  error: undefined,
  pollCount: 0,
  retryCount: 0,
  consecutiveRetryCount: 0,
};

export function createMockState<T>(overrides?: Partial<PollState<T>>): PollState<T> {
  return { ...defaultState, ...overrides } as PollState<T>;
}
