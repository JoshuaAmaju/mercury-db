function toParts(string: string) {
  return string.split("AS").map((s) => s.trim());
}

export default function returnFormatter(obj: object, returner: string[]) {
  const results = {};

  /**
   * Gather the return values by
   * their key or alias. e.g
   * initial return object would contain
   * {u: {...}, b: {...}, r: {...}} before grouping.
   * After grouping, it would look like this:
   * {name: ..., u: {...}} etc.
   */
  returner.forEach((key) => {
    const [variable, as] = toParts(key);
    const [main, target] = variable.split(".");

    const object = obj[main];

    if (target && Array.isArray(object)) {
      const res = object.map((o) => o[target]);
      results[as ?? variable] = res;
    } else {
      results[as ?? variable] = target ? object[target] : object;
    }
  });

  return results;
}
