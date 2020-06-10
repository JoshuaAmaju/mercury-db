import { SchemaObject } from "../types";
import { WhereHandler, Relationship } from "../services/types";

export const relationStoreName = "relationships";

export const has = Object.prototype.hasOwnProperty;

export function isFunc(value: any) {
  return typeof value === "function";
}

export function length(obj: object) {
  return Object.keys(obj).length;
}

export function isEmptyObj(obj: object) {
  return length(obj) <= 0;
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

export function getStores(...names: string[]) {
  return names.filter((name) => name);
}

export function toWhere(props: object): WhereHandler {
  return (args) => {
    let matches = new Set();

    Object.keys(props).forEach((prop) => {
      matches.add(props[prop] === args[prop]);
    });

    return !matches.has(false) && matches.size > 0;
  };
}

export function getProps(relation: Relationship) {
  const { _id, to, end, start, from, type, ...props } = relation;
  return props;
}
