import { NormalizedPollConfig } from './config.type';
import { PollState } from './poll.type';

/**
 * Service interface for managing poll state and configuration
 */
export type PollStateService<T> = {
  readonly config: Readonly<NormalizedPollConfig<T>>;
  readonly state: Readonly<PollState<T>>;
  setValue: (value: T) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: (error: any) => void;
  resetError: () => void;
  isRetryLimit: () => boolean;
  incrementPoll: () => void;
  incrementRetry: () => void;
  getDelayTime: () => number;
  getRetryTime: () => number;
};
