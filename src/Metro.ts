import Model from "./model";
import { StringOrSchemaObject } from "./types";
import installSchema from "./utils/installSchema";
import relationSchema from "./utils/relationSchema";
import { toArray, relationStoreName } from "./utils/utils";
import { Query } from "./query/types";
import { QueryOperators } from "./services/types";
import create from "./services/create";
import relate from "./services/relate";
import getDefaultValuesFor from "./utils/getDefaultValues";
import match from "./services/match/match";
import merge from "./services/merge";
import Interceptor from "./Interceptor";

export default class Metro {
  db: IDBDatabase;
  interceptor: Interceptor;
  models = new Map<string, Model>();

  constructor(public name: string, public version: number) {
    this.model(relationStoreName, relationSchema);
  }

  use(interceptor: Interceptor) {
    this.interceptor = interceptor;
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

      // TODO: Handle situation when DB is blocked
      // by another version running in a different tab
      // on the same browser.
      request.onblocked = () => {};

      request.onsuccess = () => {
        this.db = request.result;

        // TODO: Handler scenario where the database
        // was upgraded by another running tab.
        this.db.onversionchange = () => {};

        resolve();
      };
    });
  }

  private dropSchema() {
    return new Promise((resolve) => {
      this.models.forEach((model) => {
        this.db.deleteObjectStore(model.name);
      });

      resolve();
    });
  }

  private delete(model: string) {
    this.db.deleteObjectStore(model);
    this.models.delete(model);
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
      const model = new Model(name, schema);
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

    return this.models.get(name);
  }

  async exec(query: Query<string>, operators?: QueryOperators) {
    this.interceptor.send("request", query);
    const res = await this.execute(query, operators);
    return this.interceptor.send("response", query, res);
  }

  execute(query: Query<string>, operators?: QueryOperators) {
    switch (query.type) {
      case "CREATE": {
        query = this.fillDefaults(query);
        return create(this.db, query, operators);
      }

      case "MATCH": {
        return match(this.db, query, operators);
      }

      case "MERGE": {
        return merge(this, query, operators);
      }

      case "RELATE": {
        return relate(this.db, query as any, operators);
      }
    }
  }

  fillDefaults(query: Query<string>) {
    let shouldThrow = false;
    let { end, start } = query;
    const newQuery = { ...query };
    const _start = this.model(start.label);
    const _end = end.label && this.model(end.label);

    if (!start.props) shouldThrow = true;

    newQuery.start.props = getDefaultValuesFor(_start, start.props);

    if (end) {
      if (end.props) {
        newQuery.end.props = getDefaultValuesFor(_end, end.props);
      } else {
        // shouldThrow = true;
      }
    }

    if (shouldThrow) {
      throw new Error("Query `Properties` must be an object.");
    }

    return newQuery;
  }

  batch(queries: Query<string>[], operators?: QueryOperators) {
    return Promise.all(queries.map((query) => this.exec(query, operators)));
  }
}
