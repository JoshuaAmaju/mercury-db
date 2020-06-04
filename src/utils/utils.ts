import { SchemaObject } from "../types";

export const relationStoreName = "relationships";

export function toArray<T>(obj: IterableIterator<T>) {
  return Array.from(obj);
}

export function toSchemaObj(schema: string | SchemaObject): SchemaObject {
  return typeof schema === "string" ? { type: schema } : schema;
}
