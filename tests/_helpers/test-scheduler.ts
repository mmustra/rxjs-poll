import { TestScheduler } from 'rxjs/testing';

export function createTestScheduler(): TestScheduler {
  return new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
}
