import { knex as setupKnex, Knex } from "knex";
import { env } from "./env";
if (process.env.DATABASE_URL === undefined) {
  throw new Error("DATABASE_URL is not defined");
}

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection:
    env.DATABASE_CLIENT === "sqlite"
      ? {
          filename: env.DATABASE_URL,
        }
      : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations",
  },
};

export const knex = setupKnex(config);
