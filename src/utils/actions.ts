import { WeBaseRecord } from "./../types";
import { Action, Actions } from "../query/types";

function getValue(arg: WeBaseRecord, main: string, target: string) {
  let value: unknown;

  const obj = arg[main];

  if (obj) {
    if (!target) {
      value = obj;
    } else {
      value = obj[target];
    }
  }

  return value;
}

export function count(label: string, distinct = false): Action {
  const counted = [];
  const uniqueCounted = new Set();
  const [main, target] = label.split(".");

  const exec = (args: WeBaseRecord[]) => {
    args.forEach((arg) => {
      const value = getValue(arg, main, target);

      if (value) {
        counted.push(value);
        uniqueCounted.add(value);
      }
    });

    return distinct ? uniqueCounted.size : counted.length;
  };

  return {
    exec,
    type: Actions.COUNT,
    string: () => `count(${label})`,
  };
}

export function sum(label: string, distinct = false): Action {
  const sum = [];
  const uniqueSum = new Set();
  const [main, target] = label.split(".");

  const exec = (args: WeBaseRecord[]) => {
    args.forEach((arg) => {
      const value = getValue(arg, main, target);

      if (value) {
        sum.push(value);
        uniqueSum.add(value);
      }
    });

    const arr = distinct ? [...uniqueSum.values()] : sum;

    return arr.reduce((prev, curr) => prev + curr);
  };

  return {
    exec,
    type: Actions.SUM,
    string: () => `sum(${label})`,
  };
}

export function last(label?: string): Action {
  const [main, target] = label?.split(".") ?? [];

  const exec = (args: WeBaseRecord[]) => {
    const obj = args[args.length - 1];
    const value = getValue(obj, main, target);
    return value ?? obj;
  };

  return {
    exec,
    type: Actions.LAST,
    string: () => `last(${label ?? ""})`,
  };
}

export function first(label?: string): Action {
  const [main, target] = label?.split(".") ?? [];

  const exec = (args: WeBaseRecord[]) => {
    const obj = args[0];
    const value = getValue(obj, main, target);
    return value ?? obj;
  };

  return {
    exec,
    type: Actions.FIRST,
    string: () => `first(${label ?? ""})`,
  };
}
