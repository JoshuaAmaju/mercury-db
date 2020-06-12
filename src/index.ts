import Metro from "./metro";
import q from "./query/query";
import { assign } from "./services/match/match";
import Emitter from "./Emitter";
import Interceptor from "./Interceptor";

const createQuery = q`CREATE``(u:User ${{
  name: "John " + num(),
}})``[r:LIKES]``(b:Book ${{
  title: "Hare " + num(),
}})`;

const matchQuery = q`MATCH``(u:User ${{
  _id: "c80e731bfd27c",
}})``[r:LIKES]``(b:Book)`;

const mergeQuery = q`MERGE``(u:User ${{ _id: 101 }})``[r:LIKES ${{
  date: 126,
}}]``(b:Book ${{
  _id: 6,
}})`;

const interceptor = new Interceptor();

interceptor.response(({ query, result }) => {
  const newRes = (result as any[]).concat(1, 2);
  return { query, result: newRes };
});

interceptor.response(({ query, result }) => {
  const newRes = (result as any[]).concat(3, 4);
  return { query, result: newRes };
});

(async function () {
  const metro = new Metro("db", 1);

  metro.model("User", {
    name: "string",
  });

  metro.model("Book", {
    title: "string",
  });

  metro.use(interceptor);

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

  console.time("start");

  const matchRes = await metro.exec(matchQuery, {
    // skip: 3,
    // limit: 3,
    // rawLimit: 2,
    // delete: ["u"],
    // orderBy: {
    //   type: "DESC",
    //   key: ["u.name", "b.title"],
    // },
    // set: {
    //   u: assign({ name: "John 300" }),
    // },
    delete: ["u"],
    return: ["u", "r", "b"],
  });

  console.timeEnd("start");

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

  // const mergeRes = await metro.exec(mergeQuery, {
  //   // onMatch: {
  //   //   u: assign({ name: "John 300" }),
  //   // },
  // });

  // console.log(mergeRes);
})();

function num() {
  return Math.floor(Math.random() * 10);
}
