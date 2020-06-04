interface QueryNode<T> {
  label: T;
  as: string;
  props?: object;
  primaryKey?: string;
}

interface RelationNode {
  as: string;
  type: string;
  props?: object;
}

export type QueryTypes = "CREATE" | "MATCH" | "MERGE" | "RELATE";

export interface Query<T> {
  type: QueryTypes;
  end?: QueryNode<T>;
  start: QueryNode<T>;
  relationship?: RelationNode;
}
