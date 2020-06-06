export type QueryTypes = "CREATE" | "MATCH" | "MERGE" | "RELATE";

export interface QueryNode<T, P> {
  label: T;
  props?: P;
  as: string;
}

export interface RelationNode {
  as: string;
  type: string;
  props?: object;
}

export interface Query<T, P> {
  type: QueryTypes;
  end?: QueryNode<T, P>;
  start: QueryNode<T, P>;
  relationship?: RelationNode;
}
