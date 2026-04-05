import { Pool as PgPool } from "pg";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

/* Interface seen by controllers      */
export interface DataStoreInterface {
  init(): Promise<void>;
  query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<{ rows: T[]; rowCount: number }>;
  connect(): Promise<DataStoreClient>;  
  close(): Promise<void>;
}
export interface DataStoreClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void | Promise<void>;
}
/* Small SQL builders per dialect     */
type Dialect = "pg" | "mysql";

function buildPlaceholders(count: number, dialect: Dialect, startIdx = 1) {
  return dialect === "pg"
    ? Array.from({ length: count }, (_, i) => `$${i + startIdx}`)
    : Array.from({ length: count }, () => `?`);
}

function buildWhere(
  where: Record<string, any> | undefined,
  dialect: Dialect,
  startIdx = 1
) {
  if (!where || Object.keys(where).length === 0) return { sql: "", params: [], next: startIdx };
  const keys = Object.keys(where);
  const ph = buildPlaceholders(keys.length, dialect, startIdx);
  const clauses = keys.map((k, i) => `${k} = ${ph[i]}`);
  const params = keys.map((k) => where[k]);
  return { sql: ` WHERE ${clauses.join(" AND ")}`, params, next: startIdx + keys.length };
}

function buildInsert(
  table: string,
  data: Record<string, any>,
  dialect: Dialect
) {
  const keys = Object.keys(data);
  const cols = keys.join(", ");
  const ph = buildPlaceholders(keys.length, dialect, 1);
  const values = keys.map((k) => data[k]);

  const returning =
    dialect === "pg" ? " RETURNING *" : ""; // MySQL will fetch last row with select if needed

  const sql = `INSERT INTO ${table} (${cols}) VALUES (${ph.join(", ")})${returning}`;
  return { sql, params: values };
}

function buildUpdate(
  table: string,
  patch: Record<string, any>,
  where: Record<string, any>,
  dialect: Dialect
) {
  const setKeys = Object.keys(patch);
  const setPh = buildPlaceholders(setKeys.length, dialect, 1);
  const setClause = setKeys.map((k, i) => `${k} = ${setPh[i]}`).join(", ");

  const whereBuilt = buildWhere(where, dialect, setKeys.length + 1);
  const sql = `UPDATE ${table} SET ${setClause}${whereBuilt.sql}`;
  const params = [...setKeys.map((k) => patch[k]), ...whereBuilt.params];
  return { sql, params };
}


/* PostgreSQL implementation          */
class PostgresDataStore implements DataStoreInterface {
  private pool!: PgPool;

  async init() {
    this.pool = new PgPool({
      user: process.env.PGUSER ?? "postgres",
      host: process.env.PGHOST ?? "localhost",
      database: process.env.PGDATABASE ?? "silverconnect",
      password: process.env.PGPASSWORD ?? "postgres",
      port: Number(process.env.PGPORT ?? 5432),
    });

    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await this.pool.query(schema);
    console.log("[postgres] Database initialized");
  }

  async query<T = any>(sql: string, params: any[] = []) {
    const res = await this.pool.query(sql, params);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
  }
  async connect() {
    const raw = await this.pool.connect();
    return {
      async query<T = any>(sql: string, params: any[] = []) {
        const res = await raw.query(sql, params);
        return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
      },
      async begin() { await raw.query("BEGIN"); },
      async commit() { await raw.query("COMMIT"); },
      async rollback() { await raw.query("ROLLBACK"); },
      release() { raw.release(); },
    };
  }
  async getData<T = any>(table: string, where?: Record<string, any>): Promise<T[]> {
    const base = `SELECT * FROM ${table}`;
    const w = buildWhere(where, "pg", 1);
    const { rows } = await this.query<T>(base + w.sql, w.params);
    return rows;
  }

  async addData<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const { sql, params } = buildInsert(table, data, "pg");
    const { rows } = await this.query<T>(sql, params);
    return rows[0];
  }

  async updateData(
    table: string,
    where: Record<string, any>,
    patch: Record<string, any>
  ): Promise<number> {
    const { sql, params } = buildUpdate(table, patch, where, "pg");
    // RETURNING count of updated rows
    const { rows } = await this.query<{ count: string }>(`${sql} RETURNING 1 AS count`, params);
    return rows.length;
  }

  async deleteData(table: string, where: Record<string, any>): Promise<number> {
    const w = buildWhere(where, "pg", 1);
    const { rows } = await this.query<{ count: string }>(
      `DELETE FROM ${table}${w.sql} RETURNING 1 AS count`,
      w.params
    );
    return rows.length;
  }

  async close() {
    await this.pool.end();
  }
}

