import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 350));
    expect(result.current).toBe('initial');
  });

  it('does not update debounced value before delay passes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 350),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });

    // Advance 200ms (less than 350ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('first');
  });

  it('updates debounced value after full delay passes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 350),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current).toBe('second');
  });

  it('resets timer when value changes rapidly before debounce completes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 350),
      { initialProps: { value: 'k' } }
    );

    // Simulate keystrokes: k -> ka -> kam -> kamlesh
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'ka' });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'kam' });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'kamlesh' });

    // 300ms total elapsed, but each keystroke reset the 350ms timer
    // So result should still be initial 'k'
    expect(result.current).toBe('k');

    // Advance remaining 350ms after the last keystroke
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Should now update to the final value directly
    expect(result.current).toBe('kamlesh');
  });

  it('cancels pending timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 350),
      { initialProps: { value: 'hello' } }
    );

    rerender({ value: 'world' });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
