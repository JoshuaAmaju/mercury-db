import { Query } from "./query/types";
import Emitter, { Listener } from "./Emitter";

type RequestProps = {
  query: object;
};

type ResponseProps = {
  result: any;
  query: object;
};

export type Events =
  | (RequestProps & { type: "request" })
  | (ResponseProps & { type: "response" });

type RequestListener = Listener<RequestProps>;

type ResponseListener = Listener<ResponseProps>;

export default class Interceptor {
  private emitter = new Emitter<Events>();

  request(fn: RequestListener) {
    this.emitter.on("request", fn);
  }

  response(fn: ResponseListener) {
    this.emitter.on("response", fn);
  }

  send(type: Events["type"], _query: Query<string>, result?: any) {
    const { end, start, relationship } = _query;

    const query = {
      type: _query.type,
      [end.label]: end.props,
      [start.label]: start.props,
      [relationship.type]: relationship.props,
    };

    // if (type === "request") {
    //   const res = this.emitter.send({ type, query }) as RequestProps;
    //   return res?.query;
    // }

    // if (type === "response") {
    //   const res = this.emitter.send({
    //     type,
    //     query,
    //     result,
    //   }) as ResponseProps;

    //   return res.result;
    // }
  }
}
