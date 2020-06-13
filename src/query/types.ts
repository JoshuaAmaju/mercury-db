import { MetroObject } from "../types";

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

export type QueryFunction<T, P = Record<string, unknown>> = (
  string: TemplateStringsArray,
  props?: MetroObject
) => QueryFunction<T, P> | Query<T, P>;
