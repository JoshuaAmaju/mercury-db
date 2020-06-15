import { Query } from "../query/types";
import returnFormatter from "../utils/returnFormatter";
import { getStores, isEmptyObj } from "../utils/utils";
import relate from "./relate";
import { CreateOperators, Properties } from "./types";
import match from "./match/match";

function relationQuery(q: Query<string>, start: IDBValidKey, end: IDBValidKey) {
  const query = {
    start: {
      ...q.start,
      props: { _id: start },
    },
    end: {
      ...q.end,
      props: { _id: end },
    },
    relationship: q.relationship,
  } as Query<string, Properties>;

  return query;
}

export default function create(
  db: IDBDatabase,
  query: Query<string>,
  operators?: CreateOperators
): Promise<ReturnType<typeof match> | Record<string, Properties>> {
  const returner = operators?.return;
  const { end, start, relationship } = query;

  const stores = getStores(start.label, end.label);
  const tx = db.transaction(stores, "readwrite");

  return new Promise((resolve, reject) => {
    let endId: IDBValidKey;
    let startId: IDBValidKey;
    let relation: Properties;

    let txError: Error;

    const hasEnd = end && end.props && !isEmptyObj(end.props);

    const startReq = tx.objectStore(start.label).put(start.props);
    startReq.onerror = () => reject(startReq.error);
    startReq.onsuccess = () => (startId = startReq.result);

    if (hasEnd) {
      const endReq = tx.objectStore(end.label).put(end.props);
      endReq.onerror = () => reject(endReq.error);
      endReq.onsuccess = () => (endId = endReq.result);
    }

    /**
     * This is just to provide the user with
     * a proper error message if any occurs during
     * the process of creating the relationship.
     * See below for more explanation.
     */
    tx.onerror = () => reject(txError ?? tx.error);
    tx.onabort = () => reject(txError ?? tx.error);

    tx.oncomplete = async () => {
      if (relationship.type) {
        const newQuery = relationQuery(query, startId, endId);

        try {
          const relationRes = await relate(db, newQuery, {
            return: [relationship.as],
          });

          relation = relationRes[relationship.as];
        } catch (error) {
          /**
           * This references the comment above, that
           * also references this one.
           *
           * Abort the transaction that creates the
           * start and end node if an error occurs while
           * trying to create the relationship.
           *
           * Aborting the operation does not provide the user
           * with an error, so we have to grab a reference to
           * the error object, for proper handling.
           */
          txError = error;
          tx.abort();
        }
      }

      if (!returner) return resolve();

      /**
       * Group return values into single object
       * by their [as] variable for returning.
       */
      const returnValues = {
        [start.as]: {
          _id: startId,
          ...start.props,
        },
        [end?.as]: {
          _id: endId,
          ...end?.props,
        },
        [relationship?.as]: {
          _id: relation?._id,
          type: relation?.type,
          ...relationship.props,
        },
      } as Record<string, Properties>;

      if (!hasEnd) delete returnValues[end?.as];
      if (!relationship.type) delete returnValues[relationship?.as];

      const results = returnFormatter(returnValues, returner);

      resolve(results);
    };
  });
}
