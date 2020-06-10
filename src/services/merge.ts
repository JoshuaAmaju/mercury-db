import { Query } from "../query/types";
import { MergeOperators, MatchOperators } from "./types";
import match from "./match/match";

export default async function merge(
  db: IDBDatabase,
  query: Query<string>,
  operators: MergeOperators = {}
) {
  const returner = operators.return;
  const { onMatch, onCreate } = operators;

  const newOperators: MatchOperators = {
    return: returner,
  };

  if (onMatch) newOperators.set = { ...onMatch };

  const matchRes = await match(db, query, newOperators);

  console.log(matchRes);
}
