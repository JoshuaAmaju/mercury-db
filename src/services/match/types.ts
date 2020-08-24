import type { Setter, Properties } from "../types";
import type { MercuryRecord } from "../../types";

export interface UpdateAndOrDelete {
  set?: Setter;
  label: string;
  delete?: string[];
  store: IDBObjectStore;
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

export type MatchResult<T = unknown> = MercuryRecord<Properties<T>>;
