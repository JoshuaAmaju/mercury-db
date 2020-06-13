import Model from "../model";
import { toArray } from "./utils";

export function installSchema(
  tx: IDBTransaction,
  models: Map<string, Model>
): Promise<unknown> {
  const db = tx.db;

  return new Promise((resolve, reject) => {
    const modelArray = toArray(models.entries());

    for (let i = 0; i < modelArray.length; i++) {
      const [, model] = modelArray[i];
      const properties = model.properties;

      const name = model.name;
      let store: IDBObjectStore;
      const isNewStore = !db.objectStoreNames.contains(name);

      if (isNewStore) {
        store = db.createObjectStore(name, {
          autoIncrement: true,
          keyPath: model.primaryKey,
        });
      } else {
        store = tx.objectStore(name);
      }

      properties.forEach((property) => {
        const name = property.name;
        const hasIndex = store.indexNames.contains(name);

        if (hasIndex) {
          if (property.isNullType()) {
            store.deleteIndex(name);
          }
        } else {
          if (property.isIndexed()) {
            store.createIndex(name, name, {
              unique: property.isUnique(),
            });
          }
        }
      });

      if (i === modelArray.length) {
        store.transaction.onerror = reject;
        store.transaction.oncomplete = resolve;
      }
    }
  });
}

export function dropSchema(
  db: IDBDatabase,
  models: Map<string, Model>
): Promise<void> {
  return new Promise((resolve) => {
    models.forEach((model) => {
      db.deleteObjectStore(model.name);
    });

    resolve();
  });
}

export function deleteDB(name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.result);
  });
}
