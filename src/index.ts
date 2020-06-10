import Metro from "./metro";
import q from "./query/query";
import { assign } from "./services/match/match";

const createQuery = q`CREATE``(u:User ${{
  name: "John " + num(),
}})``[r:LIKES]``(b:Book ${{
  title: "Hare " + num(),
}})`;

const mergeQuery = q`MERGE``(u:User ${{ _id: 1 }})``[r:LIKES]``(b:Book ${{
  _id: 1,
}})`;

(async function () {
  const metro = new Metro("db", 1);

  metro.model("User", {
    name: "string",
  });

  metro.model("Book", {
    title: "string",
  });

  await metro.connect();

  // const matchQuery1 = q`MATCH``(u:User ${{ _id: 1 }})``[r]``(b)`;
  // const matchQuery2 = q`MATCH``(b:Book ${{ _id: 2 }})``[r]``(b)`;

  // const [res1, res2] = await metro.batch([matchQuery1, matchQuery2], {
  //   return: ["u", "b"],
  // });

  // const user = res1[0]["u"];
  // const book = res2[0]["b"];
  // // const user2 = res2[0]["u"];

  // console.log(user, book);

  // console.time("start");

  // const matchQuery = q`MATCH``(u:User)``[r:LIKES]``(b:Book)`;

  // const matchRes = await metro.exec(matchQuery, {
  //   skip: 3,
  //   limit: 3,
  //   rawLimit: 2,
  //   // delete: ["u"],
  //   // orderBy: {
  //   //   type: "DESC",
  //   //   key: ["u.name", "b.title"],
  //   // },
  //   return: ["u", "r", "b"],
  // });

  // console.timeEnd("start");

  // console.log(matchRes);

  // const createRes = await metro.exec(createQuery, {
  //   return: ["u", "b"],
  // });

  // const user = createRes["u"];
  // const book = createRes["b"];

  // const relateQuery = q`RELATE``(u:User ${user})``[r:HATES]``(b:Book ${book})`;

  // const relateRes = await metro.exec(relateQuery, {
  //   return: ["r"],
  // });

  // console.log(relateRes);

  const mergeRes = await metro.exec(mergeQuery);
})();

function num() {
  return Math.floor(Math.random() * 10);
}
