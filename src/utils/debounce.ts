/**
 * Creates a debounced version of the given function.
 * The debounced function delays invocation until after `delay` ms
 * have elapsed since the last call. Includes a `.cancel()` method
 * to abort any pending invocation.
 */
export function debounce<R>(
    fn: (...args: unknown[]) => R,
    delay: number
): ((...args: unknown[]) => void) & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: unknown[]): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };

    const result = debounced as ((...args: unknown[]) => void) & { cancel: () => void };
    result.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return result;
}
