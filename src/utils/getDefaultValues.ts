import Model from "../model";
import { toSchemaObj, devUuid, isFunc } from "./utils";

export default function getDefaultValuesFor(model: Model, props: object) {
  const output = {};
  const schema = model.schema;

  for (const key in schema) {
    const value = props[key];
    let { type, default: defaultVal } = toSchemaObj(schema[key]);

    if (type === "uuid") defaultVal = devUuid;

    if (defaultVal) {
      defaultVal = isFunc(defaultVal) ? defaultVal() : defaultVal;
    }

    output[key] = value ?? defaultVal;
  }

  return { ...props, ...output };
}
