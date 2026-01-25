import { createState } from '../../src/common/state';

describe('createState', () => {
  it('should create default state with all properties undefined or zero', () => {
    const state = createState();

    expect(state).toEqual({
      value: undefined,
      error: undefined,
      pollCount: 0,
      retryCount: 0,
      consecutiveRetryCount: 0,
    });
  });

  it('should create state with partial overrides', () => {
    const state = createState({
      value: 'test-value',
      pollCount: 5,
    });

    expect(state).toEqual({
      value: 'test-value',
      error: undefined,
      pollCount: 5,
      retryCount: 0,
      consecutiveRetryCount: 0,
    });
  });

  it('should create state with all properties overridden', () => {
    const state = createState({
      value: 42,
      error: new Error('test error'),
      pollCount: 10,
      retryCount: 3,
      consecutiveRetryCount: 2,
    });

    expect(state).toEqual({
      value: 42,
      error: new Error('test error'),
      pollCount: 10,
      retryCount: 3,
      consecutiveRetryCount: 2,
    });
  });

  it('should support generic types', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const state = createState<TestData>({
      value: { id: 1, name: 'test' },
    });

    expect(state.value).toEqual({ id: 1, name: 'test' });
    expect(state.pollCount).toBe(0);
  });
});
