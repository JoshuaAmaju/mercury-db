import { Query } from "../query/types";
import { MergeOperators, MatchOperators } from "./types";
import match from "./match/match";
import create from "./create";
import Metro from "../metro";
import { length, getStores, has } from "../utils/utils";

function get(tx: IDBTransaction, name: string, key: string): Promise<object> {
  return new Promise((resolve, reject) => {
    const store = tx.objectStore(name);
    const req = store.get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export default async function merge(
  metro: Metro,
  query: Query<string>,
  operators: MergeOperators = {}
) {
  const db = metro.db;
  const returner = operators.return;
  const { onMatch, onCreate } = operators;
  const { end, start, relationship } = query;

  const newOperators: MatchOperators = {
    return: [end.as, start.as, relationship.as],
  };

  if (onMatch) newOperators.set = { ...onMatch };

  const matchRes = await match(db, query, newOperators);

  if (matchRes && matchRes.length > 0) return matchRes;

  if (onCreate) {
    const endProps = end.props as any;
    const startProps = start.props as any;
    const relationProps = relationship.props as any;

    const props = {
      [end.as]: endProps,
      [start.as]: startProps,
      [relationship.as]: relationProps,
    };

    for (const key in onCreate) {
      const prop = props[key];
      props[key] = onCreate[key].exec(prop);
    }

    const stores = getStores(start.label, end.label);
    const tx = db.transaction(stores);

    let newEndProps = {};
    let newStartProps = {};

    /**
     * If the only item in the object is the internal
     * ID, there's no point creating a node that already exist,
     * instead, find the node and merge its values with the new
     * values to avoid empty insertions or overriding existing data
     * in the database with object fields set to undefined.
     */
    if (length(startProps) === 1 && has.call(startProps, "_id")) {
      newStartProps = await get(tx, start.label, startProps._id);
    }

    if (length(endProps) === 1 && has.call(endProps, "_id")) {
      newEndProps = await get(tx, end.label, endProps._id);
    }

    query.relationship.props = props[relationship.as];
    query.end.props = { ...newEndProps, ...props[end.as] };
    query.start.props = { ...newStartProps, ...props[start.as] };
  }

  const createRes = await create(db, query, newOperators);

  if (!returner) return;

  return createRes;
}
