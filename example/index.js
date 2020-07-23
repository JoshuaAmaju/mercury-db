import { q, WeBase } from "../dist/webase.js";

(async () => {
  const db = new WeBase("example", 1);

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
    isbn: Math.random() * 1000,
    title: "The personal history of David Copperfield",
  };

  // const createQuery = q`CREATE``(u:User ${user})``[:LIKES]``(b:Book ${book})`;

  // const createRes = await db.exec(createQuery, { return: ["u", "b"] });

  // console.log(createRes);

  // const matchQuery = q`MATCH``(u:User)``[:LIKES]``(b:Book)`;

  // const matchRes = await db.exec(matchQuery, {
  //   where: (user, book) => {
  //     return user._id === 2 && book._id === 2;
  //   },
  //   delete: ["u"],
  //   return: ["u", "b"],
  // });
})();
