import { WeBaseRecord } from "../types";

export type QueryTypes = "CREATE" | "MATCH" | "MERGE" | "RELATE";

export interface QueryNode<T, P> {
  label: T;
  props?: P;
  as: string;
}

export interface RelationNode {
  as: string;
  type: string;
  props?: Record<string, unknown>;
}

export interface Query<T, P = Record<string, unknown>> {
  type: QueryTypes;
  end?: QueryNode<T, P>;
  start: QueryNode<T, P>;
  relationship?: RelationNode;
}

export type QueryFunction<T = TemplateStringsArray, K = WeBaseRecord> = (
  a: T,
  b?: K
) => (a: T, b?: K) => (a: T, b?: K) => Query<string>;

export enum Actions {
  SUM = "webase.sum",
  GET = "webase.get",
  LAST = "webase.last",
  COUNT = "webase.count",
  FIRST = "webase.first",
  ASSIGN = "webase.assign",
}

export type ActionExecutor<T, K> = (context: T) => K;

export type AssignerFunction<T> = ActionExecutor<WeBaseRecord, T>;

export type PropAssigner<T = unknown> = Record<string, T | AssignerFunction<T>>;

export type Assigner = AssignerFunction<WeBaseRecord> | PropAssigner;

export type Action<T = unknown, K = unknown> = {
  type: Actions;
  string: () => string;
  exec: ActionExecutor<T, K>;
};
