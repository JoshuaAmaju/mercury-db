import Property from "./Property";
import { Schema, StringOrSchemaObject } from "./types";
import Metro from ".";

const defaultPrimary = {
  type: "string",
  hidden: true,
  unique: true,
  indexed: true,
  primary: true,
};

export default class Model<T = unknown> {
  primaryKey = "_id";
  unique: string[] = [];
  indexed: string[] = [];
  properties = new Map<string, Property>();

  constructor(
    private metro: Metro,
    public name: string,
    public schema: Schema
  ) {
    this.schema = {
      ...schema,
      [this.primaryKey]: defaultPrimary,
    };

    Object.keys(this.schema).forEach((key) => {
      this.addProperty(key, this.schema[key]);
    });
  }

  private addProperty(key: string, schema: StringOrSchemaObject) {
    const property = new Property(key, schema);

    if (property.isPrimary()) this.primaryKey = key;

    if (property.isIndexed()) this.indexed.push(key);

    if (property.isUnique() || property.isPrimary()) this.unique.push(key);

    this.properties.set(key, property);

    return this;
  }

  get(key: string | number): Promise<T> {
    const { db } = this.metro;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.name);
      const req = tx.objectStore(this.name).get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  getAll(): Promise<T[]> {
    const { db } = this.metro;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.name);
      const req = tx.objectStore(this.name).getAll();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  count(): Promise<number> {
    const { db } = this.metro;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.name);
      const req = tx.objectStore(this.name).count();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  clear(): Promise<void> {
    const { db } = this.metro;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.name);
      const req = tx.objectStore(this.name).clear();
      req.onerror = () => reject();
      req.onsuccess = () => resolve();
    });
  }

  delete(key: string | number): Promise<void> {
    const { db } = this.metro;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.name);
      const req = tx.objectStore(this.name).delete(key);
      req.onerror = () => reject();
      req.onsuccess = () => resolve();
    });
  }
}
