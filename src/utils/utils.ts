import type { SchemaType, MercuryFunction } from "../types";
import type { MercuryRecord } from "./../types";

export const relationStoreName = "relationships";

export function isFunc<T, K>(value: unknown): value is MercuryFunction<T, K> {
  return typeof value === "function";
}

export function isEmptyObj(obj: MercuryRecord): boolean {
  return Object.keys(obj).length <= 0;
}

export function toSchemaType(schema: string | SchemaType): SchemaType {
  return typeof schema === "string" ? { type: schema } : schema;
}
