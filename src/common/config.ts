import { isFunction, isNil, Nil, normalizeNumber, sampleNumber, UnsafeMinMax } from './utils';

export function normalizeConfig<T>(config?: PollConfig<T> | Nil): NormalizedPollConfig<T> {
  return {
    type: config?.type ?? controlConfig.type,
    getDelay: isFunction(config?.delay) ? delayProducer(config.delay) : defaultProducer(config?.delay),
    retries: normalizeNumber(config?.retries, controlConfig.retries, false),
    isConsecutiveRule: isNil(config?.isConsecutiveRule) ? true : config.isConsecutiveRule,
    isBackgroundMode: Boolean(config?.isBackgroundMode),
  };
}

function delayProducer<T>(delayFunc: PollDelayFunc<T>): DelayProducer<T> {
  return (state): number => {
    const delay = delayFunc(Object.assign({}, state));
    const normalizedDelay = normalizeNumber(delay, controlConfig.delay);

    return sampleNumber(normalizedDelay);
  };
}

function defaultProducer<T>(delay: number | UnsafeMinMax | Nil): DelayProducer<T> {
  const normalizedDelay = normalizeNumber(delay, controlConfig.delay);

  return (): number => sampleNumber(normalizedDelay);
}

export const controlConfig: ControlPollConfig<any> = {
  type: 'repeat',
  delay: 1000,
  retries: 3,
  isConsecutiveRule: true,
  isBackgroundMode: false,
};

export type ControlPollConfig<T> = {
  delay: number;
} & Omit<NormalizedPollConfig<T>, 'getDelay'>;

export type NormalizedPollConfig<T> = {
  type: PollType;
  getDelay: DelayProducer<T>;
  retries: number;
  isConsecutiveRule: boolean;
  isBackgroundMode: boolean;
};

export type PollConfig<T> = {
  type?: PollType | Nil;
  delay?: number | UnsafeMinMax | PollDelayFunc<T> | Nil;
  retries?: number | Nil;
  isConsecutiveRule?: boolean | Nil;
  isBackgroundMode?: boolean | Nil;
};

export type PollType = 'repeat' | 'interval';
export type PollDelayFunc<T> = (state: PollState<T>) => number | UnsafeMinMax | Nil;
type DelayProducer<T> = (state: PollState<T>) => number;

export type PollState<T> = {
  polls: number;
  value: T;
  error: any | null;
} & Record<RetryKey, number>;

export type RetryKey = 'retries' | 'consecutiveRetries';
