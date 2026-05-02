const { Pool } = require("pg");

let pool;

function buildDatabaseUrlFromParts() {
  const host = process.env.SUPABASE_DB_HOST;
  const port = process.env.SUPABASE_DB_PORT || "5432";
  const database = process.env.SUPABASE_DB_NAME || "postgres";
  const user = process.env.SUPABASE_DB_USER || "postgres";
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!host || password === undefined || password === "") {
    return "";
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    buildDatabaseUrlFromParts() ||
    ""
  );
}

function isDatabaseUrlConfigured() {
  return Boolean(getDatabaseUrl());
}

function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error(
        "Missing migration database config. Set DATABASE_URL, SUPABASE_DB_URL, or the separate SUPABASE_DB_* values.",
      );
    }

    pool = new Pool({
      connectionString,
      ssl:
        process.env.DB_SSL === "false"
          ? false
          : {
              rejectUnauthorized: false,
            },
    });
  }

  return pool;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  buildDatabaseUrlFromParts,
  getDatabaseUrl,
  isDatabaseUrlConfigured,
  getPool,
  closePool,
};
