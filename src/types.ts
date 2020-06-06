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
