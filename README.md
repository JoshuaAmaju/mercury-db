# WeBase

A minimal Graph database backed by IndexedDB modeled after Neo4j's Cypher Query Language (CQL).

## Overview

This project does not intend to implement a complete set of the CQL, but just a subset thats enough to get the job done. The provided operators are: MATCH, CREATE, MERGE and RELATE.

## Motivation

While working on a project, I realized I needed a database to store resources and user data. I looked out for packages to solve my problem, I found [levelgraph](https://github.com/levelgraph/levelgraph) but it didn't fit my needs. Then I found [Dexie](https://dexie.org/) and went to work with it. But I soon found myself fighting with the DB and I felt like I was just hacking my way around it.

Having worked with [Neo4j]() on the backend, I found it difficult doing things that would be trivial if I were using a graph database. For example, I have a list of users - A, B, C, I want to be able to say:

- User A is a friend of User B and C.
- User B is a friend of User A and C.

To be able to handle such a scenario using the existing solutions in the market, I'd have to save an array with the id of each target user tied to the main user i want to relate the with, e.g The above example would be handled like so:

- User A: [User B, User, C].
- User B: [User A, User, C].

Notice the duplicating of reference and I'd have to start doing array manipulations just to get something that trivial done. But you might say, why not user a relational database like [lovefield](). You see, the thing is, after using a Graph database for most of my projects on the backend, I don't think I can get to make my brain think in relational databases again.

## Installation

```javascript
pnpm add webase // TODO
```

## Usage

```javascript
import { q, WeBase } from "webase"; // TODO

const db = new WeBase("db", 1);

/**
 * Schema definition
 *
 * This schema definition approach was directly stolen from [neode]().
 */
const Employees = db.model("Employee", {
  age: "number",
  name: "string",
  email: {
    unique: true,
    indexed: true,
    type: "string",
    default: "anonymous",
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

// install the defined shcema
db.onUpgrade(async ({ schema }) => {
  await schema.install();
});

await db.connect();

// Query

/** Querying makes use of template strings, this is a temporary fix.
*
* The full pattern shown below must be provided. The brackets denote nodes, while
* the square brackets denote a relationship. The `e` is optional, but is neccessary
* if you want to do things like RETURN, DELETE, WHERE, SET and ORDERBY.

* Specify the first/start node (e.g (e:Employee)) is neccessary, while the rest are
* optional.

* This query matches all `Employee`s.
**/
const createQuery = q`CREATE``(e:Employee)``[]``()`;

// Example with relationship
// This query matches only `Employee`s that have a relationship of employed.
const createQuery = q`CREATE``(e:Employee)``[:EMPLOYED_BY]``()`;

/**
 * This query matches only nodes labeled `Employee`s that have a relationship
 * of `EMPLOYED_BY` to another node labeled `Employer`. In other words, this
 * query matches only `Employee`s that are employed by a certain employer.
 */
const createQuery = q`CREATE``(e:Employee ${employee})``[:EMPLOYED_BY]``(:Employer ${employer})`;
```

The above concepts apply to other query types, with just a difference in operator. So lets take a look at other query types.

### Query types

- #### CREATE

```javascript
const createQuery = q`CREATE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

- #### MATCH

```javascript
const matchQuery = q`MATCH``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

- #### RELATE

```javascript
// Create a relationship between two nodes.
const relateQuery = q`RELATE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

- #### MERGE

```javascript
const mergeQuery = q`MERGE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

### Note

Relationships have to be specified in the same pattern in which they were created. For example:

```javascript
const createQuery = q`CREATE``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;
```

The relationship goes from `Employee` to `Employer`. Then doing something like this:

```javascript
const matchQuery = q`MATCH``(e:Employer)``[:EMPLOYED_BY]``(:Employee)`;
```

won't work. The match query relation goes from `Employer` to `Employee` which is not the form in which it was created.

#### Query parameters

## Example

```javascript
const employee = {
  name: "Jonh Doe",
  age: Math.floor(Math.random() * 10),
};

const employer = {
  name: "Github",
  address: "Earth",
  regNo: "12345678",
};

const createQuery = q`CREATE``(e:Employee ${employee})``[:EMPLOYED_BY]``(:Employer ${employer})`;

const createRes = await db.exec(createQuery, { return: ["e"] });

createRes.e.age = 50;

// Equivalent of an update query
const mergeQuery = q`MERGE``(e:Employee ${createRes.e})``[]``()`;

const mergeRes = await db.exec(mergeQuery);

// There are two options for a match query. This, but this would only work
// if the objects have an indexed field. So its advisable to index searchable
// field. And this also improves query time (faster query).
const matchQuery = q`MATCH``(e:Employee ${employee})``[:EMPLOYED_BY]``(:Employer ${employer})`;
const matchRes = await db.exec(createQuery, { return: ["e"] });

// OR

// This approach can get quite slow as the number of items in the
// database increases, because every item with the label `Employee` and
// `Employer` will be travered.
const matchQuery = q`MATCH``(e:Employee)``[:EMPLOYED_BY]``(:Employer)`;

const matchRes = await db.exec(createQuery, {
  where(e) {
    return e.name === "John Doe";
  },
  return: ["e"],
});

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
