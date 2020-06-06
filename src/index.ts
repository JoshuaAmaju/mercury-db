import Metro from "./metro";
import q from "./query/query";

const createQuery = q`CREATE``(u:User ${{ name: "John" }})``[r]``(b:Book ${{
  title: "Hare",
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

  // const matchQuery1 = q`MATCH``(u:User ${{ _id: "d27b98f78f4c8" }})``[r]``(b)`;
  // const matchQuery2 = q`MATCH``(u:User ${{ _id: "dadf998f3874b" }})``[r]``(b)`;

  // const [res1, res2] = await metro.batch([matchQuery1, matchQuery2], {
  //   return: ["u"],
  // });

  // const user1 = res1[0]["u"];
  // const user2 = res2[0]["u"];

  // console.log(user1, user2);

  const matchQuery = q`MATCH``(u:User)``[r:LIKES]``(b:User)`;

  const matchRes = await metro.exec(matchQuery, {
    return: ["u", "r"],
  });

  console.log(matchRes);

  // const createRes = await metro.exec(createQuery, {
  //   return: ["u", "b"],
  // });

  // const user = createRes["u"];
  // const book = createRes["b"];

  // const relateQuery = q`RELATE``(u:User ${user2})``[r:LIKES]``(b:User ${user1})`;

  // const relateRes = await metro.exec(relateQuery, {
  //   return: ["r"],
  // });

  // console.log(relateRes);
})();
