import Property from "./Property";
import { Schema, StringOrSchemaObject } from "./types";

const defaultPrimary = {
  unique: true,
  indexed: true,
  primary: true,
  type: "string",
};

export default class Model {
  primaryKey = "_id";
  unique: string[] = [];
  indexed: string[] = [];
  properties = new Map<string, Property>();

  constructor(public name: string, public schema: Schema) {
    schema = {
      ...schema,
      [this.primaryKey]: defaultPrimary,
    };

    Object.keys(schema).forEach((key) => {
      this.addProperty(key, schema[key]);
    });
  }

  private addProperty(key: string, schema: StringOrSchemaObject) {
    const property = new Property(key, schema);

    if (property.isPrimary()) this.primaryKey = key;

    if (property.isIndexed()) this.indexed.push(key);

    if (property.isUnique() || property.isPrimary()) this.unique.push(key);

    this.properties.set(key, property);

    return this;
  }
}
