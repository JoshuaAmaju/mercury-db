import type { Query } from "../query/types";
import returnFormatter from "./utils/returnFormatter";
import type { Properties, ReturnOperator } from "./types";
import { relationStoreName } from "../utils/utils";
import { getProps, relateHelper } from "./utils/utils";

export default async function relate(
  db: IDBDatabase,
  query: Required<Query<string, Properties>>,
  operators?: ReturnOperator
): Promise<Record<string, Properties> | undefined> {
  const returner = operators?.return;
  const { end, start, relationship } = query;
  const { type } = relationship;

  const endPrimaryKey = end.props?._id;
  const startPrimaryKey = start.props?._id;

  const tx = db.transaction(relationStoreName, "readwrite");

  const res = ((await relateHelper(
    tx,
    query,
    startPrimaryKey,
    endPrimaryKey
  )) as unknown) as IDBValidKey;

  if (!returner) return;

  return new Promise((resolve, reject) => {
    const store = tx.objectStore(relationStoreName);
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
  });
}
