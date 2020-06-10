import { CreateOperators, Relationship, Properties } from "./types";
import { isEmptyObj, getStores } from "../utils/utils";
import { Query } from "../query/types";
import relate from "./relate";
import returnFormatter from "../utils/returnFormatter";

function relationQuery(q: Query<string>, start: number, end: number) {
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
) {
  const returner = operators?.return;
  const { end, start, relationship } = query;

  const stores = getStores(start.label, end.label);
  const tx = db.transaction(stores, "readwrite");

  return new Promise((resolve, reject) => {
    let endId;
    let startId;
    let relation;

    const hasEnd = end && end.props && !isEmptyObj(end.props);

    const startReq = tx.objectStore(start.label).put(start.props);
    startReq.onerror = () => reject(startReq.error);
    startReq.onsuccess = () => (startId = startReq.result);

    if (hasEnd) {
      const endReq = tx.objectStore(end.label).put(end.props);
      endReq.onerror = () => reject(endReq.error);
      endReq.onsuccess = () => (endId = endReq.result);
    }

    // tx.onerror = () => reject(tx.error);
    // tx.onabort = () => reject(tx.error);

    tx.oncomplete = async () => {
      if (relationship.type) {
        const newQuery = relationQuery(query, startId, endId);

        try {
          const relationRes = await relate(db, newQuery, {
            return: [relationship.as],
          });

          relation = relationRes[relationship.as];
        } catch (error) {
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
      };

      if (!hasEnd) delete returnValues[end?.as];
      if (!relationship.type) delete returnValues[relationship?.as];

      const results = returnFormatter(returnValues, returner);
      resolve(results);
    };
  });
}
