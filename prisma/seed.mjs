// Seed default statuses without prisma, dotenv, or tsx.
// NOTE: Status is now an enum (ReadingStatus) in the Prisma schema.
// This seeding logic is kept for reference/future reuse.

// import { createRequire } from "node:module";
// import path from "node:path";

// const require = createRequire(import.meta.url);
// const Database = require("better-sqlite3");

// const dataLocation = process.env.LIBREADS_DATA_LOCATION || "/data";
// const dbPath = path.join(dataLocation, "libreads.db");

// const db = new Database(dbPath);
// const now = new Date().toISOString().replace("Z", "+00:00");

// const upsertStatus = db.prepare(`
//   INSERT INTO status (id, name, color, isDefault, userId, createdAt, updatedAt)
//   VALUES (?, ?, NULL, 1, NULL, ?, ?)
//   ON CONFLICT(id) DO NOTHING
// `);

// const statuses = [
//   { id: "status_want_to_read", name: "Want to Read" },
//   { id: "status_reading", name: "Reading" },
//   { id: "status_completed", name: "Completed" },
//   { id: "status_paused", name: "Paused" },
//   { id: "status_abandoned", name: "Abandoned" },
// ];

// db.transaction(() => {
//   for (const s of statuses) upsertStatus.run(s.id, s.name, now, now);
// })();

// console.log(`Seeded ${statuses.length}.`);

// db.close();
