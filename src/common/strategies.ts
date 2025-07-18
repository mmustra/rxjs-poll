import { NormalizedPollConfig } from '../types/config.type';
import { PollMode, PollState, PollStateKeys } from '../types/poll.type';
import { DynamicFunction } from '../types/strategies.type';
import { MinMax } from '../types/utils.type';
import { randomNumber } from './utils';

export function getStrategyTimeProducer<T>(mode: PollMode, config: NormalizedPollConfig<T>): DynamicFunction<T> {
  const { strategy, time } = config[mode];
  const isDelayMode = mode === 'delay';
  const isConsecutive = config.retry.consecutiveOnly;
  let timeProducer: DynamicFunction<T>;
  let attemptKey: PollStateKeys;

  if (isDelayMode) {
    attemptKey = 'pollCount';
  } else if (isConsecutive) {
    attemptKey = 'consecutiveRetryCount';
  } else {
    attemptKey = 'retryCount';
  }

  switch (strategy) {
    case 'constant':
      timeProducer = () => time as number;
      break;
    case 'linear':
      timeProducer = (state) => state[attemptKey] * (time as number);
      break;
    case 'exponential':
      timeProducer = (state) => Math.pow(2, state[attemptKey] - 1) * (time as number);
      break;
    case 'random':
      timeProducer = () => randomNumber((time as MinMax)[0], (time as MinMax)[1]);
      break;
    case 'dynamic':
      timeProducer = (state: PollState<T>) => (time as DynamicFunction<T>)(state);
      break;
    default:
      throw new Error('rxjs-poll: Unknown strategy!');
  }

  return timeProducer;
}
