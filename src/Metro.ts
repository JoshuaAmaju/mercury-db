import Model from "./model";
import { StringOrSchemaObject } from "./types";
import installSchema from "./utils/installSchema";
import relationSchema from "./utils/relationSchema";
import { toArray, relationStoreName } from "./utils/utils";

export default class Metro {
  db: IDBDatabase;
  models = new Map<string, Model>();

  constructor(public name: string, public version: number) {
    this.model(relationStoreName, relationSchema);
  }

  connect() {
    const { name, version, models } = this;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = async (e) => {
        const tx = (e.target as IDBRequest).transaction;
        await installSchema(tx, models);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }

  dropSchema() {
    return new Promise((resolve) => {
      this.models.forEach((model) => {
        this.db.deleteObjectStore(model.name);
      });

      resolve();
    });
  }

  deleteDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.result);
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      this.db.close();
      this.db.onerror = reject;
      this.db.onclose = resolve;
    });
  }

  model<T>(name: string, schema?: Record<keyof T, StringOrSchemaObject>) {
    if (schema instanceof Object) {
      const model = new Model<T>(name, schema);
      this.models.set(name, model);
    }

    if (!this.models.has(name)) {
      const definedModels = toArray(this.models.keys());

      let message = `Could not find a definition for \`${name}\`.`;

      if (definedModels.length === 0) {
        message += "\nNo models have been defined yet.";
      } else {
        const definitions = definedModels.map((d) => `\t- ${d}`).join("\n");
        message += `\nModels currently defined are:\n${definitions}`;
      }

      throw new Error(message);
    }

    return this.models.get(name) as Model<T>;
  }

  // exec(query: Query<string>, operators?: QueryOperators) {
  //   let { end, type, start } = query;

  //   const _start = this.model(start.label);
  //   const _end = end.label && this.model(end.label);

  //   query.end.primaryKey = _end?.primaryKey;
  //   query.start.primaryKey = _start.primaryKey;

  //   switch (type) {
  //     case "CREATE": {
  //       query.start.props = getDefaultValuesFor(_start, start.props);

  //       if (end && end.props) {
  //         query.end.props = getDefaultValuesFor(_end, end.props);
  //       }

  //       return create(this.db, query, operators);
  //     }

  //     case "MATCH": {
  //       return match(this.db, query, operators);
  //     }

  //     case "MERGE": {
  //       return merge(this.db, query, operators);
  //     }

  //     case "RELATE": {
  //       return relate(this.db, query, operators);
  //     }
  //   }
  // }
}
