import openCursor from "../../utils/openCursor";
import { toWhere } from "../../utils/utils";
import { UpdateAndOrDelete } from "./types";

export function replaceValues(ref: object, obj: object) {
  for (const key in ref) obj[key] = ref[key];
}

export function length(obj: object) {
  return Object.keys(obj).length;
}

export function matches(props: object | null, target: object) {
  return props ? toWhere(props)(target) : true;
}

export async function updateAndOrDelete({
  set,
  store,
  label,
  refObj,
  delete: deleter,
}: UpdateAndOrDelete) {
  await openCursor({
    store,
    onNext(cursor) {
      const { value } = cursor;

      let props = refObj[value._id] ?? {};

      if (matches(props, value)) {
        if (set) {
          const setters = set[label];
          replaceValues(setters, value);
          cursor.update(value);
        }

        if (deleter && deleter.includes(label)) {
          cursor.delete();
        }
      }

      cursor.continue();
      return false;
    },
  });
}

export function getSingleIndex(store: IDBObjectStore, object: object) {
  let keyValue = [];
  const indexes = store.indexNames;

  for (const key in object) {
    if (indexes.contains(key)) {
      keyValue = [key, object[key]];
      break;
    }
  }

  return keyValue;
}

export function getIndexStore(store: IDBObjectStore, props?: object) {
  let keyRange: IDBKeyRange;
  let indexStore = store as IDBIndex | IDBObjectStore;
  const [key, value] = getSingleIndex(store, props ?? {});

  if (key) {
    indexStore = store.index(key);
    keyRange = IDBKeyRange.only(value);
  }

  return { store: indexStore ?? store, keyRange };
}
