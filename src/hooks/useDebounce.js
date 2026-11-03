import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Debounces any value (such as search text input) by a specified delay (default: 350ms).
 * Whenever the input value changes, the timer is cleared and reset.
 * The debounced value is only updated once typing has paused for the full duration.
 *
 * @param {any} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 350ms)
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
