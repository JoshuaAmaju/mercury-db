import { Relationship, WhereHandler } from "../services/types";
import { SchemaObject } from "../types";

export const relationStoreName = "relationships";

export const has = Object.prototype.hasOwnProperty;

export function isFunc(value: unknown): boolean {
  return typeof value === "function";
}

export function length(obj: Record<string, unknown>): number {
  return Object.keys(obj).length;
}

export function isEmptyObj(obj: Record<string, unknown>): boolean {
  return length(obj) <= 0;
}

export function devUuid(): string {
  return Math.random().toString(16).substr(2);
}

export function toArray<T>(obj: IterableIterator<T>): T[] {
  return Array.from(obj);
}

export function toSchemaObj(schema: string | SchemaObject): SchemaObject {
  return typeof schema === "string" ? { type: schema } : schema;
}

export function getStores(...names: string[]): string[] {
  return names.filter((name) => name);
}

export function toWhere(props: Record<string, unknown>): WhereHandler {
  return (args) => {
    const matches = new Set();

    Object.keys(props).forEach((prop) => {
      matches.add(props[prop] === args[prop]);
    });

    return !matches.has(false) && matches.size > 0;
  };
}

export function getProps(relation: Relationship): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, to, end, start, from, type, ...props } = relation;
  return props;
}
