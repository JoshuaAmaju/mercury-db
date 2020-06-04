import { SchemaObject } from "../types";

export const relationStoreName = "relationships";

export const has = Object.prototype.hasOwnProperty;

export function isFunc(value: any) {
  return typeof value === "function";
}

export function isEmptyObj(obj: object) {
  return Object.keys(obj).length <= 0;
}

export function devUuid() {
  return Math.random().toString(16).substr(2);
}

export function toArray<T>(obj: IterableIterator<T>) {
  return Array.from(obj);
}

export function toSchemaObj(schema: string | SchemaObject): SchemaObject {
  return typeof schema === "string" ? { type: schema } : schema;
}
