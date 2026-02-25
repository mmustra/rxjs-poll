import { of } from 'rxjs';

import { extendConfig } from '../../../src/common/config';
import * as utils from '../../../src/common/utils';
import { intervalPollerFactory } from '../../../src/poller/execution/interval-factory';
import { PollService } from '../../../src/poller/execution/poll-service';
import { getPauseMode } from '../../../src/poller/pause/get-pause-mode';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getPauseMode', () => {
  it("should return 'none' when (!inBrowser || !whenHidden) and default notifier", () => {
    const config = extendConfig<string>({ pause: { whenHidden: false } });
    const pollService = new PollService(config);
    const ctx = { source$: of('a'), pollService, factory: intervalPollerFactory };
    expect(getPauseMode(ctx)).toBe('none');
  });

  it("should return 'notifier' when (!inBrowser || !whenHidden) and custom notifier", () => {
    const config = extendConfig<string>({ pause: { notifier: of(true), whenHidden: false } });
    const pollService = new PollService(config);
    const ctx = { source$: of('a'), pollService, factory: intervalPollerFactory };
    expect(getPauseMode(ctx)).toBe('notifier');
  });

  it("should return 'hidden' when whenHidden and default notifier", () => {
    const config = extendConfig<string>({ pause: { whenHidden: true } });
    const pollService = new PollService(config);
    const ctx = { source$: of('a'), pollService, factory: intervalPollerFactory };
    expect(getPauseMode(ctx)).toBe('hidden');
  });

  it("should return 'both' when whenHidden and custom notifier", () => {
    const config = extendConfig<string>({ pause: { notifier: of(true), whenHidden: true } });
    const pollService = new PollService(config);
    const ctx = { source$: of('a'), pollService, factory: intervalPollerFactory };
    expect(getPauseMode(ctx)).toBe('both');
  });

  it("should return 'none' when !inBrowser and default notifier", () => {
    jest.spyOn(utils, 'isBrowser').mockReturnValue(false);
    const config = extendConfig<string>({ pause: { whenHidden: true } });
    const pollService = new PollService(config);
    const ctx = { source$: of('a'), pollService, factory: intervalPollerFactory };
    expect(getPauseMode(ctx)).toBe('none');
  });

  it("should return 'notifier' when !inBrowser and custom notifier", () => {
    jest.spyOn(utils, 'isBrowser').mockReturnValue(false);
    const config = extendConfig<string>({ pause: { notifier: of(true), whenHidden: true } });
    const pollService = new PollService(config);
    const ctx = { source$: of('a'), pollService, factory: intervalPollerFactory };
    expect(getPauseMode(ctx)).toBe('notifier');
  });
});
