# RxJS Polling Operator

<a href="https://www.npmjs.com/package/rxjs-poll/v/v1-lts" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Version" src="https://img.shields.io/npm/v/rxjs-poll/v1-lts?label=npm@v1"></a>
<a href="https://bundlephobia.com/package/rxjs-poll@1" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Bundle Size" src="https://img.shields.io/bundlephobia/minzip/rxjs-poll/1?label=gzip@v1"></a>
<a href="https://github.com/mmustra/rxjs-poll/tree/v1/tests" target="_blank" rel="noopener noreferrer nofollow"><img alt="Codecov" src="https://img.shields.io/codecov/c/gh/mmustra/rxjs-poll/v1?label=coverage@v1&token=H9R97BLFQI"></a>
<a href="https://github.com/mmustra/rxjs-poll/issues?q=is%3Aissue%20state%3Aopen%20label%3Av1" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Issues" src="https://img.shields.io/github/issues/mmustra/rxjs-poll/v1?label=issues@v1"></a>
<a href="https://github.com/mmustra/rxjs-poll/commits/v1" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Latest Commits" src="https://img.shields.io/github/last-commit/mmustra/rxjs-poll/v1?label=activity@v1"></a>

A flexible RxJS operator library that enables polling on any completed observable source with advanced configuration options.

## 🌟 Features

- **Two polling modes**: `repeat` and `interval` to suit different use cases
- **Flexible delay configuration**: Use static, random, or dynamic delay values
- **Custom backoff strategies**: Implement any delay/backoff logic you need
- **Background mode**: Automatically pause/resume polling based on page visibility (browser only)
- **Consecutive error handling**: Configure how retry attempts are managed
- **Input validation**: Guards against unexpected configuration values
- **Cross-platform**: Works in both browser and Node.js environments
- **Modern compatibility**: Compatible with RxJS v7+
- **Multiple module formats**: Supports CommonJS (CJS) and ES Modules (ESM)

## 📦 Installation

```shell
npm install rxjs-poll --save
```

## 🔄 How It Works

Operator waits for source to complete, before polling can begin according to your configuration. Depending on the type: `repeat` mode waits for source to complete before polling again, while `interval` mode polls at fixed intervals, canceling ongoing operations. Error handling respects retry settings and consecutive rules.

## 📚 Usage Examples

### Default Configuration

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-6nrm8l?devToolsHeight=100&file=index.ts)

Plug and play - just add the operator to your pipe and start polling.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll(), // Use default settings
    takeWhile(({ length }) => length < 200, true)
  )
  .subscribe({ next: console.log });
```

### Custom Configuration

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-obywba?devToolsHeight=100&file=index.ts)

Customize polling behavior with a configuration object.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      type: 'interval', // Drops uncompleted source after delay
      retries: Infinity, // Will never throw
      delay: [1000, 2000], // Random delay between 1 and 2 seconds
    }),
    takeWhile(({ length }) => length < 200, true)
  )
  .subscribe({ next: console.log });
```

### Advanced Strategies

[▶️ Live Demo](https://stackblitz.com/edit/rxjs-awthuj?devtoolsheight=100&file=index.ts)

Implement complex polling strategies with dynamic delay functions.

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      retries: 6,
      delay: ({ value, error, consecutiveRetries }) => {
        const baseDelay = 1000;

        if (error) {
          // Exponential backoff strategy
          // With 6 retries, throws after ~1min of consecutive errors
          return Math.pow(2, consecutiveRetries - 1) * baseDelay;
        }

        // Adaptive polling based on response data
        return value.length < 100 ? baseDelay * 0.3 : baseDelay;
      },
    }),
    takeWhile(({ length }) => length < 200, true)
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
   * Delay between polls and retries in milliseconds
   *
   * Can be:
   * - A static number (e.g., 1000 for 1 second)
   * - An array with [min, max] for random delay
   * - A function returning either of the above based on state
   * @default 1000
   */
  delay?:
    | number
    | [number, number]
    | ((state: PollState) => number | [number, number]);

  /**
   * Maximum number of retry attempts before throwing an error
   * Use Infinity to keep retrying indefinitely
   * @default 3
   */
  retries?: number;

  /**
   * Controls how retries are counted:
   * - true: Only consecutive errors count toward retry limit
   *   (resets counter on success)
   * - false: All errors count toward retry limit regardless of
   *   successful responses between them
   * @default true
   */
  isConsecutiveRule?: boolean;

  /**
   * [Browser only] Controls polling behavior when page isn't visible
   * - true: Continue polling when tab/window isn't focused
   * - false: Pause polling when tab/window loses focus, resume when focus returns
   * @default false
   */
  isBackgroundMode?: boolean;
}
```

### PollState

State object passed to dynamic delay functions:

```typescript
interface PollState<T> {
  /** Number of successful poll operations */
  polls: number;

  /** Total number of retry attempts */
  retries: number;

  /** Number of consecutive retry attempts without success */
  consecutiveRetries: number;

  /** Latest value emitted from the source */
  value: T;

  /** Error object when retrying, null during normal polling */
  error: any | null;
}

// Note: polls + retries = total attempts
```

## 🙌 Credits

This library is inspired by [rx-polling](https://github.com/jiayihu/rx-polling), which creates an Observable for polling.

## 📄 License

[MIT](LICENSE)
