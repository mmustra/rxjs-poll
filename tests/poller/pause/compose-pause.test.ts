import { of, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { extendConfig } from '../../../src/common/config';
import { intervalPollerFactory } from '../../../src/poller/execution/interval-factory';
import { PollService } from '../../../src/poller/execution/poll-service';
import { composePause$ } from '../../../src/poller/pause/compose-pause';
import { createTestScheduler } from '../../_helpers/test-scheduler';
import { actualGetPauseMode, getPauseMode as getPauseModeMock } from '../../_mocks/get-pause-mode.mock';

jest.mock('../../../src/poller/pause/get-pause-mode', () => require('../../_mocks/get-pause-mode.mock'));

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = createTestScheduler();
  getPauseModeMock.mockImplementation(actualGetPauseMode);
});

describe('composePause$', () => {
  it("should use direct poller when pause mode is 'none'", () => {
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { whenHidden: false },
    });
    const pollService = new PollService(config);

    const values: string[] = [];
    testScheduler.run(({ cold }) => {
      const ctxConfig = { source$: cold('(a|)', { a: 'a' }), pollService, factory: intervalPollerFactory };
      composePause$(ctxConfig)
        .poller$.pipe(take(2))
        .subscribe((v) => values.push(v));
    });
    expect(values).toEqual(['a', 'a']);
  });

  it("should keep existing poller$ when pause mode is 'none' and ctx.poller$ is already set", () => {
    getPauseModeMock.mockReturnValue('none');
    const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });
    const pollService = new PollService(config);
    const existingPoller$ = of('existing');
    const ctxConfig = {
      source$: of('a'),
      pollService,
      factory: intervalPollerFactory,
      poller$: existingPoller$,
    };
    const result = composePause$(ctxConfig);
    expect(result.poller$).toBe(existingPoller$);
  });

  it("should wrap with notifier when pause mode is 'notifier'", () => {
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { notifier: of(false), whenHidden: false },
    });
    const pollService = new PollService(config);

    const values: string[] = [];
    testScheduler.run(({ cold }) => {
      const ctxConfig = { source$: cold('(a|)', { a: 'a' }), pollService, factory: intervalPollerFactory };
      composePause$(ctxConfig)
        .poller$.pipe(take(2))
        .subscribe((v) => values.push(v));
    });
    expect(values).toEqual(['a', 'a']);
  });

  it("should use existing poller$ when pause mode is 'notifier' and ctx.poller$ is already set", () => {
    getPauseModeMock.mockReturnValue('notifier');
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { notifier: of(false) },
    });
    const pollService = new PollService(config);
    const existingPoller$ = of('existing');
    const ctxConfig = {
      source$: of('a'),
      pollService,
      factory: intervalPollerFactory,
      poller$: existingPoller$,
    };
    const result = composePause$(ctxConfig);
    expect(result.poller$).toBeDefined();
    expect(result.poller$).not.toBe(existingPoller$); // wrapped with notifier
  });

  it("should use cycle poller with hidden pause when pause mode is 'hidden'", () => {
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { whenHidden: true },
    });
    const pollService = new PollService(config);
    const ctxConfig = { source$: of('a'), pollService, factory: intervalPollerFactory };

    const { poller$, cycler$ } = composePause$(ctxConfig);
    expect(poller$).toBeDefined();
    expect(cycler$).toBeDefined();
  });

  it("should use existing poller$ and cycler$ when pause mode is 'hidden' and both are pre-set on ctx", () => {
    getPauseModeMock.mockReturnValue('hidden');
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { whenHidden: true },
    });
    const pollService = new PollService(config);
    const existingPoller$ = of('existing');
    const existingCycler$ = of(0 as const);
    const ctxConfig = {
      source$: of('a'),
      pollService,
      factory: intervalPollerFactory,
      poller$: existingPoller$,
      cycler$: existingCycler$,
    };
    const result = composePause$(ctxConfig);
    expect(result.poller$).toBeDefined();
    expect(result.cycler$).toBe(existingCycler$);
  });

  it("should use ctx.poller$ and control.cycler$ when pause mode is 'hidden' and only poller$ is pre-set", () => {
    getPauseModeMock.mockReturnValue('hidden');
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { whenHidden: true },
    });
    const pollService = new PollService(config);
    const existingPoller$ = of('existing');
    const ctxConfig = {
      source$: of('a'),
      pollService,
      factory: intervalPollerFactory,
      poller$: existingPoller$,
    };
    const result = composePause$(ctxConfig);
    expect(result.poller$).toBeDefined();
    expect(result.cycler$).toBeDefined();
  });

  it("should use control.poller$ and ctx.cycler$ when pause mode is 'hidden' and only cycler$ is pre-set", () => {
    getPauseModeMock.mockReturnValue('hidden');
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { whenHidden: true },
    });
    const pollService = new PollService(config);
    const existingCycler$ = of(0 as const);
    const ctxConfig = {
      source$: of('a'),
      pollService,
      factory: intervalPollerFactory,
      cycler$: existingCycler$,
    };
    const result = composePause$(ctxConfig);
    expect(result.poller$).toBeDefined();
    expect(result.cycler$).toBe(existingCycler$);
  });

  it("should use cycle poller with notifier and hidden when pause mode is 'both'", () => {
    const config = extendConfig<string>({
      type: 'interval',
      delay: { strategy: 'constant', time: 10 },
      pause: { notifier: of(false), whenHidden: true },
    });
    const pollService = new PollService(config);
    const ctxConfig = { source$: of('a'), pollService, factory: intervalPollerFactory };

    const { poller$, cycler$ } = composePause$(ctxConfig);
    expect(poller$).toBeDefined();
    expect(cycler$).toBeDefined();
  });

  it('should throw when getPauseMode returns an unsupported pause mode', () => {
    getPauseModeMock.mockReturnValue('invalid' as ReturnType<typeof actualGetPauseMode>);
    const config = extendConfig<string>({ type: 'interval', delay: { strategy: 'constant', time: 10 } });
    const pollService = new PollService(config);
    const ctxConfig = { source$: of('a'), pollService, factory: intervalPollerFactory };

    expect(() => composePause$(ctxConfig)).toThrow('composePause$: Unsupported pause mode "invalid"!');
  });
});
