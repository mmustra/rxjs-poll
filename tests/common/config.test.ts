import { controlConfig, ControlPollConfig, normalizeConfig, PollConfig, PollState } from '../../src/common/config';
import { Nil, sampleNumber } from '../../src/common/utils';

beforeEach(() => {
  jest.clearAllMocks();
});

jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

describe('Config', () => {
  it('Should handle empty inputs', () => {
    expect(mapToControl()).toEqual(controlConfig);

    expect(mapToControl({})).toEqual(controlConfig);

    expect(mapToControl(null)).toEqual(controlConfig);
  });

  it('Should fallback to defaults when partial input', () => {
    expect(mapToControl({ delay: null })).toEqual({
      ...controlConfig,
    });

    expect(mapToControl({ delay: 5000 })).toEqual({
      ...controlConfig,
      delay: 5000,
    });

    expect(mapToControl({ delay: [500, 2000] })).toEqual({
      ...controlConfig,
      delay: sampleNumber([500, 2000]),
    });

    expect(mapToControl({ delay: [undefined, null] })).toEqual({
      ...controlConfig,
      delay: sampleNumber([controlConfig.delay, controlConfig.delay]),
    });

    expect(mapToControl({ delay: () => 3000 })).toEqual({
      ...controlConfig,
      delay: 3000,
    });

    expect(mapToControl({ delay: () => null })).toEqual({
      ...controlConfig,
      delay: 1000,
    });

    expect(mapToControl({ retries: 0 })).toEqual({
      ...controlConfig,
      retries: 0,
    });

    expect(mapToControl({ type: null, delay: null, retries: null, isBackgroundMode: null })).toEqual({
      ...controlConfig,
    });
  });

  it('Should fallback to defaults when delay is infinity', () => {
    expect(mapToControl({ delay: Infinity })).toEqual(controlConfig);

    expect(mapToControl({ delay: [0, Infinity] })).toEqual({
      ...controlConfig,
      delay: sampleNumber([0, controlConfig.delay]),
    });

    expect(mapToControl({ delay: () => sampleNumber([1000, 3000]) })).toEqual({
      ...controlConfig,
      delay: sampleNumber([1000, 3000]),
    });
  });

  it('Should fallback to defaults when NaN', () => {
    expect(mapToControl({ delay: NaN, retries: NaN })).toEqual(controlConfig);

    expect(mapToControl({ delay: [NaN, NaN] })).toEqual({
      ...controlConfig,
      delay: sampleNumber([controlConfig.delay, controlConfig.delay]),
    });
  });

  it('Should guarantee absolute numbers', () => {
    expect(mapToControl({ delay: -2500, retries: -10 })).toEqual({
      ...controlConfig,
      delay: 2500,
      retries: 10,
    });

    expect(mapToControl({ delay: [-500, -2000] })).toEqual({
      ...controlConfig,
      delay: sampleNumber([500, 2000]),
    });

    expect(mapToControl({ retries: -Infinity })).toEqual({
      ...controlConfig,
      retries: Infinity,
    });
  });

  it('Should not mutate counters of PollState', () => {
    const state: PollState = { ...controlState };

    const { getDelay } = normalizeConfig({
      delay(state) {
        state.polls = 1;
        state.retries = 1;
        state.consecutiveRetries = 1;

        return null;
      },
    });

    getDelay(state);

    expect(state).toEqual(controlState);
  });
});

function mapToControl(config?: PollConfig | Nil): ControlPollConfig {
  const { getDelay, ...others } = normalizeConfig(config);

  return {
    ...others,
    delay: getDelay(controlState),
  };
}

const controlState: PollState = {
  polls: 0,
  retries: 0,
  consecutiveRetries: 0,
  error: null,
};
