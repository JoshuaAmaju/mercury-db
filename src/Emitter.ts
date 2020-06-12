type Listener = (...args: any[]) => void;

type Listeners = Map<string, Listener[]>;

type Dispatcher = {
  type: string;
  [key: string]: any;
};

export default class Emitter {
  listeners: Listeners = new Map();

  on(event: string, fn: Listener) {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, existing.concat(fn));
  }

  off(event: string, fn: Listener) {
    const existing = this.listeners.get(event);

    if (existing) {
      const fns = existing.filter((listener) => listener === fn);
      this.listeners.set(event, fns);
    }
  }

  clear(event: string) {
    this.listeners.set(event, []);
  }

  clearAll() {
    this.listeners.clear();
  }

  send<T extends Dispatcher>(e: T | T["type"]) {
    const { type, ...args } = typeof e === "string" ? { type: e } : e;
    const listeners = this.listeners.get(type);

    if (listeners) {
      listeners.forEach((listener) => {
        listener(args);
      });
    }
  }
}
