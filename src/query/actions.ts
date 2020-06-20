import { WeBaseRecord } from "./../types";
import { isFunc } from "../utils/utils";
import { Assigner, Action, Actions } from "./types";

/**
 * Assigns new values/updates to the object found
 * in the database during a match query.
 */
export function assign(assigner: Assigner): Action<WeBaseRecord, WeBaseRecord> {
  return {
    type: Actions.ASSIGN,
    exec(obj) {
      if (isFunc(assigner)) return assigner(obj);

      const output = { ...obj };

      for (const key in assigner) {
        const value = assigner[key];
        output[key] = isFunc(value) ? value(obj) : value;
      }

      return output;
    },
  };
}

export function count(label: string, distinct = false): Action {
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

export function keys(label: string): Action {
  const [main, target] = label.split(".");

  const exec = (args: Record<string, unknown>) => {
    let obj = args[main];
    if (target) obj = obj[target];
    return Object.keys(obj);
  };

  return {
    exec,
    type: Actions.COUNT,
    string: () => `keys(${label})`,
  };
}

export function values(label: string): Action {
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `values(${label})`,
    exec(args) {
      let obj = args[main];
      if (target) obj = obj[target];

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return Object.values(obj);
    },
  };
}
