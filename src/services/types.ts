export type WhereHandler = (...args: object[]) => boolean;

export type ReturnOperator = {
  return?: string[];
};

export type CreateOperators = ReturnOperator;

export type MergeOperators = ReturnOperator & {
  onMatch?: object;
  onCreate?: object;
};

export type MatchOperators = ReturnOperator & {
  skip?: number;
  limit?: number;
  delete?: string[];
  where?: WhereHandler;
  set?: Record<string, any>;
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
