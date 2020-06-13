export type MetroObject = Record<string, unknown>;

export interface SchemaObject {
  hidden?: boolean;
  unique?: boolean;
  primary?: boolean;
  indexed?: boolean;
  required?: boolean;
  type: "uuid" | string;
  default?: unknown | (() => unknown);
}

export type StringOrSchemaObject = "null" | string | SchemaObject;

export interface Schema {
  [key: string]: StringOrSchemaObject;
}

export interface SchemaManager {
  drop(): Promise<unknown>;
  install(): Promise<unknown>;
  delete(model: string): void;
  deleteDB(): Promise<unknown>;
}
