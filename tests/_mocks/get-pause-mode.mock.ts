const actual = jest.requireActual('../../src/poller/pause/get-pause-mode');

export const actualGetPauseMode = actual.getPauseMode;
export const getPauseMode = jest.fn(actual.getPauseMode);
