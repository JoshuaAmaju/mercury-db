import { isFunc } from "../utils/utils";
import type { MercuryRecord } from "./../types";
import { Actions } from "./types";
import type { Action, Assigner } from "./types";

/**
 * Assigns new values/updates to the object found
 * in the database during a match query.
 */
export function assign<T extends MercuryRecord>(
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
        (output as MercuryRecord)[key] = isFunc(value) ? value(obj) : value;
      }

      return output;
    },
  };
}

export function count(
  label: string,
  distinct = false
): Action<MercuryRecord<MercuryRecord>, number> {
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
): Action<MercuryRecord<MercuryRecord>, string[]> {
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `keys(${label})`,
    exec(args) {
      let obj = args[main];
      if (target) obj = obj[target] as MercuryRecord;
      return Object.keys(obj);
    },
  };
}

export function values(
  label: string
): Action<MercuryRecord<MercuryRecord>, unknown[]> {
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `values(${label})`,
    exec(args) {
      let obj = args[main];
      if (target) obj = obj[target] as MercuryRecord;
      return Object.values(obj);
    },
  };
}
