# V3 Changes

**Version 3** is the current major release ([source](https://github.com/mmustra/rxjs-poll)). It introduces a refactored pause implementation, a dedicated pause config object with `notifier` for pausing at will, and removes internal modules. If you are on v2, see [V2 Changes](./V2_CHANGES.md) for the v1→v2 migration; below is what changes from v2 to v3.

**Version 2** ([source](https://github.com/mmustra/rxjs-poll/tree/v2)) will continue to receive bug fixes and security updates.

## Behavioral Improvements

### Pause at will with `notifier`

You can pause and resume polling at any time by providing `pause.notifier`: an `Observable<boolean>` that emits `true` to pause and `false` to resume. When combined with `pause.whenHidden`, custom pause and visibility-based pause are merged so either can pause polling.

**Example**:

```typescript
import { poll } from 'rxjs-poll';
import { Subject } from 'rxjs';

const pauseAtWill$ = new Subject<boolean>();

request$
  .pipe(
    poll({
      pause: {
        notifier: pauseAtWill$,
        whenHidden: true, // also pause when tab is hidden
      },
    }),
    takeWhile(({ status }) => status !== 'done', true)
  )
  .subscribe(console.log);

// Later: pause polling
pauseAtWill$.next(true);
// Resume
pauseAtWill$.next(false);
```

### Refactored pause implementation

Pause handling (including document visibility and cycle completion) has been moved into a dedicated pausers layer. When using document visibility (whenHidden), behavior is unchanged: in-flight cycles still complete before pausing, and the first emission is still guaranteed when the tab starts hidden.

## API Changes

### PollConfig

- **pause**: In v2, visibility-based pausing was configured with top-level `pauseWhenHidden`. In v3, pause is under a single object: `pause: { notifier, whenHidden }`. `notifier` is an `Observable<boolean>` to pause at will (emit `true` to pause, `false` to resume); `whenHidden` replaces `pauseWhenHidden` and has the same effect. Default: `{ notifier: false, whenHidden: true }`.

## Migration Examples

### Pause: from `pauseWhenHidden` to `pause: { whenHidden, notifier }`

**Before (v2.x)**

```typescript
poll({
  type: 'interval',
  delay: { strategy: 'constant', time: 2000 },
  retry: { limit: 5, consecutiveOnly: false },
  pauseWhenHidden: true,
});
```

**After (v3.x)**

```typescript
poll({
  type: 'interval',
  delay: { strategy: 'constant', time: 2000 },
  retry: { limit: 5, consecutiveOnly: false },
  pause: { whenHidden: true },
});
```

Omit `notifier` to keep the same behavior; add `notifier` with your own `Observable<boolean>` to pause at will.

### Custom pause source

**Before (v2.x)**

```typescript
// You couldn't inject a custom "pause" stream
poll({
  delay: { strategy: 'constant', time: 1000 },
});
```

**After (v3.x)**

```typescript
// Start paused
const pause$ = new BehaviorSubject(true);

poll({
  delay: { strategy: 'constant', time: 1000 },
  pause: {
    notifier: pause$,
    whenHidden: false, // set true (default) to also pause when tab hidden
  },
});

setTimeout(() => {
  // Resume polling
  pause$.next(false);
}, 1000);
```
