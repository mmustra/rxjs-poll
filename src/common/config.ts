import { isFunction, isNil, Nil, normalizeNumber, sampleNumber, UnsafeMinMax } from './utils';

export function normalizeConfig(config?: PollConfig | Nil): NormalizedPollConfig {
  return {
    type: config?.type ?? controlConfig.type,
    getDelay: isFunction(config?.delay) ? delayProducer(config.delay) : defaultProducer(config?.delay),
    retries: normalizeNumber(config?.retries, controlConfig.retries, false),
    isConsecutiveRule: isNil(config?.isConsecutiveRule) ? true : config.isConsecutiveRule,
    isBackgroundMode: Boolean(config?.isBackgroundMode),
  };
}

function delayProducer(delayFunc: PollDelayFunc): DelayProducer {
  return (state: PollState): number => {
    const delay = delayFunc(Object.assign({}, state));
    const normalizedDelay = normalizeNumber(delay, controlConfig.delay);

    return sampleNumber(normalizedDelay);
  };
}

function defaultProducer(delay: number | UnsafeMinMax | Nil): DelayProducer {
  const normalizedDelay = normalizeNumber(delay, controlConfig.delay);

  return (): number => sampleNumber(normalizedDelay);
}

export const controlConfig: ControlPollConfig = {
  type: 'repeat',
  delay: 1000,
  retries: 3,
  isConsecutiveRule: true,
  isBackgroundMode: false,
};

export type ControlPollConfig = {
  delay: number;
} & Omit<NormalizedPollConfig, 'getDelay'>;

export type NormalizedPollConfig = {
  type: PollType;
  getDelay: DelayProducer;
  retries: number;
  isConsecutiveRule: boolean;
  isBackgroundMode: boolean;
};

export type PollConfig = {
  type?: PollType | Nil;
  delay?: number | UnsafeMinMax | PollDelayFunc | Nil;
  retries?: number | Nil;
  isConsecutiveRule?: boolean | Nil;
  isBackgroundMode?: boolean | Nil;
};

export type PollType = 'repeat' | 'interval';
export type PollDelayFunc = (state: PollState) => number | UnsafeMinMax | Nil;
type DelayProducer = (state: PollState) => number;

export type PollState = {
  polls: number;
  error: any | null;
} & Record<RetryKey, number>;

export type RetryKey = 'retries' | 'consecutiveRetries';
