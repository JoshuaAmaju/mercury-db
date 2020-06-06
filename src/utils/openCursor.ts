interface OpenCursor {
  onDone?: VoidFunction;
  store: IDBObjectStore;
  keyRange?: IDBKeyRange;
  onNext?: (cursor: IDBCursorWithValue) => boolean;
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
        const shouldResolve = onNext?.(cursor);
        if (shouldResolve) resolve();
      } else {
        onDone?.();
        resolve();
      }
    };
  });
}
