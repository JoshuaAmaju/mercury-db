interface OpenCursor {
  skip?: number;
  onDone?: VoidFunction;
  keyRange?: IDBKeyRange;
  store: IDBObjectStore | IDBIndex;
  onNext?: (cursor: IDBCursorWithValue) => boolean;
}

export default function openCursor({
  skip,
  store,
  onDone,
  onNext,
  keyRange,
}: OpenCursor) {
  return new Promise((resolve, reject) => {
    const req = store.openCursor(keyRange);
    let cursorHasAdvanced = skip ? false : true;

    req.onerror = () => reject(req.error);

    req.onsuccess = () => {
      const cursor = req.result;

      if (cursor) {
        if (!cursorHasAdvanced) {
          cursorHasAdvanced = true;
          return cursor.advance(skip);
        }

        const shouldResolve = onNext?.(cursor);
        if (shouldResolve) resolve();
      } else {
        onDone?.();
        resolve();
      }
    };
  });
}
