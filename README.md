# RxJS Polling Operator

<a href="https://www.npmjs.com/package/rxjs-poll" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Version" src="https://img.shields.io/npm/v/rxjs-poll"></a>
<a href="https://bundlephobia.com/package/rxjs-poll@latest" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Bundle Size" src="https://img.shields.io/bundlephobia/minzip/rxjs-poll/latest?label=gzip"></a>
<a href="LICENSE" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub License" src="https://img.shields.io/github/license/mmustra/rxjs-poll"></a>
<a href="https://github.com/mmustra/rxjs-poll/tree/main/tests" target="_blank" rel="noopener noreferrer nofollow"><img alt="Codecov" src="https://img.shields.io/codecov/c/gh/mmustra/rxjs-poll?token=H9R97BLFQI"></a>
<a href="https://github.com/mmustra/rxjs-poll/issues?q=is%3Aissue%20state%3Aopen%20label%3Alatest" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Issues" src="https://img.shields.io/github/issues/mmustra/rxjs-poll/latest?label=issues"></a>
<a href="https://github.com/mmustra/rxjs-poll/commits/main" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Latest Commits" src="https://img.shields.io/github/last-commit/mmustra/rxjs-poll/main?label=activity"></a>

A flexible RxJS operator library that enables polling on any completed observable source with advanced timing and retry strategies.

## 🚀 Features

- **Two polling types**: `repeat` and `interval` to suit different use cases
- **Timing strategies**: `constant`, `linear`, `exponential`, `random` and `dynamic` (custom logic)
- **Pause controls**: `notifier` and/or `when hidden` (browser; in-flight emission guaranteed)
- **Flexible retries**: Limit attempts on either `consecutive` or `total` errors
- **Input validation**: Guards against unexpected input time values
- **Cross-platform**: Works in both browser and Node.js environments
- **Modern compatibility**: Compatible with RxJS v7+
- **Module formats**: Supports CJS, ESM, and UMD

## 📦 Installation

```shell
npm install rxjs-poll --save
```

## 🎯 Purpose & Process

Polling is essential when you need to repeatedly check for updates from sources that don't provide real-time notifications. Common scenarios include monitoring HTTP API endpoints for status changes, watching DOM elements for state updates, or periodically sampling data streams.

This operator polls by re-subscribing to your source observable after each completion, with intervals determined by the selected polling type. It distinguishes between normal polling delays and error retry scenarios, giving you precise control over both success and failure timing. Polling can be paused via an external notifier (direct emission control) or automatically when the browser tab becomes hidden (with first and in-flight emissions guaranteed).

## 🧪 Usage Examples

### Default Configuration

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-7wpqq8ix?devToolsHeight=50&file=index.ts)

Plug and play - just add the operator to your pipe and start polling.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll(), // Poll every second with exponential retry strategy (7s max)
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe({ next: console.log });
```

### Strategy-Based Configuration

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-mnlpyjya?devToolsHeight=50&file=index.ts)

Use built-in strategies for easy timing control.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      type: 'interval', // Drops uncompleted source after delay
      delay: {
        strategy: 'random',
        time: [1000, 3000], // Random delay between 1 and 3 seconds
      },
      retry: {
        limit: Infinity, // Will never throw
      },
    }),
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe({ next: console.log });
```

### Advanced Dynamic Strategies

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-guldaznr?devToolsHeight=50&file=index.ts)

Implement complex polling strategies with dynamic timing based on poll state.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      delay: {
        /* Adaptive polling based on response data */
        strategy: 'dynamic',
        time: ({ value }) => (value?.items.length ? 1000 : 500),
      },
      retry: {
        /* Custom exponential backoff with jitter */
        strategy: 'dynamic',
        time: ({ consecutiveRetryCount }) => {
          const exponential = Math.pow(2, consecutiveRetryCount - 1) * 1000;
          const jitter = Math.random() * 200;

          return exponential + jitter;
        },
        limit: 6,
      },
    }),
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe({ next: console.log });
```

### Pause With Notifier

Control polling from outside by passing an `Observable<boolean>` as `pause.notifier`: emit `true` to pause and `false` to resume. If the notifier never emits, polling starts (same as resume). To start paused, use an observable that emits `true` initially (e.g. `new BehaviorSubject(true)`). You can combine it with `whenHidden: true` so both your stream and tab visibility affect pausing. If the notifier observable errors, the error is caught: polling does not error or complete because of notifier failures, and the previous pause state is kept.

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-yn2ewfbm?devToolsHeight=50&file=index.ts)

```typescript
import { poll } from 'rxjs-poll';
import { fromEvent } from 'rxjs';
import { map, scan, startWith, takeWhile } from 'rxjs';

