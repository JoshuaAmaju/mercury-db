export type Listener<T = {}> = (arg: T) => T;

type Listeners = Map<string, Map<number, Listener>>;

export type Dispatcher = {
  type: string;
  [key: string]: any;
};

export default class Emitter<E extends Dispatcher = any> {
  uuid = 0;
  listeners: Listeners = new Map();

  subscribe(event: E["type"], fn: Listener) {
    const id = ++this.uuid;
    const existing = this.listeners.get(event) ?? new Map();
    this.listeners.set(event, existing.set(id, fn));

    return () => {
      this.listeners.get(event).delete(id);
      this.uuid -= 1;
    };
  }

  clear(event: string) {
    const listeners = this.listeners.get(event);
    this.uuid -= listeners.size;
    listeners.clear();
  }

  clearAll() {
    this.uuid = 0;
    this.listeners.clear();
  }

  send(e: E | E["type"]) {
    let { type, ...args } = typeof e === "string" ? { type: e } : e;
    const listeners = this.listeners.get(type);

    if (listeners) {
      let res = args;

      listeners.forEach((listener) => {
        res = listener(res);
      });

      return res;
    }
  }
}
