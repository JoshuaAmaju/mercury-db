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

  const matchQuery = q`MATCH``(u:User)``[r:LIKES]``(b:Book)`;

  const matchRes = await metro.exec(matchQuery, {
    return: ["u", "r"],
  });

  console.log(matchRes);

  // const createRes = await metro.exec(createQuery, {
  //   return: ["u", "b"],
  // });

  // const user = createRes["u"];
  // const book = createRes["b"];

  // const relateQuery = q`RELATE``(u:User ${user})``[r:LIKES]``(b:Book ${book})`;

  // const relateRes = await metro.exec(relateQuery, {
  //   return: ["r"],
  // });

  // console.log(createRes, relateRes);
})();
