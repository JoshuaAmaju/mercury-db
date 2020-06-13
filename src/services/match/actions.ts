import { Assigner, Action, Actions } from "./types";
import { isFunc } from "../../utils/utils";

/**
 * Assigns new values/updates to the object found
 * in the database during a match query.
 */
export function assign(assigner: Assigner): Action {
  const exec = (obj: object) => {
    if (typeof assigner === "function") return assigner(obj);

    const output = { ...obj };

    for (const key in assigner) {
      const value = assigner[key];
      output[key] = isFunc(value) ? value(obj) : value;
    }

    return output;
  };

  return {
    exec,
    type: Actions.ASSIGN,
  };
}

export function count(label: string, distinct = false): Action {
  const counted = [];
  const countedUnique = new Set();
  const [main, target] = label.split(".");

  const exec = (args: object) => {
    const obj = args[main];

    if (obj) {
      let value: any;

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
  };

  return {
    exec,
    type: Actions.COUNT,
    string: () => `count(${label})`,
  };
}

export function keys(label: string): Action {
  const [main, target] = label.split(".");

  const exec = (args: object) => {
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

  const exec = (args: object) => {
    let obj = args[main];
    if (target) obj = obj[target];
    return Object.values(obj);
  };

  return {
    exec,
    type: Actions.COUNT,
    string: () => `values(${label})`,
  };
}
