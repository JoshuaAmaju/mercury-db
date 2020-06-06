import { Query } from "../query/types";
import { ReturnOperator, Properties } from "./types";
import { relationStoreName } from "../utils/utils";

export default function relate(
  db: IDBDatabase,
  query: Query<string, Properties>,
  operators?: ReturnOperator
) {
  const returner = operators?.return;
  const { end, start, relationship } = query;

  const endPrimaryKey = end.props._id;
  const startPrimaryKey = start.props._id;

  const relation = {
    to: end.label,
    from: start.label,
    end: endPrimaryKey,
    start: startPrimaryKey,
    type: relationship.type,
    props: relationship.props,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(relationStoreName, "readwrite");
    const store = tx.objectStore(relationStoreName);
    const req = store.add(relation);

    req.onerror = () => reject(req.error);

    req.onsuccess = () => {
      const res = req.result;

      if (!returner) return resolve();

      const newReq = store.get(res);
      newReq.onerror = () => reject(newReq.error);

      newReq.onsuccess = () => {
        const { type, props } = newReq.result;
        const obj = { [relationship.as]: { ...props, _id: res, type } };
        resolve(obj);
      };
    };
  });
}
