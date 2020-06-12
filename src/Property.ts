import { SchemaObject } from "./types";
import { toSchemaObj } from "./utils/utils";

export default class Property {
  constructor(public name: string, private schema: string | SchemaObject) {
    this.schema = toSchemaObj(schema);
  }

  getSchema() {
    return this.schema as SchemaObject;
  }

  getType() {
    return this.getSchema().type;
  }

  isPrimary() {
    return this.getSchema().primary ?? false;
  }

  isUnique() {
    return this.getSchema().unique ?? false;
  }

  isRequired() {
    return this.getSchema().required ?? false;
  }

  isIndexed() {
    return this.getSchema().indexed ?? false;
  }

  isNullType() {
    return this.getType() === "null";
  }
}
