import Property from "./Property";
import { StringOrSchemaObject, Schema } from "./types";

export default class Model<T = {}> {
  primaryKey = "id";
  unique: string[] = [];
  indexed: string[] = [];
  properties = new Map<string, Property>();

  constructor(public name: string, public schema: Schema) {
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
