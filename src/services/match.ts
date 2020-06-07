import { Query } from "../query/types";
import openCursor from "../utils/openCursor";
import returnFormatter from "../utils/returnFormatter";
import {
  getStores,
  isEmptyObj,
  toWhere,
  toArray,
  has,
  getRelationProps,
} from "../utils/utils";
import { relationStoreName } from "./../utils/utils";
import { MatchOperators, Properties, Relationship } from "./types";

interface FoundNode extends Properties {
  relations?: Relationship[];
}

interface FoundNodes {
  [key: string]: FoundNode;
}

interface UpdateAndOrDelete {
  set: object;
  label: string;
  delete: string[];
  refObj: FoundNodes;
  store: IDBObjectStore;
}

function replaceValues(ref: object, obj: object) {
  for (const key in ref) obj[key] = ref[key];
}

function length(obj: object) {
  return Object.keys(obj).length;
}

function matches(props: object | null, target: object) {
  return props ? toWhere(props)(target) : true;
}

async function updateAndOrDelete({
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

function getSingleIndex(store: IDBObjectStore, object: object) {
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

export default async function match(
  db: IDBDatabase,
  query: Query<string>,
  operators: MatchOperators = {}
) {
  const {
    set,
    skip,
    limit,
    where,
    delete: deleter,
    return: returner,
  } = operators;

  const { end, start, relationship } = query;

  const endProps = end?.props;
  const startProps = start.props;
  const relationProps = relationship?.props;

  const stores = getStores(start.label, end.label, relationStoreName);
  const tx = db.transaction(stores, "readwrite");

  const foundEnds = {} as FoundNodes;
  const foundStarts = {} as FoundNodes;

  const shouldContinue = (obj: object) => {
    if (limit) return length(obj) < limit ? true : false;
    return true;
  };

  const setOrDelete = (label: string) => {
    return has.call(set ?? {}, label) || deleter?.includes(label);
  };

  const matchesFn = (...args: any[]) => {
    return where ? where(...args) : true;
  };

  const results = [];
  const startStore = tx.objectStore(start.label);

  let keyRange: IDBKeyRange;
  let refStartStore = startStore as IDBIndex | IDBObjectStore;
  const [indexKey, indexValue] = getSingleIndex(startStore, start?.props ?? {});

  if (indexKey) {
    refStartStore = startStore.index(indexKey);
    keyRange = IDBKeyRange.only(indexValue);
  }

  await openCursor({
    skip,
    keyRange,
    store: refStartStore,
    onNext(cursor) {
      const { value } = cursor;
      if (matches(startProps, value)) foundStarts[value._id] = value;

      if (shouldContinue(foundStarts)) {
        cursor.continue();
        return false;
      } else {
        return true;
      }
    },
  });

  if (end.label) {
    let keyRange: IDBKeyRange;
    const endStore = tx.objectStore(end.label);
    let refEndStore = endStore as IDBIndex | IDBObjectStore;
    const [indexKey, indexValue] = getSingleIndex(endStore, end?.props ?? {});

    if (indexKey) {
      refEndStore = endStore.index(indexKey);
      keyRange = IDBKeyRange.only(indexValue);
    }

    await openCursor({
      skip,
      keyRange,
      store: refEndStore,
      onNext(cursor) {
        const { value } = cursor;
        if (matches(endProps, value)) foundEnds[value._id] = value;

        if (shouldContinue(foundEnds)) {
          cursor.continue();
          return false;
        } else {
          return true;
        }
      },
    });
  }

  if (relationship.type) {
    const keyRange = IDBKeyRange.only(relationship.type);
    const relationStore = tx.objectStore(relationStoreName).index("type");

    // Not sure if I should also apply skipping
    // to the relatinship store. But I think not.
    await openCursor({
      //   skip,
      keyRange,
      store: relationStore,
      onNext(cursor) {
        const { value } = cursor;
        const { _id, type } = value;
        const props = getRelationProps(value);

        if (matches(relationProps, props ?? {})) {
          let result = {};
          const startNode = foundStarts[value.start];

          if (startNode) {
            const endNode = foundEnds[value.end];
            let relation = { _id, type, ...props };
            const matches = matchesFn(startNode, relation, endNode);

            if (matches) {
              let innerMatch = endProps
                ? value.end &&
                  endNode &&
                  value.start === startNode._id &&
                  value.end === (endNode as any)._id
                : true;

              if (innerMatch) {
                const { as } = relationship;
                if (setOrDelete(relationship.as)) {
                  if (set) {
                    const setter = set[as];
                    replaceValues(setter, relation);
                    cursor.update({ ...value, ...relation });
                  }

                  if (deleter && deleter.includes(as)) {
                    cursor.delete();
                  }
                }

                result[end.as] = endNode;
                result[start.as] = startNode;
                result[relationship.as] = relation;

                results.push(result);
              }
            }
          }
        }

        cursor.continue();
        return false;
      },
    });
  } else {
    for (const key in foundStarts) {
      const startNode = foundStarts[key];
      const matches = matchesFn(startNode);
      if (matches) results.push({ [start.as]: startNode });
    }
  }

  // Perform neccessary property updates or
  // store item deletion.
  if (set || deleter) {
    if (setOrDelete(start.as)) {
      await updateAndOrDelete({
        set,
        label: start.as,
        delete: deleter,
        store: startStore,
        refObj: foundStarts,
      });
    }

    if (setOrDelete(end.as)) {
      if (end.label) {
        const endStore = tx.objectStore(end.label);

        await updateAndOrDelete({
          set,
          label: end.as,
          delete: deleter,
          store: endStore,
          refObj: foundEnds,
        });
      }
    }
  }

  return results.map((result) => returnFormatter(result, returner));
}
