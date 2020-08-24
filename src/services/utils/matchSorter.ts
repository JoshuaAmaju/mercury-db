import type { MatchResult } from "../match/types";

/**
 * Sort array containing match results,
 * e.g [{b: {...}, u: {...}}]
 * To be able to sort the whole array by
 * the key values in the individual objects.
 * Key param example: u.name, sorts the array by the
 * name key on the u object.
 */
export function sortAscendingBy<T extends MatchResult<string | number>>(
  values: T[],
  key: string
): T[] {
  const arr = [...values];
  const [main, target] = key.split(".");

  arr.sort((a, b) => {
    const objA = a[main];
    const objB = b[main];

    if (objA[target] > objB[target]) return 1;
    if (objA[target] < objB[target]) return -1;
    return 0;
  });

  return arr;
}

export function sortDescendingBy<T extends MatchResult<string | number>>(
  values: T[],
  key: string
): T[] {
  const arr = [...values];
  const [main, target] = key.split(".");

  arr.sort((a, b) => {
    const objA = a[main];
    const objB = b[main];

    if (objA[target] < objB[target]) return 1;
    if (objA[target] > objB[target]) return -1;
    return 0;
  });

  return arr;
}
