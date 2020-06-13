import { Action } from "./match/types";

export type WhereHandler = (...args: object[]) => boolean;

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
  set?: Record<string, Action>;
  orderBy?: {
    type?: "ASC" | "DESC";
    key: string | string[];
  };
};

export type QueryOperators = CreateOperators & MatchOperators & MergeOperators;

export interface Relationship {
  end?: any;
  start: any;
  to: string;
  from: string;
  type: string;
  [key: string]: any;
}

export interface Properties {
  _id: number;
  [key: string]: any;
}
