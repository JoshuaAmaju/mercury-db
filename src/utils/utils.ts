import { SchemaType, WeBaseFunction } from "../types";
import { WeBaseRecord } from "./../types";

export const relationStoreName = "relationships";

export const has = Object.prototype.hasOwnProperty;

export function isFunc(value: unknown): value is WeBaseFunction {
  return typeof value === "function";
}

export function isEmptyObj(obj: WeBaseRecord): boolean {
  return Object.keys(obj).length <= 0;
}

export function toSchemaType(schema: string | SchemaType): SchemaType {
  return typeof schema === "string" ? { type: schema } : schema;
}
