import q from "./query/query";
import { count, first, last, sum } from "./utils/actions";
import WeBase from "./WeBase";
import { WeBaseRecord } from "./types";

(async () => {
  const db = new WeBase("db", 1);

  db.model("User", {
    name: {
      indexed: true,
      type: "string",
    },
  });

  db.model("Book", {
    title: {
      indexed: true,
      type: "string",
    },
  });

  db.onUpgrade(async ({ schema }) => {
    await schema.install();
  });

  await db.connect();

  const name = `John ${Math.random() * 10}`;
  const createQuery = q`CREATE``(u:User ${{ name }})``[]``()`;
  const createQuery2 = q`CREATE``(b:Book ${{ title: name }})``[]``()`;

  const createRes = await db.exec(createQuery, { return: ["u"] }) as WeBaseRecord<WeBaseRecord>;
  const createRes2 = await db.exec(createQuery2, { return: "b" }) as WeBaseRecord<WeBaseRecord>;

  const relateQuery = q`RELATE``(b:User ${createRes["u"]})``[r:HAS]``(b:Book ${createRes2["b"]})`;
  const relateRes = await db.exec(relateQuery, { return: ["u", "b", "r"] });

  console.log(createRes, createRes2, relateRes);
})();

function openDB(name: string, version: number): WeBase {
  const db = new WeBase(name, version);

  //   db.onUpgrade(async ({ schema }) => {
  //     await schema.install();
  //   });

  //   db.onBlocked(() => {
  //     alert("Another version of this website is preventing an update.");
  //   });

  //   db.onVersionChange(() => {
  //     const message = "There is a new version, press ok to reload.";
  //     if (confirm(message)) location.reload();
  //   });

  return db;
}

export default WeBase;
export { q, sum, last, first, count, openDB };
