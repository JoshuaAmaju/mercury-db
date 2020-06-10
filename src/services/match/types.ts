export interface UpdateAndOrDelete {
  label: string;
  delete: string[];
  store: IDBObjectStore;
  ref: Map<string, object>;
  set: Record<string, Assigner>;
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

export type AssignerHelper = AssignerFunction | PropAssigner;

export type Assigner = {
  type: "assign";
  exec: AssignerFunction;
};
