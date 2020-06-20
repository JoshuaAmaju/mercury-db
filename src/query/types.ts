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

export type ActionExecutor<T, K> = (context: T) => K;

export enum Actions {
  SUM = "metro.sum",
  LAST = "metro.last",
  COUNT = "metro.count",
  FIRST = "metro.first",
  ASSIGN = "metro.assign",
}

export type Action<T = unknown, K = unknown> = {
  type: Actions;
  string?: () => string;
  exec: ActionExecutor<T, K>;
};

export type AssignerFunction = (context: WeBaseRecord) => WeBaseRecord;

export type PropAssigner = Record<string, unknown | AssignerFunction>;

export type Assigner = AssignerFunction | PropAssigner;
