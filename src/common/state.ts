import { PollState } from '../types/poll.type';

/**
 * Creates a poll state object with default values and optional overrides.
 * @param partial - Optional partial state object to override defaults
 * @returns Complete poll state object with all required properties
 */
export function createState<T>(partial?: Partial<PollState<T>>): PollState<T> {
  return {
    value: undefined,
    error: undefined,
    pollCount: 0,
    retryCount: 0,
    consecutiveRetryCount: 0,
    ...partial,
  };
}
