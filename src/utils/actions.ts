import { Actions } from "../query/types";
import type { Action } from "../query/types";
import type { MercuryRecord } from "./../types";

function getValue<T>(
  arg: MercuryRecord<MercuryRecord>,
  main: string,
  target?: string
): T {
  let value: unknown;

  const obj = arg?.[main];

  if (obj) {
    if (!target) {
      value = obj;
    } else {
      value = obj?.[target];
    }
  }

  return value as T;
}

export function get<
  T,
  P extends MercuryRecord<MercuryRecord<T>>,
  K extends P | P[]
>(label: string): Action<K, MercuryRecord<T> | MercuryRecord<T>[]> {
  return {
    type: Actions.GET,
    string: () => `get(${label})`,
    exec(args) {
      if (Array.isArray(args)) {
        return args.map((arg) => arg[label]);
      }

      return (args as P)[label];
    },
  };
}

export function count(
  label: string,
  distinct = false
): Action<MercuryRecord<MercuryRecord>[], number> {
  const counted = [];
  const uniqueCounted = new Set();
  const [main, target] = label.split(".");

  return {
    type: Actions.COUNT,
    string: () => `count(${label})`,
    exec(args) {
      args.forEach((arg) => {
        const value = getValue(arg, main, target);

        if (value) {
          counted.push(value);
          uniqueCounted.add(value);
        }
      });

      return distinct ? uniqueCounted.size : counted.length;
    },
  };
}

export function sum(
  label: string,
  distinct = false
): Action<MercuryRecord<MercuryRecord>[], number> {
  const sum: number[] = [];
  const uniqueSum = new Set<number>();
  const [main, target] = label.split(".");

  return {
    type: Actions.SUM,
    string: () => `sum(${label})`,
    exec(args) {
      args.forEach((arg) => {
        const value = getValue<number>(arg, main, target);

        if (value) {
          sum.push(value);
          uniqueSum.add(value);
        }
      });

      const arr = distinct ? [...uniqueSum.values()] : sum;

      return arr.reduce((prev, curr) => prev + curr);
    },
  };
}

export function last<T extends MercuryRecord<MercuryRecord>>(
  label?: string
): Action<T[], T> {
  const [main, target] = label?.split(".") ?? [];

  return {
    type: Actions.LAST,
    string: () => `last(${label ?? ""})`,
    exec(args) {
      const obj = args[args.length - 1];
      const value = getValue<T>(obj, main, target);
      return value ?? obj;
    },
  };
}

export function first<T extends MercuryRecord<MercuryRecord>>(
  label?: string
): Action<T[], T> {
  const [main, target] = label?.split(".") ?? [];

  return {
    type: Actions.FIRST,
    string: () => `first(${label ?? ""})`,
    exec(args) {
      const obj = args[0];
      const value = getValue<T>(obj, main, target);
      return value ?? obj;
    },
  };
}
