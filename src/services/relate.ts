import { Query } from "../query/types";
import returnFormatter from "../utils/returnFormatter";
import { getProps, relationStoreName } from "../utils/utils";
import { Properties, ReturnOperator } from "./types";

export default function relate(
  db: IDBDatabase,
  query: Query<string, Properties>,
  operators?: ReturnOperator
): Promise<Record<string, Properties>> {
  const returner = operators?.return;
  const { end, start, relationship } = query;
  const { type, props } = relationship;

  const endPrimaryKey = end.props._id;
  const startPrimaryKey = start.props._id;

  const relation = {
    type,
    to: end.label,
    from: start.label,
    end: endPrimaryKey,
    start: startPrimaryKey,
    ...props,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(relationStoreName, "readwrite");
    const store = tx.objectStore(relationStoreName);
    const req = store.put(relation);

    req.onerror = () => reject(req.error);

    req.onsuccess = () => {
      const res = req.result;

      if (!returner) return resolve();

      const newReq = store.get(res);
      newReq.onerror = () => reject(newReq.error);

      newReq.onsuccess = () => {
        const props = getProps(newReq.result);

        const obj = {
          [relationship.as]: {
            type,
            _id: res,
            ...props,
          },
        } as Record<string, Properties>;

        resolve(returnFormatter(obj, returner));
      };
    };

    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
