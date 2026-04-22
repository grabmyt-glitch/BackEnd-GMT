require("../config/env");

const { closePool, isDatabaseUrlConfigured } = require("../config/database");
const { runMigrations } = require("../services/migration.service");

async function main() {
  if (!isDatabaseUrlConfigured()) {
    throw new Error(
      "Missing migration database config. Add DATABASE_URL, SUPABASE_DB_URL, or the separate SUPABASE_DB_* values.",
    );
  }

  const result = await runMigrations();

  if (result.executed.length === 0) {
    console.log("No new migrations to apply.");
    return;
  }

  console.log(`Applied migrations: ${result.executed.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
