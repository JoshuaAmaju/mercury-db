import Emitter from "./Emitter";
import Model from "./model";
import { Query } from "./query/types";
import create from "./services/create";
import match from "./services/match/match";
import merge from "./services/merge";
import relate from "./services/relate";
import { Properties, QueryOperators } from "./services/types";
import {
  Schema,
  SchemaManager,
  InitEvents,
  UpgradeEvent,
  BlockedEvent,
  VersionChangeEvent,
  WeBaseRecord,
} from "./types";
import getDefaultValuesFor from "./utils/getDefaultValues";
import relationSchema from "./utils/relationSchema";
import { deleteDB, dropSchema, installSchema } from "./utils/schemaManager";
import { relationStoreName } from "./utils/utils";
import { get } from "./utils/actions";

type Listener<T> = (args: T) => void;

export default class WeBase {
  db?: IDBDatabase;
  models = new Map<string, Model>();
  private emitter = new Emitter<InitEvents>();

  constructor(public name: string, public version: number) {
    this.model(relationStoreName, relationSchema);
  }

  onClose(fn: VoidFunction): void {
    this.db?.addEventListener("close", fn);
  }

  onAbort(fn: VoidFunction): void {
    this.db?.addEventListener("abort", fn);
  }

  onError(fn: VoidFunction): void {
    this.db?.addEventListener("error", fn);
  }

  onUpgrade(fn: Listener<UpgradeEvent>): void {
    this.emitter.on("upgrade", fn as Listener<InitEvents>);
  }

  onBlocked(fn: Listener<BlockedEvent>): void {
    this.emitter.on("blocked", fn as Listener<InitEvents>);
  }

  onVersionChange(fn: Listener<VersionChangeEvent>): void {
    this.emitter.on("versionchange", fn as Listener<InitEvents>);
  }

  connect(): Promise<void> {
    const { name, version, models } = this;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = () => {
        const tx = request.transaction as IDBTransaction;

        const schema: SchemaManager = {
          deleteDB: () => deleteDB(name),
          drop: () => dropSchema(tx, models),
          install: () => installSchema(tx, models),
          delete: (model: string) => {
            tx.db.deleteObjectStore(model);
            this.models.delete(model);
          },
        };

        this.emitter.send({ type: "upgrade", schema });
      };

      request.onblocked = (event) => {
        this.emitter.send({ type: "blocked", event });
      };

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onversionchange = (event) => {
          this.emitter.send({ type: "versionchange", event });
        };

        resolve();
      };
    });
  }

  disconnect(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.db) return;
      this.db.close();
      this.db.onerror = reject;
      this.db.onclose = resolve;
    });
  }

  model<T>(name: string, schema?: Schema): Model<T> {
    if (schema instanceof Object) {
      const model = new Model<T>(this, name, schema);
      this.models.set(name, model);
    }

    if (!this.models.has(name)) {
      const definedModels = [...this.models.keys()];

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

  private fillDefaults<T extends Query<string>>(query: T): T {
    const { end, start } = query;

    if (!start.props) {
      throw new Error("Query `Properties` must be an object.");
    }

    const newQuery = { ...query };
    const _start = this.model(start.label);

    newQuery.start.props = getDefaultValuesFor(_start, start.props);

    if (end?.props && newQuery.end) {
      const _end = this.model(end.label);
      newQuery.end.props = getDefaultValuesFor(_end, end.props);
    }

    return newQuery;
  }

  async exec(
    query: Query<string>,
    operators?: QueryOperators
  ): Promise<unknown> {
    const { end, type, start } = query;
    const startModel = this.model(start.label);
    const endModel = end?.label && this.model(end.label);

    const res = (await this.execute(query, operators)) as WeBaseRecord<
      WeBaseRecord
    >[];

    switch (type) {
      case "MATCH":
        startModel.execHooks("READ", get(start.label).exec(res));
        if (endModel) endModel.execHooks("READ", get(endModel.name).exec(res));
        break;
      case "MERGE":
      case "CREATE":
      case "RELATE":
        startModel.execHooks("WRITE");
        if (endModel) endModel.execHooks("WRITE");
        break;
    }

    return res;
  }

  execute(query: Query<string>, operators?: QueryOperators): Promise<unknown> {
    // At this point, the only definded model is the relationship model.
    if (this.models.size === 1) {
      throw new Error("No models have been defined.");
    }

    if (!this.db) {
      throw new Error("Database has not be connected.");
    }

    switch (query.type) {
      case "CREATE": {
        query = this.fillDefaults(query);
        return create(this.db, query, operators);
      }

      case "MATCH": {
        return match(this.db, query, operators);
      }

      case "MERGE": {
        return merge(this.db, query as Required<typeof query>, operators);
      }

      case "RELATE": {
        return relate(
          this.db,
          query as Required<Query<string, Properties>>,
          operators
        );
      }
    }
  }

  batch(
    queries: Query<string>[],
    operators?: QueryOperators
  ): Promise<unknown[]> {
    return Promise.all(queries.map((query) => this.exec(query, operators)));
  }

  getDB(): IDBDatabase {
    if (!this.db) throw new Error("Database has not be connected.");
    return this.db;
  }
}
