import { WeBaseRecord } from "../../types";
import { ReturnOperator, Properties } from "../types";
import { Action } from "../../query/types";
import { toReturn } from "./utils";

function toParts(string: string) {
  return string.split("AS").map((s) => s.trim());
}

export default function returnFormatter<T extends WeBaseRecord<Properties>>(
  obj: T,
  returner: ReturnOperator["return"]
): T {
  const results: Record<string, unknown> = {};

  /**
   * Gather the return values by their key or alias. e.g
   * initial return object would contain
   * {u: {...}, b: {...}, r: {...}} before grouping.
   * After grouping, it would look like this:
   * {name: ..., u: {...}} etc.
   */

  toReturn(returner).forEach((key) => {
    let as: string | undefined = undefined;
    let variable = key as string | Action;

    if (Array.isArray(key)) {
      variable = key[0] as string;
      as = key[key.length - 1] as string;
    }

    if (typeof variable === "string") {
      const _variable = variable as string;
      const [value, alias] = toParts(variable);
      const [main, target] = value.split(".");
      if (alias) as = alias;

      const object = obj[main];

      if (target && Array.isArray(object)) {
        const res = object.map((o) => o[target]);
        results[as ?? _variable] = res;
      } else {
        results[as ?? _variable] = target ? object[target] : object;
      }
    } else {
      results[as ?? (variable as Action).string()] = variable.exec(obj);
    }
  });

  return results as T;
}
