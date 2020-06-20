import { WeBaseRecord } from "./../types";
import { Action } from "../query/types";

export type Identity = string | number;

export interface Properties {
  _id: Identity;
  [key: string]: unknown;
}

export type WhereHandler = (...args: Properties[]) => boolean;

export type ReturnType = string | Action;

export type Returner = ReturnType | ReturnType[];

export type ReturnOperator = {
  return?: ReturnType | Returner[];
};

export type CreateOperators = ReturnOperator;

export type MatchOperators = ReturnOperator & {
  skip?: number;
  limit?: number;
  rawLimit?: number;
  delete?: string[];
  where?: WhereHandler;
  orderBy?: {
    type?: "ASC" | "DESC";
    key: string | string[];
  };
  set?: Record<string, Action<WeBaseRecord, WeBaseRecord>>;
};

export type MergeOperators = ReturnOperator & {
  onMatch?: Record<string, Action<WeBaseRecord, WeBaseRecord>>;
  onCreate?: Record<string, Action<WeBaseRecord, WeBaseRecord>>;
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
