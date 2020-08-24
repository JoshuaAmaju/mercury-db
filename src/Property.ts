import type { SchemaType, StringOrSchemaType } from "./types";
import { toSchemaType } from "./utils/utils";

export default class Property {
  constructor(public name: string, private schema: StringOrSchemaType) {
    this.schema = toSchemaType(schema);
  }

  getSchema(): SchemaType {
    return this.schema as SchemaType;
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
