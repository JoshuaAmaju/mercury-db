import Model from "../model";
import { toArray } from "./utils";

export default function installSchema(
  tx: IDBTransaction,
  models: Map<string, Model>
) {
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
