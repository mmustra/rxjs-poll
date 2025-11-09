# Changes in v2

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
