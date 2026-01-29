# V2 Changes

**Version 2** ([source](https://github.com/mmustra/rxjs-poll)) introduces an API focused on strategy-based configuration with improved type safety and clearer separation between polling delays and retry behavior.

**Version 1** ([source](https://github.com/mmustra/rxjs-poll/tree/v1)) will continue to receive bug fixes and security updates.

## Behavioral Improvements

### Enhanced Pause Handling

When `pauseWhenHidden` is enabled (default in v2), polling cycles (poll or retry) that have already started will complete before pausing occurs. This ensures operations are never interrupted mid-execution when tab visibility changes.

**Example**:

```typescript
// If your source observable takes 5 seconds to complete
// and the tab becomes hidden at 3 seconds:
request$.pipe(poll({ pauseWhenHidden: true })).subscribe(console.log);

// v1: Operation is interrupted at 3 seconds
// v2: Operation completes after 5 seconds, then pausing occurs
```

### Guaranteed First Emission

First emission is now guaranteed even when:

- The tab starts in a hidden state
- Tab visibility changes during polling

This provides more predictable behavior for applications that start or run in background tabs.

**Example**:

```typescript
// Tab is hidden when polling starts
request$.pipe(poll({ pauseWhenHidden: true })).subscribe(console.log);

// v1: Waits for tab to become visible before first poll
// v2: First poll executes immediately, subsequent polls respect visibility
```

## API Changes

### PollConfig

- **delay/retry**: Added configuration objects for polling and retry
- **retries**: Renamed and moved to `retry.limit`
- **isConsecutiveRule**: Renamed and moved to `retry.consecutiveOnly`
- **isBackgroundMode**: Renamed to `pauseWhenHidden` and default behavior inverted (`false` → `true`)

### PollState

- **polls**: Renamed to `pollCount`
- **retries**: Renamed to `retryCount`
- **consecutiveRetries**: Renamed to `consecutiveRetryCount`
- **value**: Changed to type `T | undefined`
- **error**: Changed to type `any | undefined`

## Migration Examples

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
