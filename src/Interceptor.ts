import { Query } from "./query/types";
import Emitter, { Listener } from "./Emitter";

export type Events =
  | {
      query: object;
      type: "request";
    }
  | {
      result: any;
      type: "response";
      query: object;
    };

export default class Interceptor {
  emitter = new Emitter<Events>();

  request(fn: Listener) {
    this.emitter.subscribe("request", fn);
  }

  response(fn: Listener) {
    this.emitter.subscribe("response", fn);
  }

  send(type: Events["type"], query: Query<string>, result?: any) {
    const { end, start, relationship } = query;

    const modifiedQuery = {
      [end.label]: end.props,
      [start.label]: start.props,
      [relationship.type]: relationship.props,
    };

    if (type === "request") {
      this.emitter.send({ type, query: modifiedQuery });
    }

    if (type === "response") {
      this.emitter.send({ type, query: modifiedQuery, result });
    }
  }
}
