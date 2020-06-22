import { relationStoreName, isEmptyObj } from "./../utils/utils";
import { Query } from "../query/types";
import returnFormatter from "./utils/returnFormatter";
import match from "./match/match";
import { CreateOperators, Properties } from "./types";
import { getStores, relateHelper } from "./utils/utils";

export default function create(
  db: IDBDatabase,
  query: Query<string>,
  operators?: CreateOperators
): Promise<ReturnType<typeof match> | Record<string, Properties>> {
  const returner = operators?.return;
  const { end, start, relationship } = query;

  const stores = getStores(start.label, end?.label, relationStoreName);
  const tx = db.transaction(stores, "readwrite");

  return new Promise((resolve, reject) => {
    let endId: IDBValidKey;
    let startId: IDBValidKey;
    let relation: Properties;

    const relate = () => {
      return relateHelper(tx, query as Required<typeof query>, start, end);
    };

    const startReq = tx.objectStore(start.label).put(start.props);

    startReq.onerror = () => reject(startReq.error);

    startReq.onsuccess = async () => {
      startId = startReq.result;

      if (end?.props && !isEmptyObj(end.props)) {
        const endReq = tx.objectStore(end.label).put(end.props);

        endReq.onerror = () => reject(endReq.error);

        endReq.onsuccess = async () => {
          endId = endReq.result;
          relation = await relate();
        };
      } else {
        relation = await relate();
      }
    };

    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);

    tx.oncomplete = async () => {
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
      } as Record<string, Properties>;

      if (end?.as) {
        returnValues[end.as] = {
          _id: endId,
          ...end.props,
        };
      }

      if (relationship?.as) {
        returnValues[relationship.as] = {
          _id: relation?._id,
          type: relation?.type,
          ...relationship.props,
        };
      }

      const results = returnFormatter(returnValues, returner);

      resolve(results);
    };
  });
}
