# MercuryDB

A minimal Graph database backed by IndexedDB modeled after Neo4j's with a Cypher Query Language (CQL) like syntax.

## Overview

> This project does not intend to implement a complete set of the CQL, with some additions specific to this library. Just a subset that is just enough to get the job done.

### Motivation

While working on a project, I needed a store resources in the browser, the kind of data that can't be stored with `localStorage`. I looked out for packages and found [levelgraph](https://github.com/levelgraph/levelgraph) and [Dexie](https://dexie.org/), but they were not a good fit for the kind of data I was dealing with.

I was dealing with connected peices of data, it was like squeezing a square peg into a round hole. I soon found myself fighting with the DB and I felt like I was just hacking my way around it.

What other way to handle storing of data that's connected like a graph, other than a [Graph database](https://en.wikipedia.org/wiki/Graph_database). Having worked with [Neo4j](https://neo4j.com/) on the backend, I found it difficult doing things that would be trivial if I were using a graph database. For example, I have a list of users - A, B, C, I want to be able to say:

- User A is a friend of User B and C.
- User B is a friend of User A and C.

To be able to handle such a scenario using the existing solutions in the market, I'd have to save an array/table with the id of each target user tied to the main user I want to relate them with, e.g The above example would be handled like so:

- User A: [User B, User, C].
- User B: [User A, User, C].

Notice the duplicating of reference, which would require array manipulations just to get something that trivial done. But you might say, why not use a relational database like [lovefield](https://google.github.io/lovefield/). You see, the thing is, after using a Graph database for most of my projects on the backend, I don't think I can ever get to make my brain think in relational databases again.

> Once you see it, you can't unsee it.

### Installation

```javascript
pnpm add mercurydb
```

## Usage

```javascript
import { q, assign, Mercury } from "mercurydb";

const db = new Mercury("test", 1);
```

### Schema definition

```javascript
const Employees = db.model("Employee", {
  age: "number",
  name: "string",
  email: {
    unique: true,
    indexed: true,
    type: "string",
    default: "anonymous@email.com",
  },
});

const Employers = db.model("Employer", {
  address: "number",
  name: {
    unique: true,
    indexed: true,
    type: "string",
  },
  regNo: {
    unique: true,
    indexed: true,
    type: "string",
    default: () => uuid(),
  },
});
```

### Install the defined schema and connect the database

```javascript
db.onUpgrade(async ({ schema }) => {
  await schema.install();
});

await db.connect();
```

## Query

---

- The brackets denote nodes, while the square brackets denote a relationship.
- The `e` is optional, but is neccessary if you want to do things like RETURN, DELETE, WHERE, SET and ORDERBY.
- Specify the first/start node (e.g (e:Employee)) is neccessary, while the rest are optional.

> The full pattern shown in `createQuery` must be provided.

```javascript
// This query matches all `Employee`s.

const createQuery = q`CREATE``(e:Employee)``[]``()`;
```

### Example with relationship

```javascript
// This query matches only `Employee`s that have a relationship of type employed.
const createQuery = q`CREATE``(e:Employee)``[:EMPLOYED_BY]``()`;

/**
 * This query matches only nodes labeled `Employee`, that have a relationship
 * of `EMPLOYED_BY` to another node labeled `Employer`. In other words, this
 * query matches only `Employee`s that are employed by a certain employer.
 */
const createQuery = q`CREATE``(e:Employee ${employee})``[:EMPLOYED_BY]``(:Employer ${employer})`;
```

The above concepts apply to other query types, with just a difference in operator. So lets take a look at other query types.

### Query types

---

- #### CREATE

```javascript
const createQuery = q`CREATE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

- #### MATCH

```javascript
const matchQuery = q`MATCH``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

- #### RELATE

Create a relationship between two existing nodes.

```javascript
const relateQuery = q`RELATE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

- #### MERGE

Merge tries to match the full pattern and merges its contents, and also creates the full pattern if no match is found.

```javascript
const mergeQuery = q`MERGE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

> ### Note: Relationships have to be specified in the same pattern in which they were created. Relationships with directions are not yet supported. For example

```javascript
const createQuery = q`CREATE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

The relationship goes from `Employee` to `Employer`. Then doing something like this:

```javascript
const matchQuery = q`MATCH``(e:Employer)``[:EMPLOYED_BY]``(:Employee)`;
```

won't work. The match query relationship goes from `Employer` to `Employee` which is not the form in which it was created.

## Query parameters

---

- set
- skip
- limit
- where
- delete
- return
- orderBy
- rawLimit (limit the cursor over the database)

```javascript
const createQuery = q` CREATE``(e:Employee)``[:EMPLOYED_BY]``(emp:Employer) `;

const { e } = await db.exec(createQuery, {
  return: "e",
  return: ["e"],
  return: ["e", "emp.regNo AS regNo"],
  return: ["e", ["emp.regNo", "regNo"]],

  skip: 2,
  limit: 10,
  rawLimit: 5,
  delete: ["e", "emp"],

  orderBy: {
    type: "DESC",
    key: "e.name",
  },

  where: ({ name }) => name.startsWith("Segun"),

  set: {
    e: assign({ name: "Arinze" }),
    e: assign({ name: () => "Arinze" }),
    e: assign(() => ({ name: "Arinze" })),
  },

  // specific to merge queries
  onMatch: {
    e: assign({ name: "Arinze" }),
  },
  onCreate: {
    e: assign({ name: "Segun Arinze" }),
  },
});
```

## Examples

---

### Create

```javascript
const employee = {
  name: "Segun Arinze",
  age: Math.floor(Math.random() * 10),
};

const employer = {
  name: "Self",
  address: "Earth",
};

const createQuery = q`CREATE``(e:Employee ${employee})``[:EMPLOYED_BY]``(:Employer ${employer})`;

const { e } = await db.exec(createQuery, { return: ["e"] });
```

### Merge

Equivalent of an update query

```javascript
const mergeQuery = q`MERGE``(e:Employee ${{ ...e, age: 50 }})``[]``()`;

const mergeRes = await db.exec(mergeQuery);
```

### Match

There are two options for a match query. This, but this would only work if the objects have an indexed field. So its advisable to index searchable fields. And this also makes the query faster.

```javascript
const matchQuery = q`MATCH``(e:Employee ${employee})``[:EMPLOYED_BY]``(:Employer ${employer})`;
const matchRes = await db.exec(matchQuery, { return: ["e"] });
```

OR

This approach can get quite slow as the number of items in the database increases, because every item with the label `Employee` and `Employer` will be traversed.

```javascript
const matchQuery = q`MATCH``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;

const matchRes = await db.exec(matchQuery, {
  where({ name }) {
    return name === "John Doe";
  },
  return: ["e"],
});
```

### Relate

```javascript
const createQuery1 = q`CREATE``(e:Employee ${employee})``[]``()`;
const createQuery2 = q`CREATE``(e:Employer ${employer})``[]``()`;

const [createRes1, createRes2] = await db.batch([createQuery1, createQuery2], {
  return: "e",
});

const relateQuery = q`RELATE``(:Employee ${createRes1.e})``[:EMPLOYED_BY]``(:Employer ${createRes2.e})`;

await db.exec(relateQuery);
```

## Todo

- Validation.
- Better query mechanism.
- Relationship direction.
- DELETE operator.
- OPTIONAL MATCH operator.
