import Metro from './metro'
import q from './query/query'
import { values } from './services/match/actions'
import { sum, last, first, count } from './utils/actions'

const createQuery = q`CREATE``(u:User ${{
  name: 'John ' + num()
}})``[r:LIKES]``(b:Book ${{
  title: 'Hare ' + num()
}})`

const matchQuery = q`MATCH``(u:User)``[r:LIKES]``(b:Book)`

const mergeQuery = q`MERGE``(u:User ${{ _id: 101 }})``[r:LIKES ${{
  date: 126
}}]``(b:Book ${{
  _id: 6
}})`

const metro = new Metro('db', 10)

metro.model('User', {
  name: 'string'
})

metro.model('Book', {
  title: 'string'
})

;(async function () {
  metro.onUpgrade(async ({ schema }) => {
    await schema.install()
    // await schema.drop();
  })

  metro.onBlocked(({ event }) => {
    alert('Close other opened tabs of this website.')
  })

  metro.onVersionChange(({ event: { oldVersion, newVersion } }) => {
    if (
      confirm(
        `Another tab is trying to update the database version from ${oldVersion} to ${newVersion}`
      )
    ) {
      location.reload()
    } else {
      return false
    }
    // metro.disconnect();
  })

  await metro.connect()

  // const matchQuery1 = q`MATCH``(u:User ${{ _id: 1 }})``[r]``(b)`;
  // const matchQuery2 = q`MATCH``(b:Book ${{ _id: 2 }})``[r]``(b)`;

  // const [res1, res2] = await metro.batch([matchQuery1, matchQuery2], {
  //   return: ["u", "b"],
  // });

  // const user = res1[0]["u"];
  // const book = res2[0]["b"];
  // // const user2 = res2[0]["u"];

  // console.log(user, book);

  console.time('start')

  const matchRes = await metro.exec(matchQuery, {
    // skip: 5,
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
    // delete: ["u"],
    return: ['u']
  })

  const lastItem = last('u.name').exec(matchRes)

  console.timeEnd('start')

  console.log(matchRes, lastItem)

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
})()

function num () {
  return Math.floor(Math.random() * 10)
}
