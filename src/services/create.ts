import { CreateOperators, Relationship, Properties } from "./types";
import { isEmptyObj } from "../utils/utils";
import { Query } from "../query/types";
import relate from "./relate";
import returnFormatter from "../utils/returnFormatter";

function relationQuery(start: number, end: number, props: object) {
  const query = {
    start: {
      props: { _id: start },
    },
    end: {
      props: { _id: end },
    },
    relationship: { props },
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

  const stores = [start.label, end.label];

  const tx = db.transaction(
    stores.filter((store) => store),
    "readwrite"
  );

  return new Promise((resolve, reject) => {
    let endId;
    let startId;
    let relation;

    const hasEnd = end && end.props && !isEmptyObj(end.props);

    const startReq = tx.objectStore(start.label).add(start.props);
    startReq.onerror = () => reject(startReq.error);
    startReq.onsuccess = () => (startId = startReq.result);

    if (hasEnd) {
      const endReq = tx.objectStore(end.label).add(end.props);
      endReq.onerror = () => reject(endReq.error);
      endReq.onsuccess = () => (endId = endReq.result);
    }

    tx.onerror = () => reject(tx.error);

    tx.oncomplete = async () => {
      if (relationship.type) {
        const newQuery = relationQuery(startId, endId, relationship.props);

        const relationRes = await relate(db, newQuery, {
          return: [relationship.as],
        });

        relation = relationRes[relationship.as];
      }

      if (returner) {
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
            _id: relation._id,
            type: relation.type,
            ...relationship.props,
          },
        };

        if (!hasEnd) delete returnValues[end?.as];
        if (!relationship.type) delete returnValues[relationship?.as];

        const results = returnFormatter(returnValues, returner);
        resolve(results);
      }

      resolve();
    };
  });
}
