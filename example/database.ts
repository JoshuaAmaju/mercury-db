import { Todo } from "./types";
import { v4 as uuid } from "uuid";
import Metro, { q, assign } from "../src/index";

const metro = new Metro("example", 1);

metro.model<Todo>("Todo", {
  title: {
    indexed: true,
    type: "string",
  },
  id: {
    unique: true,
    type: "strin",
    indexed: true,
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
