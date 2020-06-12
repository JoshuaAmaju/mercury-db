import { Query } from "../../query/types";
import returnFormatter from "../../utils/returnFormatter";
import {
  getProps,
  getStores,
  has,
  relationStoreName,
  isFunc,
} from "../../utils/utils";
import { MatchOperators } from "../types";
import { Assigner, AssignerHelper } from "./types";
import { indexStore, isEqual, openCursor, updateAndOrDelete } from "./utils";
import { sortAscendingBy, sortDescendingBy } from "../../utils/matchSorter";

const orderFns = {
  ASC: sortAscendingBy,
  DESC: sortDescendingBy,
};

/**
 * Assigns new values/updates to the object found
 * in the database during a match query.
 */
export function assign(assigner: AssignerHelper): Assigner {
  const exec = (obj: object) => {
    if (typeof assigner === "function") return assigner(obj);

    const output = { ...obj };

    for (const key in assigner) {
      const value = assigner[key];
      output[key] = isFunc(value) ? value(obj) : value;
    }

    return output;
  };

  return {
    exec,
    type: "assign",
  };
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
    orderBy,
    rawLimit,
    delete: deleter,
    return: returner,
  } = operators;

  const { end, start, relationship } = query;

  // End nodes that are found in the db.
  const foundEnds = new Map();

  // Start nodes that are found in the db.
  const foundStarts = new Map();

  const endProps = end?.props;
  const startProps = start.props;
  const relationProps = relationship?.props;

  const stores = getStores(start.label, end.label, relationStoreName);
  const tx = db.transaction(stores, "readwrite");

  const setOrDelete = (label: string) => {
    return has.call(set ?? {}, label) || deleter?.includes(label);
  };

  // Evaluates the where query caluse, if not
  // provided, then all matches are true.
  const whereEval = (...args: any[]) => {
    return where ? where(...args) : true;
  };

  let results = [];
  const startStore = tx.objectStore(start.label);
  const { store, keyRange } = indexStore(startStore, startProps);

  const relationStore = tx.objectStore(relationStoreName).index("type");

  await openCursor({
    skip,
    store,
    keyRange,
    limit: rawLimit,
    onNext({ value }) {
      if (isEqual(startProps, value)) {
        foundStarts.set(value._id, value);
      }
    },
  });

  if (end.label) {
    const endStore = tx.objectStore(end.label);
    const { store, keyRange } = indexStore(endStore, endProps);

    await openCursor({
      skip,
      store,
      keyRange,
      limit: rawLimit,
      onNext({ value }) {
        if (isEqual(endProps, value)) {
          foundEnds.set(value._id, value);
        }
      },
    });
  }

  if (relationship.type) {
    const keyRange = IDBKeyRange.only(relationship.type);

    // Not sure if I should also apply skipping
    // to the relatinship store. But I think not.
    await openCursor({
      //   skip,
      keyRange,
      store: relationStore,
      onNext(cursor) {
        const { value } = cursor;
        const { _id, type } = value;
        const props = getProps(value) ?? {};

        if (isEqual(relationProps, props)) {
          let result = {};
          const startNode = foundStarts.get(value.start);

          if (startNode) {
            let relation = { _id, type, ...props };
            const endNode = foundEnds.get(value.end);
            const matches = whereEval(startNode, relation, endNode);

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
                    const setter = set[as].exec(props);
                    relation = { ...relation, ...setter };
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
      },
    });
  } else {
    foundStarts.forEach((node) => {
      const matches = whereEval(node);
      if (matches) results.push({ [start.as]: node });
    });
  }

  // Perform neccessary property updates or
  // store item deletion.
  if (set || deleter) {
    if (setOrDelete(start.as)) {
      await updateAndOrDelete({
        set,
        relationStore,
        label: start.as,
        delete: deleter,
        ref: foundStarts,
        store: startStore,
      });
    }

    if (setOrDelete(end.as)) {
      if (end.label) {
        const endStore = tx.objectStore(end.label);
        await updateAndOrDelete({
          set,
          relationStore,
          label: end.as,
          ref: foundEnds,
          delete: deleter,
          store: endStore,
        });
      }
    }

    // Assign the new updates to the output
    results = results.map((result) => {
      for (const key in result) {
        const value = result[key];
        const assigner = set?.[key];

        if (assigner) {
          const setter = assigner.exec(value);
          result[key] = { ...value, ...setter };
        }
      }

      return result;
    });
  }

  if (!returner) return;

  if (limit) {
    results = results
      .map((result, i) => {
        return i < limit && result;
      })
      .filter((res) => res);
  }

  if (orderBy) {
    const { key, type = "ASC" } = orderBy;
    const orderFn = orderFns[type];
    const keys = Array.isArray(key) ? key : [key];
    for (const key of keys) results = orderFn(results, key);
  }

  return results.map((result) => {
    return returnFormatter(result, returner);
  });
}
