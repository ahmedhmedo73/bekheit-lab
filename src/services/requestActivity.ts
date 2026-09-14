export function createRequestTracker() {
  let pending = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  return {
    getSnapshot: () => pending,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async run<T>(request: () => Promise<T>): Promise<T> {
      pending++;
      notify();
      try { return await request(); }
      finally { pending--; notify(); }
    },
  };
}

export const requestActivity = createRequestTracker();

/** Wrap the API service once so new methods automatically participate as well.
 * Keep method receivers intact for methods that call other service methods.
 */
export function trackServiceRequests<T extends object>(service: T, tracker = requestActivity): T {
  const methods = new Map<PropertyKey, unknown>();
  return new Proxy(service, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (typeof value !== 'function') return value;
      if (!methods.has(key)) methods.set(key, (...args: unknown[]) => tracker.run(() => Reflect.apply(value, receiver, args)));
      return methods.get(key);
    },
  });
}
