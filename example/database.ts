import { Todo } from "./types";
import { v4 as uuid } from "uuid";
import { assign } from "../src/query/actions";
import Metro, { q } from "../src/index";

const metro = new Metro("example", 1);

metro.model<Todo>("Todo", {
  title: {
    indexed: true,
    type: "string",
  },
  id: {
    unique: true,
    indexed: true,
    type: "string",
    default: () => uuid(),
  },
  status: {
    indexed: true,
    type: "string",
    default: "uncompleted",
  },
});

export { q, assign };
export default metro;
