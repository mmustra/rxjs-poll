import { controlConfig } from '../constants/config.const';
import { ExtendedPollConfig, NormalizedPollConfig, PollConfig } from '../types/config.type';
import { PollMode, PollTimeProducer } from '../types/poll.type';
import { Nil } from '../types/utils.type';
import { getStrategyTimeProducer } from './strategies';
import { isFunction, normalizeNumber, pickNumber } from './utils';

export function extendConfig<T>(config?: PollConfig<T> | Nil): ExtendedPollConfig<T> {
  const normalizedConfig: NormalizedPollConfig<T> = normalizeConfig(config);

  return {
    ...normalizedConfig,
    getDelayTime: getTimeProducer('delay', normalizedConfig),
    getRetryTime: getTimeProducer('retry', normalizedConfig),
  };
}

function getTimeProducer<T>(mode: PollMode, config: NormalizedPollConfig<T>): PollTimeProducer<T> {
  const defaultTime = controlConfig[mode].time;
  const timeProducer = getStrategyTimeProducer(mode, config);

  return (state): number => {
    const producedTime = timeProducer({ ...state });
    const normalizedTime = normalizeNumber(producedTime, defaultTime);

    return pickNumber(normalizedTime);
  };
}

function normalizeConfig<T>(config: PollConfig<T> | Nil): NormalizedPollConfig<T> {
  return {
    type: config?.type ?? controlConfig.type,
    delay: {
      strategy: config?.delay?.strategy ?? controlConfig.delay.strategy,
      time: isFunction(config?.delay?.time)
        ? config.delay.time
        : normalizeNumber(config?.delay?.time, controlConfig.delay.time),
    },
    retry: {
      strategy: config?.retry?.strategy ?? controlConfig.retry.strategy,
      time: isFunction(config?.retry?.time)
        ? config.retry.time
        : normalizeNumber(config?.retry?.time, controlConfig.retry.time),
      limit: normalizeNumber(config?.retry?.limit, controlConfig.retry.limit, false),
      consecutiveOnly: config?.retry?.consecutiveOnly ?? controlConfig.retry.consecutiveOnly,
    },
    pauseWhenHidden: config?.pauseWhenHidden ?? controlConfig.pauseWhenHidden,
  };
}
