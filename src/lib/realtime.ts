type Listener = (event: Record<string, unknown>) => void;

const globalRef = globalThis as unknown as { __campusFlowListeners?: Set<Listener> };

const listeners = globalRef.__campusFlowListeners ?? new Set<Listener>();
globalRef.__campusFlowListeners = listeners;

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publish(event: Record<string, unknown>): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // 单个监听器异常不影响其他订阅者
    }
  }
}

export function listenerCount(): number {
  return listeners.size;
}
