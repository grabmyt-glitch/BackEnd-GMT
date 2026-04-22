const fs = require("fs/promises");
const path = require("path");

const { getPool } = require("../config/database");

const migrationsDir = path.resolve(__dirname, "..", "..", "supabase", "migrations");

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      id bigserial primary key,
      migration_name text not null unique,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    const files = await getMigrationFiles();
    const appliedResult = await client.query(
      "select migration_name from public.schema_migrations order by migration_name asc",
    );
    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.migration_name),
    );
    const executed = [];

    for (const file of files) {
      if (appliedMigrations.has(file)) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");

      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (migration_name) values ($1)",
        [file],
      );
      await client.query("commit");

      executed.push(file);
    }

    return {
      executed,
      total: files.length,
    };
  } catch (error) {
    try {
      await client.query("rollback");
    } catch (rollbackError) {
      // Ignore rollback errors and surface the original failure.
    }

    throw error;
  } finally {
    client.release();
  }
}

async function runMigrationsIfEnabled() {
  if (process.env.AUTO_RUN_MIGRATIONS !== "true") {
    return {
      skipped: true,
      reason: "AUTO_RUN_MIGRATIONS is not enabled.",
    };
  }

  return runMigrations();
}

module.exports = {
  runMigrations,
  runMigrationsIfEnabled,
};
