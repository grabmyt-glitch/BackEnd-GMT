const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..", "..");

const baseEnvFile = path.join(rootDir, ".env");

if (fs.existsSync(baseEnvFile)) {
  dotenv.config({ path: baseEnvFile, override: true });
}

const requestedEnvironment =
  process.env.APP_ENV || process.env.NODE_ENV || "local";
const normalizedEnvironment =
  requestedEnvironment === "development"
    ? "development"
    : requestedEnvironment === "production"
      ? "production"
      : requestedEnvironment === "test"
        ? "test"
        : "local";

const environmentEnvFile = path.join(rootDir, `.env.${normalizedEnvironment}`);

if (fs.existsSync(environmentEnvFile)) {
  dotenv.config({ path: environmentEnvFile, override: true });
}

process.env.APP_ENV = normalizedEnvironment;
process.env.NODE_ENV =
  process.env.NODE_ENV ||
  (normalizedEnvironment === "production" ? "production" : "development");
process.env.PORT = process.env.PORT || "3000";
process.env.HOST = process.env.HOST || "localhost";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
process.env.DB_PROVIDER = process.env.DB_PROVIDER || "supabase";
process.env.SUPABASE_TICKETS_TABLE =
  process.env.SUPABASE_TICKETS_TABLE || "tickets";
process.env.SUPABASE_USERS_TABLE = process.env.SUPABASE_USERS_TABLE || "users";
process.env.AUTO_RUN_MIGRATIONS = process.env.AUTO_RUN_MIGRATIONS || "false";
process.env.DB_SSL = process.env.DB_SSL || "true";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

module.exports = {
  appEnv: process.env.APP_ENV,
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  host: process.env.HOST,
  corsOrigin: process.env.CORS_ORIGIN,
  dbProvider: process.env.DB_PROVIDER,
  supabaseTicketsTable: process.env.SUPABASE_TICKETS_TABLE,
  supabaseUsersTable: process.env.SUPABASE_USERS_TABLE,
  autoRunMigrations: process.env.AUTO_RUN_MIGRATIONS,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY,
  databaseUrlConfigured: Boolean(
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    (process.env.SUPABASE_DB_HOST && process.env.SUPABASE_DB_PASSWORD),
  ),
};
