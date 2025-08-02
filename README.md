# RxJS Polling Operator

<a href="https://www.npmjs.com/package/rxjs-poll" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Version" src="https://img.shields.io/npm/v/rxjs-poll"></a>
<a href="https://bundlephobia.com/package/rxjs-poll@latest" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Bundle Size" src="https://img.shields.io/bundlephobia/minzip/rxjs-poll/latest?label=gzip"></a>
<a href="https://github.com/mmustra/rxjs-poll/tree/main/tests" target="_blank" rel="noopener noreferrer nofollow"><img alt="Codecov" src="https://img.shields.io/codecov/c/gh/mmustra/rxjs-poll?token=H9R97BLFQI"></a>
<a href="https://github.com/mmustra/rxjs-poll/issues?q=is%3Aissue%20state%3Aopen%20label%3Alatest" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Issues" src="https://img.shields.io/github/issues/mmustra/rxjs-poll/latest?label=issues"></a>
<a href="https://github.com/mmustra/rxjs-poll/commits/main" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Latest Commits" src="https://img.shields.io/github/last-commit/mmustra/rxjs-poll/main?label=activity"></a>

A flexible RxJS operator library that enables polling on any completed observable source with advanced timing and retry strategies.

## 🚀 Features

- **Two polling modes**: `repeat` and `interval` to suit different use cases
- **Timing strategies**: `constant`, `linear`, `exponential`, `random` and `dynamic` (custom logic)
- **Auto-pause**: Automatically pause/resume polling based on page visibility (browser only)
- **Flexible retries**: Control retry attempts with consecutive or total counting modes
- **Input validation**: Guards against unexpected input time values
- **Cross-platform**: Works in both browser and Node.js environments
- **Modern compatibility**: Compatible with RxJS v7+
- **Multiple module formats**: Supports CommonJS (CJS) and ES Modules (ESM)

## 📦 Installation

```shell
npm install rxjs-poll --save
```

## 🎯 Purpose & Process

Polling is essential when you need to repeatedly check for updates from sources that don't provide real-time notifications. Common scenarios include monitoring HTTP API endpoints for status changes, watching DOM elements for state updates, or periodically sampling data streams.

This operator cleanly separates polling concerns from your core observable logic. It waits for your source observable to complete per polling type, then schedules the next poll based on your configuration. The architecture distinguishes between normal polling delays and error retry scenarios, giving you precise control over both success and failure timing strategies.

## 📚 Usage Examples

### Default Configuration

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-xdf2x4vx?devToolsHeight=100&file=index.ts)

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

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-vrefdzj1?devToolsHeight=100&file=index.ts)

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

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-6fmgfij8?devtoolsheight=100&file=index.ts)

Implement complex polling strategies with dynamic timing based on poll state.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      delay: {
        /** Adaptive polling based on response data */
        strategy: 'dynamic',
        time: ({ value }) => (value?.items.length ? 1000 : 500),
      },
      retry: {
        /** Custom exponential backoff with jitter */
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

## 📋 API Reference

### `poll(config?: PollConfig)`

Creates a polling operator that will begin polling once the source observable completes.

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
    strategy: 'constant' | 'random' | 'dynamic';

    /**
     * Time (ms) depending on strategy:
     * - constant: number
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
   * [Browser only] Controls polling behavior when page isn't visible
   * - true: Pause polling when tab isn't active, and resume on active
   * - false: Poll even when tab isn't focused
   * @default true
   */
  pauseWhenHidden?: boolean;
}
```

### PollState

State object passed to delay/retry time producer functions:

```typescript
interface PollState<T> {
  /** Latest value from the source. For `interval` polling mode,
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

## 🚨 Breaking Changes

**Version 2** ([source](https://github.com/mmustra/rxjs-poll)) introduces an API focused on strategy-based configuration. The new architecture separates concerns between normal polling behavior and error handling scenarios, with type safety and clear configuration intent. This makes it easier to choose timings from common patterns.

**Version 1** ([source](https://github.com/mmustra/rxjs-poll/tree/v1)) will continue to receive bug fixes and security updates.

### Changes in v2

#### PollConfig

- **delay/retry**: Added configuration objects for polling and retry
- **retries**: Renamed and moved to `retry.limit`
- **isConsecutiveRule**: Renamed and moved to `retry.consecutiveOnly`
- **isBackgroundMode**: Renamed to `pauseWhenHidden` and default behavior inverted (`false` → `true`)

#### PollState

- **polls**: Renamed to `pollCount`
- **retries**: Renamed to `retryCount`
- **consecutiveRetries**: Renamed to `consecutiveRetryCount`
- **value**: Changed to type `T | undefined`
- **error**: Changed to type `any | undefined`

### Migration Examples

### Basic

**Before (v1.x)**

```typescript
poll({
  type: 'interval',
  delay: 2000, // Same timing for delay and retry
  retries: 5,
  isConsecutiveRule: false,
});
```

**After (v2.x)**

```typescript
poll({
  type: 'interval',
  delay: {
    strategy: 'constant',
    time: 2000,
  },
  retry: {
    strategy: 'constant',
    time: 2000,
    limit: 5,
    consecutiveOnly: false,
  },
});
```

or if you only care about delay timing:

```typescript
poll({
  type: 'interval',
  delay: {
    strategy: 'constant',
    time: 2000,
  },
  retry: {
    limit: 5,
    consecutiveOnly: false,
  },
});
```

### Dynamic

**Before (v1.x)**

```typescript
poll({
  /** `error` used as a flag to determine delay/retry timing */
  delay: ({ error, consecutiveRetries }) =>
    error ? consecutiveRetries * 1000 : 2000,
});
```

**After (v2.x)**

```typescript
poll({
  delay: {
    strategy: 'constant',
    time: 2000,
  },
  retry: {
    strategy: 'dynamic',
    time: ({ consecutiveRetryCount }) => consecutiveRetryCount * 1000,
  },
});
```

or with built-in strategy:

```typescript
poll({
  delay: {
    strategy: 'constant',
    time: 2000,
  },
  retry: {
    strategy: 'linear',
    time: 1000,
  },
});
```

## 🙌 Credits

This library is inspired by [rx-polling](https://github.com/jiayihu/rx-polling), which creates an Observable for polling.

## 📄 License

[MIT](LICENSE)
