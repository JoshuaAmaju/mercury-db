import { Relationship } from "../services/types";
import { SchemaType, WeBaseFunction } from "../types";
import { Returner, ReturnOperator } from "./../services/types";
import { WeBaseRecord } from "./../types";

export const relationStoreName = "relationships";

export const has = Object.prototype.hasOwnProperty;

export function isFunc(value: unknown): value is WeBaseFunction {
  return typeof value === "function";
}

export function isEmptyObj(obj: WeBaseRecord): boolean {
  return Object.keys(obj).length <= 0;
}

export function toReturn(returner: ReturnOperator["return"]): Returner[] {
  const type = returner as Returner;
  if (typeof returner === "string" || isFunc(returner)) return [type];
  if (Array.isArray(returner)) return returner;
}

export function toSchemaType(schema: string | SchemaType): SchemaType {
  return typeof schema === "string" ? { type: schema } : schema;
}

export function getStores(...names: string[]): string[] {
  return names.filter((name) => name);
}

export function getProps(relation: Relationship): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, to, end, start, from, type, ...props } = relation;
  return props;
}

/**
 * Searchs for any key that is indexed in the
 * database, and return the key and value.
 */
export function indexedKeyValue(
  store: IDBObjectStore,
  object: WeBaseRecord = {}
): [string, unknown] {
  let key: string;
  let value: unknown;
  const indexes = store.indexNames;

  for (const k in object) {
    if (indexes.contains(k)) {
      [key, value] = [k, object[k]];
      break;
    }
  }

  return [key, value];
}
