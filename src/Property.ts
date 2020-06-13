import { SchemaObject } from "./types";
import { toSchemaObj } from "./utils/utils";

export default class Property {
  constructor(public name: string, private schema: string | SchemaObject) {
    this.schema = toSchemaObj(schema);
  }

  getSchema(): SchemaObject {
    return this.schema as SchemaObject;
  }

  getType(): string {
    return this.getSchema().type;
  }

  isPrimary(): boolean {
    return this.getSchema().primary ?? false;
  }

  isUnique(): boolean {
    return this.getSchema().unique ?? false;
  }

  isRequired(): boolean {
    return this.getSchema().required ?? false;
  }

  isIndexed(): boolean {
    return this.getSchema().indexed ?? false;
  }

  isNullType(): boolean {
    return this.getType() === "null";
  }
}
