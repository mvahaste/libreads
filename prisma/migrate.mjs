// Apply Prisma migrations on container startup without prisma, dotenv, or tsx.
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

export const dataLocation = process.env.LIBREADS_DATA_LOCATION || "/data";
export const dbPath = path.join(dataLocation, "libreads.db");

const migrationsDir = path.resolve("prisma/migrations");

fs.mkdirSync(dataLocation, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id                  TEXT PRIMARY KEY NOT NULL,
    checksum            TEXT NOT NULL,
    finished_at         DATETIME,
    migration_name      TEXT NOT NULL,
    logs                TEXT,
    rolled_back_at      DATETIME,
    started_at          DATETIME NOT NULL DEFAULT (strftime('%s','now') * 1000 + 0),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  )
`);

const applied = new Set(
  db
    .prepare("SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL AND finished_at IS NOT NULL")
    .all()
    .map((row) => row.migration_name),
);

const pending = fs
  .readdirSync(migrationsDir)
  .filter((name) => {
    const dir = path.join(migrationsDir, name);
    return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, "migration.sql"));
  })
  .sort()
  .filter((name) => !applied.has(name));

for (const name of pending) {
  const sql = fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8");
  const checksum = crypto.createHash("sha256").update(sql).digest("hex");
  const startedAt = Date.now();

  console.log(`Applying migration: ${name}`);

  db.transaction(() => {
    db.exec(sql);
    db.prepare(
      `INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
       VALUES (?, ?, ?, ?, ?, 1)`,
    ).run(crypto.randomUUID(), checksum, name, startedAt, Date.now());
  })();
}

console.log(pending.length > 0 ? `Applied ${pending.length} migration(s).` : "No pending migrations.");

db.close();
