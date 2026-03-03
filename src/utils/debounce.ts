/**
 * Creates a debounced version of the given function.
 * The debounced function delays invocation until after `delay` ms
 * have elapsed since the last call. Includes a `.cancel()` method
 * to abort any pending invocation.
 */
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): T & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = ((...args: any[]) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
}
