import Model from "../model";
import { toSchemaObj, isFunc } from "./utils";

export default function getDefaultValuesFor<T extends Record<string, unknown>>(
  model: Model,
  props: T
): T {
  const output = {};
  const schema = model.schema;

  for (const key in schema) {
    const value = props[key];
    const _schema = toSchemaObj(schema[key]);

    const { hidden } = _schema;
    let defaultValue = _schema.default;

    if (defaultValue) {
      defaultValue = isFunc(defaultValue) ? defaultValue() : defaultValue;
    }

    if (!hidden) output[key] = value ?? defaultValue;
  }

  return { ...props, ...output };
}
