import crypto from "crypto";
import path from "path";
import z from "zod/v4";

const schema = z.object({
  /** Base URL the app is served from. */
  LIBREADS_BASE_URL: z.url().default("http://localhost:3000"),

  /** Secret used by Better Auth. */
  LIBREADS_AUTH_SECRET: z.string().min(1).default(crypto.randomBytes(32).toString("hex")),

  /** Root directory for all persistent data. */
  LIBREADS_DATA_LOCATION: z.string().default("/data"),

  /** Hardcover API token. */
  LIBREADS_HARDCOVER_API_TOKEN: z.string().min(1).optional(),

  /** Max number of cached external API responses. */
  LIBREADS_EXTERNAL_API_CACHE_MAX: z.coerce.number().int().nonnegative().default(100),

  /** TTL (in milliseconds) for cached external API responses. */
  LIBREADS_EXTERNAL_API_CACHE_TTL: z.coerce.number().int().nonnegative().default(3600000), // 1 hour

  /** Disables all mutations (create, update, delete). */
  LIBREADS_READ_ONLY_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const env = schema.parse(process.env);

/** SQLite connection string expected by Prisma. */
export const databaseUrl = `file:${path.join(env.LIBREADS_DATA_LOCATION, "libreads.db")}`;
