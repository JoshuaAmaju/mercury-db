import Model from "../model";

export function installSchema(
  tx: IDBTransaction,
  models: Map<string, Model>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const db = tx.db;
    const modelArray = [...models.entries()];

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
  tx: IDBTransaction,
  models: Map<string, Model>
): void {
  models.forEach((model) => {
    const { name, indexed } = model;
    const store = tx.objectStore(name);
    for (const index of indexed) store.deleteIndex(index);
  });
}

export function deleteDB(name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.result);
  });
}
