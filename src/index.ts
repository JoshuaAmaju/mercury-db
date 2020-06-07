import Metro from "./metro";
import q from "./query/query";

const createQuery = q`CREATE``(u:User ${{
  name: "John",
}})``[r:LIKES ${{ since: 123 }}]``(b:Book ${{
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

  // const matchQuery1 = q`MATCH``(u:User ${{ _id: 1 }})``[r]``(b)`;
  // const matchQuery2 = q`MATCH``(b:Book ${{ _id: 2 }})``[r]``(b)`;

  // const [res1, res2] = await metro.batch([matchQuery1, matchQuery2], {
  //   return: ["u", "b"],
  // });

  // const user = res1[0]["u"];
  // const book = res2[0]["b"];
  // // const user2 = res2[0]["u"];

  // console.log(user, book);

  const matchQuery = q`MATCH``(u:User)``[r]``(b)`;

  const matchRes = await metro.exec(matchQuery, {
    // skip: 3,
    // limit: 1,
    // delete: ["u"],
    // set: {
    //   r: { name2: "Sample 2" },
    // },
    return: ["u.name"],
  });

  console.log(matchRes);

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
})();
