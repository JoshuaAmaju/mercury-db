import { WeBaseRecord } from "./../types";
import Model from "../model";
import { toSchemaType, isFunc } from "./utils";

export default function getDefaultValuesFor<T extends WeBaseRecord>(
  model: Model,
  props: T
): T {
  const schema = model.schema;
  const output: Record<string, unknown> = {};

  for (const key in schema) {
    const value = props[key];
    const _schema = toSchemaType(schema[key]);

    const { hidden } = _schema;
    let defaultValue = _schema.default;

    if (defaultValue) {
      defaultValue = isFunc(defaultValue) ? defaultValue() : defaultValue;
    }

    if (!hidden) output[key] = value ?? defaultValue;
  }

  return { ...props, ...output };
}
