import { Properties, Relationship } from "../types";

export interface FoundNode extends Properties {
  relations?: Relationship[];
}

export interface FoundNodes {
  [key: string]: FoundNode;
}

export interface UpdateAndOrDelete {
  set: object;
  label: string;
  delete: string[];
  refObj: FoundNodes;
  store: IDBObjectStore;
}
