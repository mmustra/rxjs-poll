# 🔧 Troubleshooting Guide

Common issues and solutions when using `rxjs-poll`.

## Table of Contents

- [Polling Issues](#polling-issues)
- [Retry Issues](#retry-issues)
- [Browser-Specific Issues](#browser-specific-issues)
- [Performance Issues](#performance-issues)
- [TypeScript Issues](#typescript-issues)

## Polling Issues

### Polling Never Starts

**Problem — Source observable never completes**

```typescript
// ❌ BAD: interval() never completes naturally
interval(1000).pipe(poll()).subscribe();
```

**Solution:** The source observable MUST complete for polling to work. Use operators like `take()`, `takeWhile()`, or `first()`:

```typescript
// ✅ GOOD: Source completes after 1 emission
interval(1000).pipe(take(1), poll()).subscribe();
```

### Polling Stops Early

**Problem — takeWhile condition is too strict**

```typescript
// ❌ BAD: Stops on first success, doesn't include it
request$
  .pipe(
    poll(),
    takeWhile(({ status }) => status !== 'done')
  )
  .subscribe();
```

**Solution:** Use the `inclusive` parameter:

```typescript
// ✅ GOOD: Includes the final value
request$
  .pipe(
    poll(),
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe();
```

### Notifier Errors and Polling

**Question — Will notifier errors stop polling?**

No. If you use `pause.notifier`, errors from that observable are caught internally. Polling will **not** error or complete because of notifier failures; the previous pause state is kept. If you need to react to notifier errors, handle them before passing the observable to `pause.notifier` (e.g. with `catchError`).

### Polling Happens Too Fast/Slow

**Problem — Using interval type with slow sources**

```typescript
// With interval type, if source takes 5s but delay is 1s,
// you'll get interruptions
slowRequest$.pipe(poll({ type: 'interval', delay: { time: 1000 } }));
```

**Solution:** Understand the difference:

- `type: 'repeat'` - waits for source to complete, THEN delays
- `type: 'interval'` - fires at fixed intervals, may interrupt source

```typescript
// ✅ Use 'repeat' for slow or variable-duration sources
slowRequest$.pipe(poll({ type: 'repeat', delay: { time: 1000 } }));

// ✅ Use 'interval' when exact timing is critical, e.g., for periodic sampling
// Ensures emissions at fixed intervals regardless of source speed
fastRequest$.pipe(poll({ type: 'interval', delay: { time: 5000 } }));
```

## Retry Issues

### Retry Takes Long Time

**Problem — Exponential backoff grows too large**

```typescript
// With a large base time, exponential backoff grows rapidly
// Delays for three retries: 1m, 2m, 4m
request$.pipe(poll({ retry: { strategy: 'exponential', time: 60000 } }));
```

**Solution:** Use a smaller base time or switch strategies:

```typescript
// ✅ Smaller base time
// Delays for three retries: 0.5s, 1s, 2s
poll({ retry: { strategy: 'exponential', time: 500 } });

// ✅ Use random with max cap
// For 3 retries picks a random time between 1s and 5s
poll({ retry: { strategy: 'random', time: [1000, 5000] } });

// ✅ Use dynamic with custom logic
// Infinite cycle: 1s, 2s, 3s, 4s, 5s, 1s, 2s, 3s...
poll({
  retry: {
    strategy: 'dynamic',
    time: (state) => ((state.retryCount % 5) + 1) * 1000,
    limit: Infinity,
  },
});
```

### "Retry limit exceeded" Error

**Problem 1 — Using `consecutiveOnly: false` with scattered errors**

```typescript
// ❌ Counts ALL retries, even if some polls succeed
poll({ retry: { limit: 3, consecutiveOnly: false } });
// Attempt 1: ❌ error
// Attempt 2: ✅ success
// Attempt 3: ❌ error
// Attempt 4: ❌ error
// Attempt 5: ❌ error → THROWS (total 4 retries > limit 3)
```

**Solution:** Use `consecutiveOnly: true` (default):

```typescript
// ✅ Only counts consecutive retries
poll({ retry: { limit: 3, consecutiveOnly: true } });
// Attempt 1: ❌ error (consecutive: 1)
// Attempt 2: ✅ success (consecutive: 0 - reset!)
// Attempt 3: ❌ error (consecutive: 1)
// Attempt 4: ✅ success (consecutive: 0 - reset!)
// Attempt 5: ❌ error (consecutive: 1)
// Attempt 6: ❌ error (consecutive: 2)
// Attempt 7: ❌ error (consecutive: 3)
// Attempt 8: ❌ error → THROWS (consecutive: 4 → exceeds limit 3)
```

**Problem 2 — Retry limit is too low**

**Solution:** Adjust limit based on expected failure rate:

```typescript
// ✅ For flaky APIs
poll({ retry: { limit: 10 } });

// ✅ For critical operations that must succeed
poll({ retry: { limit: Infinity } });
```

### Retries Don't Reset After Success

**Problem — After a successful poll, the next error immediately throws.**

**Cause:** Using `consecutiveOnly: false`

**Solution:**

```typescript
// ✅ Use default consecutiveOnly: true
poll({ retry: { limit: 3 } }); // consecutiveOnly defaults to true
```

## Browser-Specific Issues

### Want to Start Paused?

**Problem — Polling starts immediately but you want to wait until the user (or another signal) resumes**

If you pass an `Observable<boolean>` as `pause.notifier` that never emits, polling starts (same as resume). This is by design so that "no signal" does not block polling.

**Solution:** Use an observable that emits `true` initially, then emit `false` when you want to start polling:

```typescript
import { BehaviorSubject } from 'rxjs';
import { takeWhile } from 'rxjs';
import { poll } from 'rxjs-poll';

const pause$ = new BehaviorSubject(true); // start paused

request$
  .pipe(
    poll({
      pause: {
        notifier: pause$,
        whenHidden: false,
      },
    }),
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe(console.log);

// Later: start polling
pause$.next(false);
```

### Polling Continues When Tab is Hidden

**Problem 1 — pause.whenHidden is disabled**

```typescript
// ❌ Polling continues in background
poll({ pause: { whenHidden: false } });
```

**Solution:**

```typescript
// ✅ Enable pause when hidden (default)
poll({ pause: { whenHidden: true } }); // or just poll()
```

**Problem 2 — Running in Node.js environment**

**Explanation:** `pause.whenHidden` only works in browser environments (requires `document.hidden` API).

## Performance Issues

### Memory Leak / Subscription Not Cleaned Up

**Problem — Memory grows over time, subscriptions aren't cleaned up**

**Solution:** Always unsubscribe or use operators that complete

```typescript
// ❌ BAD: Never completes, subscription lives forever
request$.pipe(poll({ retry: { limit: Infinity } })).subscribe();

// ✅ GOOD: Use takeWhile to complete
const subscription = request$
  .pipe(
    poll({ retry: { limit: Infinity } }),
    takeWhile(({ done }) => !done, true)
  )
  .subscribe();

// ✅ GOOD: Use takeUntil with cleanup trigger
const destroy$ = new Subject<void>();

request$.pipe(poll(), takeUntil(destroy$)).subscribe();

// Later: cleanup
destroy$.next();
destroy$.complete();

// ✅ GOOD: Store and unsubscribe
const subscription = request$.pipe(poll()).subscribe();
// Later: cleanup
subscription.unsubscribe();
```

### Too Many Network Requests

**Problem — Multiple subscriptions to the same observable**

```typescript
// ❌ BAD: Creates new polling instance per subscription
const polled$ = request$.pipe(poll());

polled$.subscribe(); // Starts polling #1
polled$.subscribe(); // Starts polling #2
```

**Solution:** Use `share()` or `shareReplay()`:

```typescript
// ✅ GOOD: Shares single polling instance
const polled$ = request$.pipe(poll(), shareReplay(1));

polled$.subscribe(); // Starts polling
polled$.subscribe(); // Reuses existing polling
```

## TypeScript Issues

### Type Mismatch for Generic Value

**Problem — TypeScript can't infer the type of `value` in poll state**

```typescript
interface MyData {
  id: number;
  status: string;
}

poll({
  delay: {
    strategy: 'dynamic',
    time: (state) => {
      // ❌ state.value is unknown
      return state.value?.status === 'fast' ? 1000 : 5000;
    },
  },
});
```

**Solution:** Add explicit type parameter:

```typescript
// ✅ GOOD: Explicit generic type
poll<MyData>({
  delay: {
    strategy: 'dynamic',
    time: (state) => {
      // ✅ state.value is MyData | undefined
      return state.value?.status === 'fast' ? 1000 : 5000;
    },
  },
});
```

## Need More Help?

If you're experiencing issues not covered here:

1. Check the [README](../README.md) for basic usage
2. Review the [V2](./V2_CHANGES.md) or [V3](./V3_CHANGES.md) Changes if upgrading
3. [Open an issue](https://github.com/mmustra/rxjs-poll/issues) on GitHub
