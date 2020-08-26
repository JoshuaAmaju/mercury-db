import { q, Mercury } from "../dist/index";
import { assign } from "../dist/actions";

(async () => {
  const db = new Mercury("example", 1);

  const Users = db.model("User", {
    age: "number",
    name: "string",
  });

  const Books = db.model("Book", {
    isbn: "number",
    title: "string",
  });

  db.onUpgrade(async ({ schema }) => {
    await schema.install();
  });

  await db.connect();

  const user = {
    name: "Jonh Doe",
    age: Math.random() * 10,
  };

  const book = {
    user,
    isbn: Math.random() * 1000,
    title: "The personal history of David Copperfield",
  };

  // const createQuery = q`CREATE``(u:User ${user})``[:LIKES]``(b:Book ${book})`;

  // const createRes = await db.exec(createQuery, { return: ["u", "b"] });

  // console.log(createRes);

  const matchQuery = q`MATCH``(u:User)``[:LIKES]``(b:Book)`;

  const matchRes = await db.exec(matchQuery, {
    where: (user, book) => {
      return book._id === 11;
    },
    // delete: ["b"],
    set: {
      b: assign({ isbn: 4 }),
    },
    return: ["u", "b"],
  });

  console.log(matchRes);
})();
