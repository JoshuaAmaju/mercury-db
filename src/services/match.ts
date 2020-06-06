import { Query } from "../query/types";
import openCursor from "../utils/openCursor";
import returnFormatter from "../utils/returnFormatter";
import { getStores, isEmptyObj, toWhere, toArray, has } from "../utils/utils";
import { relationStoreName } from "./../utils/utils";
import { MatchOperators, Properties } from "./types";

interface MatchedNode {
  node: Properties;
  relationships?: object;
}

interface MatchedNodes {
  [key: string]: MatchedNode;
}

interface DBResult {
  [k: string]: Properties;
}

interface UpdateAndOrDelete {
  set: object;
  label: string;
  delete: string[];
  type?: "relation";
  refObj: MatchedNodes;
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
  type,
  store,
  label,
  refObj,
  delete: deleter,
}: UpdateAndOrDelete) {
  await openCursor({
    store,
    onNext(cursor) {
      const { value } = cursor;

      let ref =
        type === "relation"
          ? {
              _id: value._id,
              type: value.type,
              ...value.props,
            }
          : value;

      let props = refObj[value._id]?.node ?? {};

      if (matches(props, ref)) {
        if (set) {
          const setters = set[label];

          replaceValues(setters, ref);

          console.log(ref);

          if (type && type === "relation") {
            const { _id, type, ...props } = ref;
            ref = { ...value, props };
          }

          cursor.update(ref);
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

  const matchedEnd = {} as MatchedNodes;
  const matchedStart = {} as MatchedNodes;

  let endCursorHasAdvanced = skip ? false : true;
  let startCursorHasAdvanced = skip ? false : true;
  let relationCursorHasAdvanced = skip ? false : true;

  const startStore = tx.objectStore(start.label);

  const shouldContinue = (obj: object) => {
    if (limit) return length(obj) < limit ? true : false;
    return true;
  };

  const setOrDelete = (label: string) => {
    return has.call(set, label) || deleter?.includes(label);
  };

  await openCursor({
    store: startStore,
    onNext(cursor) {
      if (!startCursorHasAdvanced) {
        startCursorHasAdvanced = true;
        cursor.advance(skip);
        return false;
      }

      const { value } = cursor;

      if (matches(startProps, value)) {
        matchedStart[value._id] = { node: value };
      }

      if (shouldContinue(matchedStart)) {
        cursor.continue();
      } else {
        return true;
      }
    },
  });

  if (end.label) {
    const endStore = tx.objectStore(end.label);

    await openCursor({
      store: endStore,
      onNext(cursor) {
        if (!endCursorHasAdvanced) {
          endCursorHasAdvanced = true;
          cursor.advance(skip);
          return false;
        }

        const { value } = cursor;

        if (matches(endProps, value)) {
          matchedEnd[value._id] = { node: value };
        }

        if (shouldContinue(matchedEnd)) {
          cursor.continue();
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
      //   keyRange,
      store: relationStore,
      onNext(cursor) {
        if (!relationCursorHasAdvanced) {
          relationCursorHasAdvanced = true;
          cursor.advance(skip);
          return false;
        }

        const { value } = cursor;

        if (matches(relationProps, value.props ?? {})) {
          const startNode = matchedStart[value.start];

          if (startNode) {
            const relations = startNode?.relationships;

            /**
             * Compose relationships of the same
             * type into one single array of relationships
             */
            const relationsOfType = toArray(relations?.[value.type] ?? []);
            const newRelations = [...relationsOfType, value];

            matchedStart[value.start] = {
              ...startNode,
              relationships: {
                ...relations,
                [value.type]: newRelations.filter((rel) => rel),
              },
            };
          }
        }

        cursor.continue();
        return false;
      },
    });
  }

  const results = [];

  for (const startKey in matchedStart) {
    const result = {};
    let fullPathMatched = true;
    const startObj = matchedStart[startKey];
    const relationships = startObj.relationships;
    const startNode = startObj.node;

    if (relationship.type) {
      const endNodes = [];
      const relations = [];

      if (relationships) {
        const relationsOfType = relationships[relationship.type];

        for (const relationOfType of relationsOfType) {
          const {
            to,
            _id,
            from,
            type,
            start,
            props,
            end: endId,
          } = relationOfType;

          const endNode = matchedEnd[endId]?.node;
          const relation = { _id, type, ...props };

          if (end.label) {
            fullPathMatched = false;
            const matches = where ? where(startNode, relation, endNode) : true;

            if (matches) {
              let innerMatch = false;

              if (
                endId &&
                endNode &&
                start === startNode._id &&
                endId === endNode._id
              ) {
                innerMatch = true;
              }

              if (innerMatch) {
                fullPathMatched = true;
                endNodes.push(endNode);
                relations.push(relation);
              }

              //   if (endId) {
              //     if (start === startNode._id && endId === endNode._id) {
              //       fullPathMatched = true;
              //       relations.push(relation);
              //       endNodes.push(endNode);
              //     }
              //   } else {
              //     fullPathMatched = true;
              //     relations.push(relation);
              //     endNodes.push(endNode);
              //   }
            }
          } else {
            const matches = where ? where(startNode, relation) : true;
            if (matches) relations.push(relation);
            fullPathMatched = matches;
          }
        }
      } else {
        fullPathMatched = false;
      }

      if (fullPathMatched) {
        result[end.as] = endNodes;
        result[start.as] = startNode;
        result[relationship.as] = relations;
      }
    } else {
      const matches = where ? where(startNode) : true;
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
        refObj: matchedStart,
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
          refObj: matchedEnd,
        });
      }
    }

    if (setOrDelete(relationship.as)) {
      if (relationship.type) {
        const relationships = {};

        /**
         * This just makes a object containing
         * relationships to conform to the format
         * needed by the update/deleter function.
         */
        for (const key in matchedStart) {
          const node = matchedStart[key];
          const relations = node?.relationships?.[relationship.type];

          if (!relations) continue;

          for (const relation of relations) {
            relationships[relation._id] = {
              node: {
                _id: relation?._id,
                type: relation?.type,
                ...relation.props,
              },
            };
          }
        }

        const store = tx.objectStore(relationStoreName);

        await updateAndOrDelete({
          set,
          store,
          delete: deleter,
          type: "relation",
          refObj: relationships,
          label: relationship.as,
        });
      }
    }
  }

  return results;
}
