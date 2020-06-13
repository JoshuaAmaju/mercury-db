import { MetroObject, MatchOperators } from "../types";

export interface UpdateAndOrDelete {
  label: string;
  delete: string[];
  store: IDBObjectStore;
  set: Pick<MatchOperators, "set">;
  ref: Map<string, Record<string, unknown>>;
  relationStore?: IDBObjectStore | IDBIndex;
}

export interface OpenCursor {
  skip?: number;
  limit?: number;
  keyRange?: IDBKeyRange;
  store: IDBObjectStore | IDBIndex;
  onNext: (cursor: IDBCursorWithValue) => unknown;
}

export type AssignerFunction = (context: MetroObject) => MetroObject;

export type PropAssigner = Record<
  string,
  unknown | ((context: MetroObject) => unknown)
>;

export type Assigner = AssignerFunction | PropAssigner;

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
