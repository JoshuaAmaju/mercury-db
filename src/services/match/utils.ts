import { toWhere, getProps } from "../../utils/utils";
import { UpdateAndOrDelete, OpenCursor } from "./types";

export function shouldContinue(step: number, limit: number) {
  if (limit) return step < limit ? true : false;
  return true;
}

export function isEqual(props: object | null, target: object) {
  return props ? toWhere(props)(target) : true;
}

export async function updateAndOrDelete({
  set,
  ref,
  store,
  label,
  delete: deleter,
}: UpdateAndOrDelete) {
  await openCursor({
    store,
    onNext(cursor) {
      const { value } = cursor;

      let props = ref.get(value._id) ?? {};

      if (isEqual(props, value)) {
        if (set) {
          const assigner = set[label];
          const val = getProps(value);
          const setters = assigner.exec(val);
          cursor.update({ ...value, ...setters });
        }

        if (deleter && deleter.includes(label)) cursor.delete();
      }
    },
  });
}

export function indexKeyValue(store: IDBObjectStore, object: object = {}) {
  let value: any;
  let key: string;
  const indexes = store.indexNames;

  for (const k in object) {
    if (indexes.contains(k)) {
      [key, value] = [key, object[k]];
      break;
    }
  }

  return [key, value];
}

export function indexStore(store: IDBObjectStore, props?: object) {
  let keyRange: IDBKeyRange;
  const [key, value] = indexKeyValue(store, props);
  let indexStore = store as IDBIndex | IDBObjectStore;

  if (key) {
    indexStore = store.index(key);
    keyRange = IDBKeyRange.only(value);
  }

  return { store: indexStore ?? store, keyRange };
}

export function openCursor({
  skip,
  limit,
  store,
  onNext,
  keyRange,
}: OpenCursor) {
  return new Promise((resolve, reject) => {
    let count = 0;
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

        count += 1;
        const shouldResolve = onNext(cursor) ?? false;

        if (shouldResolve === true) {
          resolve();
        } else {
          if (shouldContinue(count, limit)) {
            cursor.continue();
          } else {
            resolve();
          }
        }
      } else {
        resolve();
      }
    };
  });
}
