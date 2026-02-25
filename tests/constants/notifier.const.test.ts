import { lastValueFrom, toArray } from 'rxjs';

import { defaultNotifier$ } from '../../src/constants/notifier.const';

describe('notifier.const', () => {
  describe('defaultNotifier$', () => {
    it('should emit false and complete', async () => {
      const values = await lastValueFrom(defaultNotifier$.pipe(toArray()));
      expect(values).toEqual([false]);
    });
  });
});
