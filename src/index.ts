import q from "./query/query";
import { count, first, last, sum } from "./utils/actions";
import WeBase from "./WeBase";
import { WeBaseRecord } from "./types";

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
