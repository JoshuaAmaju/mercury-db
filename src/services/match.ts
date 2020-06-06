import { Query } from "../query/types";
import openCursor from "../utils/openCursor";
import returnFormatter from "../utils/returnFormatter";
import { getStores, isEmptyObj, toWhere, toArray } from "../utils/utils";
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

function getOneOrAll(items: any[]) {
  return items.length === 1 ? items[0] : items;
}

function matches(props: object | null, target: object) {
  return props ? toWhere(props)(target) : true;
}

export default async function match(
  db: IDBDatabase,
  query: Query<string>,
  operators: MatchOperators = {}
) {
  const { where, return: returner } = operators;
  const { end, start, relationship } = query;

  const endProps = end?.props;
  const startProps = start.props;
  const relationProps = relationship?.props;

  const stores = getStores(start.label, end.label, relationStoreName);
  const tx = db.transaction(stores, "readwrite");

  const matchedEnd = {} as DBResult;
  const matchedStart = {} as MatchedNodes;

  const startStore = tx.objectStore(start.label);

  await openCursor({
    store: startStore,
    onNext(cursor) {
      const { value } = cursor;

      if (matches(startProps, value)) {
        matchedStart[value._id] = { node: value };
      }

      cursor.continue();
    },
  });

  if (end.label) {
    const endStore = tx.objectStore(end.label);

    await openCursor({
      store: endStore,
      onNext(cursor) {
        const { value } = cursor;

        if (matches(endProps, value)) {
          matchedEnd[value._id] = value;
        }

        cursor.continue();
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

          const endNode = matchedEnd[endId];
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
            fullPathMatched = matches;
            if (matches) relations.push(relation);
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

  return results;
}
