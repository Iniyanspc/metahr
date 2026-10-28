import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  ALLOWED_EMAIL_DOMAIN: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "bare domain, e.g. themetadatum.com"),
  AUTH_GOOGLE_ID: z.string().optional().default(""),
  AUTH_GOOGLE_SECRET: z.string().optional().default(""),
  EMAIL_SERVER: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  FIELD_ENCRYPTION_KEY: z.string().min(1),
  BLIND_INDEX_KEY: z.string().min(1),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  CRON_SECRET: z.string().min(16),
});

export const env = schema.parse(process.env);

export const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
