import type { Query, QueryFunction } from "./types";
import type { MercuryRecord } from "../types";

function toParts(str: TemplateStringsArray) {
  return str.join("").trim().slice(1, -1).trim().split(":");
}

export default function q(string: TemplateStringsArray): QueryFunction {
  const query = { type: string[0] } as Query<string>;

  return (strings: TemplateStringsArray, props?: MercuryRecord) => {
    const [as, label] = toParts(strings);
    query.start = { as, label, props };

    return (strings: TemplateStringsArray, props?: MercuryRecord) => {
      const [as, type] = toParts(strings);
      query.relationship = { as, type, props };

      return (strings: TemplateStringsArray, props?: MercuryRecord) => {
        const [as, label] = toParts(strings);
        query.end = { as, label, props };

        return query;
      };
    };
  };
}
