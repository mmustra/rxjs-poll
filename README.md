# RxJS Polling Operator

<a href="https://www.npmjs.com/package/rxjs-poll" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Version" src="https://img.shields.io/npm/v/rxjs-poll"></a>
<a href="https://bundlephobia.com/package/rxjs-poll@latest" target="_blank" rel="noopener noreferrer nofollow"><img alt="NPM Bundle Size" src="https://img.shields.io/bundlephobia/minzip/rxjs-poll?label=gzip"></a>
<a href="https://github.com/mmustra/rxjs-poll/tree/main/tests" target="_blank" rel="noopener noreferrer nofollow"><img alt="Codecov" src="https://img.shields.io/codecov/c/gh/mmustra/rxjs-poll?token=H9R97BLFQI"></a>
<a href="https://github.com/mmustra/rxjs-poll/issues" target="_blank" rel="noopener noreferrer nofollow"><img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues/mmustra/rxjs-poll"></a>

Library provides RxJS operator that can do polling on any completed source.

**rxjs-poll** features:

- Two types of polling; `repeat` and `interval`
- Delay/retry can be a **static**, **random** or **dynamic** number
- Any **delay/backoff strategy** you can think of
- Background mode (browser only) to **pause/resume polling** on page visibility
- Consecutive rule for **different retry attempts** approach
- Config **input guard** for unexpected values
- Supports browser and node environment
- Compatible with RxJS v7+
- Provides cjs and esm

## Installation

```shell
npm install rxjs-poll --save
```

## Usage

Let's say that you want to poll fun facts about cats. This is the request:

```typescript
import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs';

interface CatFact {
  fact: string;
  length: number;
}

const request$ = ajax<CatFact>({ url: 'https://catfact.ninja/fact' }).pipe(
  map(({ response }) => response)
);
```

### Default

Plug and play, just add an operator to your pipe and poll.

[Demo](https://stackblitz.com/edit/rxjs-6nrm8l?devToolsHeight=100&file=index.ts)

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll(),
    takeWhile(({ length }) => length < 200, true)
  )
  .subscribe({ next: console.log });
```

### Basic

With a config file you can customize polling to your specific needs.

[Demo](https://stackblitz.com/edit/rxjs-obywba?devToolsHeight=100&file=index.ts)

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      type: 'interval', // Drops uncompleted source after delay
      retries: Infinity, // Will never throw
      delay: [1000, 2000], // Random delay with min and max values
    }),
    takeWhile(({ length }) => length < 200, true)
  )
  .subscribe({ next: console.log });
```

### Advance

Use delay function when you need unique delay or backoff strategies for polling/retrying.

[Demo](https://stackblitz.com/edit/rxjs-awthuj?devtoolsheight=100&file=index.ts)

```typescript
import { poll } from 'rxjs-poll';
import { takeWhile } from 'rxjs';

request$
  .pipe(
    poll({
      retries: 6,
      delay: ({ polls, consecutiveRetries, value, error }) => {
        const delay = 1000;

        if (error) {
          // Exponential backoff strategy
          // With 6 retries, throws after ~1min of consecutive errors
          return Math.pow(2, consecutiveRetries - 1) * delay;
        }

        // Faster polls for shorther facts
        return value.length < 100 ? delay * 0.3 : delay;
      },
    }),
    takeWhile(({ length }) => length < 200, true)
  )
  .subscribe({ next: console.log });
```

## API

### poll(config)

It is a mono type operator function that will poll once a **source completes**. If the source is not completed, the operator will wait until that happens. First emission is sent immediately, then the polling will start. Values will emit until stopped by the user.

```typescript
source$.pipe(poll({ type: 'repeat', retries: 10 }));
```

### PollConfig

Configuration object used to setup polling mechanism. Any non-assigned, negative or invalid values will be replaced with default configuration values.

```typescript
interface PollConfig {
  /**
   * Poller type
   *
   * repeat - polls after current source completes
   * interval - polls in intervals and drops source that is not complete
   */
  type: 'repeat' | 'interval';

  /**
   * Delay between polls and retries
   *
   * Use static or random number with min and max values. If you need
   * dynamic number, use function and return either static or random number.
   * Numbers should be positive and finate.
   */
  delay:
    | number
    | [number | number]
    | ((state: PollState) => number | [number | number]);

  /**
   * Number of retries
   *
   * Number of retries before it will throw. Number should be positive, but
   * it can be Infinity if you don't care about errors.
   */
  retries: number;

  /**
   * Retry's counting approach
   *
   * If true, then only consecutive error count will be checked against
   * retires. Consecutive error count is reset to 0 on successful response.
   * If false, then any number of errors will be checked against retires.
   */
  isConsecutiveRule: boolean;

  /**
   * Pause/resume polling - browser only
   *
   * Polling can be paused/resumed depending on page visibility.
   * ex. If this is false and you switch to another tab, polling is paused.
   * Once you go back, polling resumes.
   */
  isBackgroundMode: boolan;
}
```

#### Defaults

```typescript
const config: PollConfig = {
  type: 'repeat',
  delay: 1000,
  retries: 3,
  isConsecutiveRule: true,
  isBackgroundMode: false,
};
```

### PollState

Provided as argument of delay function. Use it to set delay for polls and retries.

```typescript
interface PollState<T> {
  polls: number; // current count of successful polls
  retries: number; // current count of retries
  consecutiveRetries: number; // current count of consecutive retries
  value: T; // value emitted from the source
  error: any | null; // "any" when retrying and "null" when polling
}

// polls + retries = total attempts
```

## Credits

This library is inspired by the [rx-polling](https://github.com/jiayihu/rx-polling) that creates Observable for polling.

## License

[MIT](LICENSE)
