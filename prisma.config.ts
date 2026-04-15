import "dotenv/config";
import { defineConfig } from "prisma/config";

import { databaseUrl } from "./lib/env";

export default defineConfig({
  schema: "./prisma",
  migrations: {
    path: "./prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: databaseUrl,
  },
});
