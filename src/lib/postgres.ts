import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForPostgres = globalThis as unknown as {
  postgresPool: Pool | undefined;
};

const createPool = () =>
  new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

export const postgresPool =
  globalForPostgres.postgresPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = postgresPool;
}

export const query = <Row extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<Row>> => postgresPool.query<Row>(text, values);

export default postgresPool;
