import WeBase from "./WeBase";

export default async function openDB(name: string, version: number): Promise<WeBase> {
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

    await db.connect();
  
    return db;
  }