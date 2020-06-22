export type Dispatcher = {
  type: string;
  [key: string]: unknown;
};

export type ListenerProps<T> = {
  [K in keyof T]: T[K];
};

export type Listener<E extends Dispatcher> = (arg: ListenerProps<E>) => void;

type ListenersOfType<E extends Dispatcher> = Map<number, Listener<E>>;

type Listeners<E extends Dispatcher> = Map<string, ListenersOfType<E>>;

export default class Emitter<E extends Dispatcher> {
  private uuid = 0;
  private listeners: Listeners<E> = new Map();

  on(event: E["type"], fn: Listener<E>): () => void {
    const id = ++this.uuid;
    const existing = this.listeners.get(event) ?? new Map();
    this.listeners.set(event, existing.set(id, fn));

    return () => {
      this.listeners.get(event)?.delete(id);
      this.uuid -= 1;
    };
  }

  listenersCount(type?: E["type"]): number | undefined {
    if (type) return this.listeners.get(type)?.size;
    return this.listeners.size;
  }

  clear(event: E["type"]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    this.uuid -= listeners.size;
    listeners.clear();
  }

  clearAll(): void {
    this.uuid = 0;
    this.listeners.clear();
  }

  send(e: E | E["type"]): void {
    const event = (typeof e === "string" ? { type: e } : e) as E;
    const listeners = this.listeners.get(event.type);

    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }
}
