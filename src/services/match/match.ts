import { Query } from "../../query/types";
import returnFormatter from "../../utils/returnFormatter";
import {
  getStores,
  has,
  relationStoreName,
  isFunc,
  toArray,
  getProps,
} from "../../utils/utils";
import { MatchOperators } from "../types";
import { Assigner, PropAssigner, AssignerHelper } from "./types";
import {
  indexStore,
  isEqual,
  updateAndOrDelete,
  shouldContinue,
  openCursor,
} from "./utils";

export function assign(assigner: AssignerHelper): Assigner {
  const exec = (obj: object) => {
    if (typeof assigner === "function") return assigner(obj);

    const output = {};

    for (const key in assigner) {
      output[key] = assigner[key](obj);
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
    delete: deleter,
    return: returner,
  } = operators;

  const { end, start, relationship } = query;

  const endProps = end?.props;
  const startProps = start.props;
  const relationProps = relationship?.props;

  const foundEnds = new Map();
  const foundStarts = new Map();

  const stores = getStores(start.label, end.label, relationStoreName);
  const tx = db.transaction(stores, "readwrite");

  const setOrDelete = (label: string) => {
    return has.call(set ?? {}, label) || deleter?.includes(label);
  };

  const whereEval = (...args: any[]) => {
    return where ? where(...args) : true;
  };

  const results = [];
  const startStore = tx.objectStore(start.label);
  const { store, keyRange } = indexStore(startStore, startProps);

  await openCursor({
    skip,
    limit,
    store,
    keyRange,
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
      limit,
      store,
      keyRange,
      onNext({ value }) {
        if (isEqual(endProps, value)) {
          foundEnds.set(value._id, value);
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
          label: end.as,
          ref: foundEnds,
          delete: deleter,
          store: endStore,
        });
      }
    }
  }

  return results.map((result) => returnFormatter(result, returner));
}
