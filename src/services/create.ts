import { relationStoreName, isEmptyObj } from "./../utils/utils";
import type { Query } from "../query/types";
import returnFormatter from "./utils/returnFormatter";
import match from "./match/match";
import type { CreateOperators, Properties, Identity } from "./types";
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
      return relateHelper(tx, query as Required<typeof query>, startId, endId);
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
          ...start.props,
          _id: startId,
        },
      } as Record<string, Properties>;

      if (end?.as) {
        returnValues[end.as] = {
          ...end.props,
          _id: endId as Identity,
        };
      }

      if (relationship?.as) {
        returnValues[relationship.as] = {
          ...relationship.props,
          type: relation?.type,
          _id: relation?._id,
        };
      }

      const results = returnFormatter(returnValues, returner);

      resolve(results);
    };
  });
}