/* MySQL implementation               */
class MySQLDataStore implements DataStoreInterface {
  private pool!: mysql.Pool;

  async init() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? "localhost",
      user: process.env.MYSQL_USER ?? "root",
      password: process.env.MYSQL_PASSWORD ?? "password",
      database: process.env.MYSQL_DATABASE ?? "silverconnect",
      port: Number(process.env.MYSQL_PORT ?? 3306),
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true,
    });

    const schema = fs.readFileSync(path.join(__dirname, "schema.mysql.sql"), "utf8");
    const conn = await this.pool.getConnection();
    try {
      await conn.query(schema);
    } finally {
      conn.release();
    }
    console.log("[mysql] Database initialized");
  }

  async query<T = any>(sql: string, params: any[] = []) {
    const [rowsOrResult]: any = await this.pool.query(sql, params);

    // SELECT returns array; UPDATE/DELETE returns OkPacket
    if (Array.isArray(rowsOrResult)) {
      const rows = rowsOrResult as T[];
      return { rows, rowCount: rows.length };
    } else {
      const ok = rowsOrResult; // OkPacket
      const affected = ok?.affectedRows ?? 0;
      // no rows to return for mutations unless you SELECT after
      return { rows: [] as T[], rowCount: affected };
    }
  }
  async connect() {
    const raw = await this.pool.getConnection();
    return {
      async query<T = any>(sql: string, params: any[] = []) {
        const [rowsOrResult]: any = await raw.query(sql, params);
        if (Array.isArray(rowsOrResult)) {
          return { rows: rowsOrResult as T[], rowCount: rowsOrResult.length };
        } else {
          const affected = rowsOrResult?.affectedRows ?? 0;
          return { rows: [] as T[], rowCount: affected, affectedRows: affected };
        }
      },
      async begin() { await raw.query("START TRANSACTION"); },
      async commit() { await raw.query("COMMIT"); },
      async rollback() { await raw.query("ROLLBACK"); },
      release() { raw.release(); },
    };
  }
  async getData<T = any>(table: string, where?: Record<string, any>): Promise<T[]> {
    const base = `SELECT * FROM ${table}`;
    const w = buildWhere(where, "mysql", 1);
    const { rows } = await this.query<T>(base + w.sql, w.params);
    return rows;
  }

  async addData<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const { sql, params } = buildInsert(table, data, "mysql");
    await this.query(sql, params);
    // MySQL has no RETURNING; fetch last inserted if needed
    const [{ insertId }] = await this.pool.query<any>("SELECT LAST_INSERT_ID() AS insertId");
    const [row] = await this.getData<T>(table, { id: insertId });
    return row;
  }

  async updateData(
    table: string,
    where: Record<string, any>,
    patch: Record<string, any>
  ): Promise<number> {
    const { sql, params } = buildUpdate(table, patch, where, "mysql");
    const [res]: any = await this.pool.query(sql, params);
    return res.affectedRows ?? 0;
  }

  async deleteData(table: string, where: Record<string, any>): Promise<number> {
    const w = buildWhere(where, "mysql", 1);
    const [res]: any = await this.pool.query(`DELETE FROM ${table}${w.sql}`, w.params);
    return res.affectedRows ?? 0;
  }

  async close() {
    await this.pool.end();
  }
}

/* Factory                            */
export class DataStoreFactory {
  static getDataStore(): DataStoreInterface {
    const type = (process.env.DB_TYPE ?? "postgres").toLowerCase();
    switch (type) {
      case "mysql":
        return new MySQLDataStore();
      case "postgres":
      default:
        return new PostgresDataStore();
    }
  }
}

const dataStore = DataStoreFactory.getDataStore();
dataStore
  .init()
  .catch((err) => console.error("Error initializing datastore:", err));

export default dataStore;
/* Old db.ts */
// import { Pool } from "pg";
// import fs from "fs";
// import path from "path";

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "silverconnect",
//   password: "postgres", // make sure TA knows this default
//   port: 5432,
// });

// // Run schema.sql at startup
// async function initDB() {
//   const schemaPath = path.join(__dirname, "schema.sql");
//   const schema = fs.readFileSync(schemaPath).toString();

//   try {
//     await pool.query(schema);
//     console.log("Database initialized");
//   } catch (err) {
//     console.error("Error initializing DB:", err);
//   }
// }

// // Call initDB only once when backend starts
// initDB();

// export default pool;
// db.ts