import { pollMode, pollType } from '../../src/constants/poll.const';

describe('poll.const', () => {
  it('should export pollMode constants', () => {
    expect(pollMode).toEqual({ DELAY: 'delay', RETRY: 'retry' });
  });

  it('should export pollType constants', () => {
    expect(pollType).toEqual({ REPEAT: 'repeat', INTERVAL: 'interval' });
  });
});
