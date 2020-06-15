import { MetroObject } from "../types";
import { Action } from "../query/types";

export type WhereHandler = (...args: Record<string, unknown>[]) => boolean;

export type ReturnType = string | Action;

export type ReturnOperator = {
  return?: (ReturnType | ReturnType[])[];
};

export type CreateOperators = ReturnOperator;

export type MergeOperators = ReturnOperator & {
  onMatch?: Record<string, Action>;
  onCreate?: Record<string, Action>;
};

export type MatchOperators = ReturnOperator & {
  skip?: number;
  limit?: number;
  rawLimit?: number;
  delete?: string[];
  where?: WhereHandler;
  set?: Record<string, Action<MetroObject, MetroObject>>;
  orderBy?: {
    type?: "ASC" | "DESC";
    key: string | string[];
  };
};

export type QueryOperators = CreateOperators & MatchOperators & MergeOperators;

export interface Relationship {
  to: string;
  from: string;
  type: string;
  end?: unknown;
  start: unknown;
  [key: string]: unknown;
}

export interface Properties {
  _id: string | number;
  [key: string]: unknown;
}