const click$ = fromEvent(document, 'click').pipe(
  scan((isPaused) => !isPaused, false)
);

request$
  .pipe(
    poll({
      pause: {
        notifier: click$,
        whenHidden: false, // set true (default) to also pause when tab hidden
      },
    }),
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe({ next: console.log });

// Now, click anywhere on the page to toggle pause/resume
```

## 📋 API Reference

### `poll(config?: PollConfig)`

Creates a polling operator that manages the source observable's subscription lifecycle.

#### PollConfig

```typescript
interface PollConfig {
  /**
   * Defines the polling behavior:
   * - 'repeat': Polls after current source completes
   * - 'interval': Polls in intervals, dropping any ongoing source operations
   * @default 'repeat'
   */
  type?: 'repeat' | 'interval';

  /**
   * Configuration for polling delays (between successful operations)
   */
  delay?: {
    /**
     * Strategy type for delay timing. Built-in strategies (except dynamic)
     * calculate time per state's `pollCount`.
     * @default 'constant'
     */
    strategy: 'constant' | 'linear' | 'exponential' | 'random' | 'dynamic';

    /**
     * Time (ms) depending on strategy:
     * - constant: number
     * - linear: number
     * - exponential: number
     * - random: [min, max]
     * - dynamic: (state) => number | [min, max]
     * @default 1000
     */
    time:
      | number
      | [min: number, max: number]
      | (state: PollState) => number | [min: number, max: number];
  };

  /**
   * Configuration for retry behavior (on errors)
   */
  retry?: {
    /**
     * Strategy type for retry timing. Built-in strategies (except dynamic)
     * calculate time per state:
     * - consecutiveOnly: true → uses `consecutiveRetryCount`
     * - consecutiveOnly: false → uses `retryCount`
     * @default 'exponential'
     * @note Required if `time` is provided, otherwise uses default
     */
    strategy: 'constant' | 'linear' | 'exponential' | 'random' | 'dynamic';

    /**
     * Time (ms) depending on strategy:
     * - constant: number
     * - linear: number
     * - exponential: number
     * - random: [min, max]
     * - dynamic: (state) => number | [min, max]
     * @default 1000
     * @note Required if `strategy` is provided, otherwise uses default
     */
    time:
      | number
      | [min: number, max: number]
      | (state: PollState) => number | [min: number, max: number];

    /**
     * Maximum number of retry attempts before throwing an error.
     * Use `Infinity` to keep retrying indefinitely.
     * @default 3
     */
    limit?: number;

    /**
     * Controls how retries are counted:
     * - true: Only consecutive errors count toward retry limit
     *   (resets counter on success)
     * - false: All errors count toward retry limit regardless of
     *   successful responses between them
     * @default true
     */
    consecutiveOnly?: boolean;
  };


  /**
   * Configuration for pause behavior
   */
  pause?: {
    /**
     * Observable that emits true to pause, false to resume
     * @default false
     * @note
     * - Interrupts polling/retrying cycles
     * - Can pause first emission
     * - Defaults to false if no initial emission
     * - Errors from this notifier are caught and do NOT error/complete polling
     */
    notifier?: Observable<boolean>;
    /**
     * [Browser only] When true, polling pauses if tab isn't visible
     * @default true
     * @note
     * - Polling/retrying cycles finish before pausing
     * - First emission guaranteed
     */
    whenHidden?: boolean;
  };
}
```

### PollState

State object passed to delay/retry time producer functions:

```typescript
interface PollState<T> {
  /** Latest value from the source. For `interval` polling type,
   * first emission is undefined. */
  value: T | undefined;

  /** Latest error when retrying */
  error: any | undefined;

  /** Total number of successful poll operations */
  pollCount: number;

  /** Total number of retry attempts */
  retryCount: number;

  /** Current number of consecutive retry attempts */
  consecutiveRetryCount: number;
}

/** Note: pollCount + retryCount = total attempts */
```

## 📚 Additional Resources

- **[V3 Changes](docs/V3_CHANGES.md)** - v2→v3 overview and migration steps
- **[V2 Changes](docs/V2_CHANGES.md)** - v1→v2 overview and migration steps
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

Have a question? Check out [GitHub Discussions](https://github.com/mmustra/rxjs-poll/discussions) to ask questions, share ideas, or get help from the community.

## 🙌 Credits

This library is inspired by [rx-polling](https://github.com/jiayihu/rx-polling), which creates an Observable for polling.

## 📄 License

[MIT](LICENSE)
