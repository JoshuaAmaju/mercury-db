interface OpenCursor {
  onDone?: VoidFunction;
  store: IDBObjectStore;
  keyRange?: IDBKeyRange;
  onNext?: (cursor: IDBCursorWithValue) => any;
}

export default function openCursor({
  store,
  onDone,
  onNext,
  keyRange,
}: OpenCursor) {
  return new Promise((resolve, reject) => {
    const req = store.openCursor(keyRange);

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
