export interface UpdateAndOrDelete {
  label: string;
  delete: string[];
  store: IDBObjectStore;
  ref: Map<string, object>;
  set: Record<string, Action>;
  relationStore?: IDBObjectStore | IDBIndex;
}

export interface OpenCursor {
  skip?: number;
  limit?: number;
  keyRange?: IDBKeyRange;
  store: IDBObjectStore | IDBIndex;
  onNext: (cursor: IDBCursorWithValue) => any;
}

export type AssignerFunction = (context: object) => object;

export type PropAssigner = Record<string, any | ((context: object) => any)>;

export type Assigner = AssignerFunction | PropAssigner;

export type ActionExecutor<T, K> = (context: T) => K;

export enum Actions {
  COUNT = "metro.count",
  ASSIGN = "metro.assign",
}

export type Action<T = any, K = any> = {
  type: Actions;
  string?: () => string;
  exec: ActionExecutor<T, K>;
};
