export interface SchemaObject {
  hidden?: boolean;
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

export interface SchemaManager {
  drop(): Promise<any>;
  install(): Promise<any>;
  deleteDB(): Promise<any>;
  delete(model: string): void;
}
