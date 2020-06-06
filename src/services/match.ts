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

function getOneOrAll(items: any[]) {
  return items.length === 1 ? items[0] : items;
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
    return has.call(set, label) || deleter?.includes(label);
  };

  const matchesFn = (...args: any[]) => {
    return where ? where(...args) : true;
  };

  const startStore = tx.objectStore(start.label);

  await openCursor({
    skip,
    store: startStore,
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
    const endStore = tx.objectStore(end.label);

    await openCursor({
      skip,
      store: endStore,
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
    const relationStore = tx.objectStore(relationStoreName);

    await openCursor({
      //   skip,
      //   keyRange,
      store: relationStore,
      onNext(cursor) {
        const { value } = cursor;
        const { type, start } = value;
        const props = getRelationProps(value);

        if (matches(relationProps, props ?? {}) && type === relationship.type) {
          const startNode = foundStarts[start];

          if (startNode) {
            /**
             * Compose relationships of the same
             * type into one single array of relationships
             */
            let relations = startNode?.relations;
            relations = [...(relations ?? []), value];
            foundStarts[value.start].relations = relations.filter((rel) => rel);
          }
        }

        cursor.continue();
        return false;
      },
    });
  }

  const results = [];

  for (const key in foundStarts) {
    const result = {};
    let fullPathMatched = true;
    const startObj = foundStarts[key];
    const { relations, ...startNode } = startObj;

    if (relationship.type) {
      const endNodes = [];
      const relationNodes = [];

      if (relations) {
        for (const relOfType of relations) {
          const { _id, type, start, end } = relOfType;
          const props = getRelationProps(relOfType);
          const relation = { _id, type, ...props };
          const { relations, ...endNode } = foundEnds[end] ?? {};

          if (end.label) {
            fullPathMatched = false;
            const matches = matchesFn(startNode, relation, endNode);

            if (matches) {
              let innerMatch = false;

              if (
                end &&
                endNode &&
                start === startNode._id &&
                end === (endNode as any)._id
              ) {
                innerMatch = true;
              }

              if (innerMatch) {
                fullPathMatched = true;
                endNodes.push(endNode);
                relationNodes.push(relation);
              }
            }
          } else {
            const matches = matchesFn(startNode, relation);
            if (matches) relationNodes.push(relation);
            fullPathMatched = matches;
          }
        }
      } else {
        fullPathMatched = false;
      }

      if (fullPathMatched) {
        result[end.as] = endNodes;
        result[start.as] = startNode;
        result[relationship.as] = relationNodes;
      }
    } else {
      const matches = matchesFn(startNode);
      if (matches) result[start.as] = startNode;
    }

    if (returner && !isEmptyObj(result)) {
      results.push(returnFormatter(result, returner));
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

    if (setOrDelete(relationship.as)) {
      if (relationship.type) {
        const rels = {};

        /**
         * This just makes a object containing
         * relationships to conform to the format
         * needed by the update/deleter function.
         */
        for (const key in foundStarts) {
          const { relations: relationships } = foundStarts[key] ?? {};
          const relations = relationships?.[relationship.type];
          if (!relations) continue;

          for (const relation of relations) {
            rels[relation._id] = relation;
          }
        }

        const store = tx.objectStore(relationStoreName);

        await updateAndOrDelete({
          set,
          store,
          refObj: rels,
          delete: deleter,
          label: relationship.as,
        });
      }
    }
  }

  return results;
}
