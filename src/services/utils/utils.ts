import type { MercuryRecord } from "../../types";
import type {
  Relationship,
  ReturnOperator,
  Returner,
  Properties,
} from "../types";
import { isFunc, relationStoreName } from "../../utils/utils";
import type { Query } from "../../query/types";

export function getStores(...names: (string | undefined)[]): string[] {
  return names.filter((name) => name) as string[];
}

export function getProps(relation: Relationship): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, to, end, start, from, type, ...props } = relation;
  return props;
}

export function toReturn(returner: ReturnOperator["return"]): Returner[] {
  const type = returner as Returner;
  if (typeof returner === "string" || isFunc(returner)) return [type];
  return returner as Returner[];
}

/**
 * Searchs for any key that is indexed in the
 * database, and return the key and value.
 */
export function indexedKeyValue(
  store: IDBObjectStore,
  object: MercuryRecord = {}
): [string | undefined, unknown] {
  let value: unknown;
  let key: string | undefined;
  const indexes = store.indexNames;

  for (const k in object) {
    if (indexes.contains(k)) {
      [key, value] = [k, object[k]];
      break;
    }
  }

  return [key, value];
}

export function relateHelper(
  tx: IDBTransaction,
  query: Required<Query<string>>,
  startId: unknown,
  endId: unknown
): Promise<Properties> {
  const { end, start, relationship } = query;

  const _relation = {
    end: endId,
    to: end.label,
    start: startId,
    from: start.label,
    type: relationship.type,
    ...relationship.props,
  };

  return new Promise((resolve, reject) => {
    const relationReq = tx.objectStore(relationStoreName).put(_relation);

    relationReq.onerror = () => reject(relationReq.error);

    relationReq.onsuccess = () => {
      resolve((relationReq.result as unknown) as Properties);
    };
  });
}
