export interface SchemaObject {
  unique?: boolean;
  primary?: boolean;
  indexed?: boolean;
  required?: boolean;
  type: "uuid" | string;
  default?: any | (() => any);
}

export type StringOrSchemaObject = "null" | string | SchemaObject;

export interface Schema {
  [key: string]: StringOrSchemaObject;
}

export type WhereHandler = (...args: object[]) => boolean;

export interface QueryOperators {
  skip?: number;
  limit?: number;
  return?: string[];
  delete?: string[];
  where?: WhereHandler;
  set?: Record<string, any>;
}

export interface Relationship {
  id: any;
  end: any;
  start: any;
  to: string;
  from: string;
  type: string;
  props: object;
}

export type Updater = {
  value: object;
  label: string;
  primary?: { key: string; value: any };
};
