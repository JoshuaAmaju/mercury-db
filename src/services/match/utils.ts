import { WeBaseRecord } from "../../types";
import { getProps } from "../../utils/utils";
import { relationStoreName } from "./../../utils/utils";
import { OpenCursor, UpdateAndOrDelete } from "./types";

// Whether the cursor should continue or stop.
export function shouldContinue(step: number, limit: number): boolean {
  if (limit) return step < limit ? true : false;
  return true;
}

/**
 * Checks if the object passed by the user has equal
 * values to the object found in the database. This is
 * not an equality check per se. It does not try to match
 * every item in each object. It just matches the values
 * present in A object to those in B object, while ignoring keys
 * not present in A but that are present in B.
 */
export function hasEqualCorrespondence(
  props: WeBaseRecord | null,
  target: WeBaseRecord
): boolean {
  if (!props) return true;

  const matches = new Set();
  Object.keys(props).forEach((prop) => {
    matches.add(props[prop] === target[prop]);
  });

  return !matches.has(false) && matches.size > 0;
}

/**
 * Performs delete and update operations after each
 * match query, of values that were found in the database,
 * if requested by the user.
 */
export async function updateAndOrDelete({
  set,
  ref,
  store,
  label,
  relationStore,
  delete: deleter,
}: UpdateAndOrDelete): Promise<void> {
  const deletedNodes = new Map();

  await openCursor({
    store,
    async onNext(cursor) {
      const { value } = cursor;

      const props = ref.get(value._id) ?? {};

      if (hasEqualCorrespondence(props, value)) {
        if (set) {
          const assigner = set[label];
          const val = getProps(value);
          const setters = assigner.exec(val);
          cursor.update({ ...value, ...setters });
        }

        if (deleter && deleter.includes(label)) {
          cursor.delete();

          if (store.name !== relationStoreName) {
            const id = value._id;
            deletedNodes.set(id, id);
          }
        }
      }
    },
  });

  /**
   * Delete any relationship attach to a node
   * that was just deleted. We don't want to have
   * haning relationships, not attached to any node.
   * And to also avoid the flooding the database with
   * useless relationships.
   */
  await openCursor({
    store: relationStore,
    onNext(cursor) {
      const {
        value: { end, start },
      } = cursor;

      let id = deletedNodes.get(start);

      if (!id) id = deletedNodes.get(end);

      /**
       * Delete any relationship that has the deleted node
       * _id as its' start or end reference, and also delete
       * any relationship that does not have and end node.
       */
      if (id === start || id === end) cursor.delete();
    },
  });
}

/**
 * Searchs for any key that is indexed in the
 * database, and return the key and value.
 */
export function indexKeyValue(
  store: IDBObjectStore,
  object: WeBaseRecord = {}
): [string, unknown] {
  let key: string;
  let value: unknown;
  const indexes = store.indexNames;

  for (const k in object) {
    if (indexes.contains(k)) {
      [key, value] = [k, object[k]];
      break;
    }
  }

  return [key, value];
}

/**
 * Creates an index and a key range from a given store to
 * query the database if the passed search object contains an indexed key.
 * Returns the object store if no indexed value is present in
 * the search object.
 */
export function indexStore(
  store: IDBObjectStore,
  props?: WeBaseRecord
): [IDBIndex | IDBObjectStore, IDBKeyRange] {
  let keyRange: IDBKeyRange;
  const [key, value] = indexKeyValue(store, props);
  let indexStore = store as IDBIndex | IDBObjectStore;

  if (key) {
    indexStore = store.index(key);
    keyRange = IDBKeyRange.only(value);
  }

  return [indexStore ?? store, keyRange];
}

/* Handles anything pertaining
 * to traversing each row of a given store. Taking
 advantage of the fact that, although transactions auto
 commit if keep idle, so doing async/await would not work.
 Except if the transaction is active, so we are just passing down
 the same transaction through out the quering process
 to achieve async/await style programming. Basicly keeping
 the transaction active.
 */
export function openCursor({
  skip,
  limit,
  store,
  onNext,
  keyRange,
}: OpenCursor): Promise<void> {
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
