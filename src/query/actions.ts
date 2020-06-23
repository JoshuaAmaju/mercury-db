import { isFunc } from "../utils/utils";
import { WeBaseRecord } from "./../types";
import { Action, Actions, Assigner } from "./types";

/**
 * Assigns new values/updates to the object found
 * in the database during a match query.
 */
export function assign<T extends WeBaseRecord>(
  assigner: Assigner
): Action<T, T> {
  return {
    type: Actions.ASSIGN,
    string: () => "assign()",
    exec(obj) {
      if (isFunc<T, T>(assigner)) return assigner(obj);

      const output = { ...obj };

      for (const key in assigner) {
        const value = (assigner as T)[key];
        (output as WeBaseRecord)[key] = isFunc(value) ? value(obj) : value;
      }

      return output;
    },
  };
}

export function count(
  label: string,
  distinct = false
): Action<WeBaseRecord<WeBaseRecord>, number> {
  const counted = [];
  const countedUnique = new Set();
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `count(${label})`,
    exec(args) {
      const obj = args[main];

      if (obj) {
        let value: unknown;

        if (!target) {
          value = obj;
        } else {
          value = obj[target];
        }

        if (value) {
          counted.push(value);
          countedUnique.add(value);
        }
      }

      return distinct ? countedUnique.size : counted.length;
    },
  };
}

export function keys(
  label: string
): Action<WeBaseRecord<WeBaseRecord>, string[]> {
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `keys(${label})`,
    exec(args) {
      let obj = args[main];
      if (target) obj = obj[target] as WeBaseRecord;
      return Object.keys(obj);
    },
  };
}

export function values(
  label: string
): Action<WeBaseRecord<WeBaseRecord>, unknown[]> {
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `values(${label})`,
    exec(args) {
      let obj = args[main];
      if (target) obj = obj[target] as WeBaseRecord;
      return Object.values(obj);
    },
  };
}
