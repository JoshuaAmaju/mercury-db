import { WeBaseRecord } from "./../types";
import { Action } from "../query/types";

export type Identity = string | number;

export interface Properties {
  _id: Identity;
  [key: string]: unknown;
}

export type WhereHandler = (...args: Properties[]) => boolean;

export type Setter = Record<string, Action<WeBaseRecord, WeBaseRecord>>;

export type ReturnType = string | Action;

export type Returner = ReturnType | ReturnType[];

export type ReturnOperator = {
  return?: ReturnType | Returner[];
};

export type CreateOperators = ReturnOperator;

export type MatchOperators = ReturnOperator & {
  set?: Setter;
  skip?: number;
  limit?: number;
  rawLimit?: number;
  delete?: string[];
  where?: WhereHandler;
  orderBy?: {
    type?: "ASC" | "DESC";
    key: string | string[];
  };
};

export type MergeOperators = ReturnOperator & {
  onMatch?: Setter;
  onCreate?: Setter;
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
