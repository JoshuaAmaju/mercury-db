import { MatchOperators } from "../types";

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
