interface OpenCursor {
  onDone?: VoidFunction;
  store: IDBObjectStore;
  onNext?: (cursor: IDBCursorWithValue) => any;
}

export default function openCursor({ store, onDone, onNext }: OpenCursor) {
  return new Promise((resolve, reject) => {
    const req = store.openCursor();

    req.onerror = () => reject(req.error);

    req.onsuccess = () => {
      const cursor = req.result;

      if (cursor) {
        onNext?.(cursor);
      } else {
        onDone?.();
        resolve();
      }
    };
  });
}
