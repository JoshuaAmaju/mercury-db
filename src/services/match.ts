import { relationStoreName } from "./../utils/utils";
import { Query } from "../query/types";
import { getStores, toWhere, isEmptyObj } from "../utils/utils";
import { MatchOperators, Properties } from "./types";
import openCursor from "../utils/openCursor";
import returnFormatter from "../utils/returnFormatter";

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

  const matchedRelation = {};
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
    const keyRange = IDBKeyRange.only("type");
    const relationStore = tx.objectStore(relationStoreName);

    await openCursor({
      //   keyRange,
      store: relationStore,
      onNext(cursor) {
        const { value } = cursor;

        if (matches(relationProps, value.props ?? {})) {
          const startNode = matchedStart[value.start];

          if (startNode) {
            const startRelations = startNode?.relationships;

            const startRelationsType = []
              .concat(startRelations?.[value.type], value)
              .filter((rel) => rel);

            matchedStart[value.start] = {
              ...matchedStart[value.start],
              relationships: {
                ...startRelations,
                [value.type]: startRelationsType,
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

        for (const {
          to,
          _id,
          from,
          type,
          start,
          props,
          end: endId,
        } of relationsOfType) {
          const endNode = matchedEnd[endId];
          const relation = { _id, type, ...props };

          if (end.label) {
            fullPathMatched = false;
            const matches = where ? where(startNode, relation, endNode) : true;

            if (matches) {
              const innerMatch =
                (endId && start === startNode._id && endId === endNode._id) ||
                true;

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
