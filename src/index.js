const env = require("./config/env");
const app = require("./app");
const { isDatabaseUrlConfigured } = require("./config/database");
const { runMigrationsIfEnabled } = require("./services/migration.service");

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";
const dbProvider = env.dbProvider;
const ticketsTable = env.supabaseTicketsTable;

async function logSupabaseStatus() {
  if (dbProvider !== "supabase") {
    console.log(`Database provider configured: ${dbProvider}`);
    return;
  }

  const supabase = require("./config/supabase");

  try {
    const { error } = await supabase
      .from(ticketsTable)
      .select("ticket_id")
      .limit(1);

    if (error && error.code !== "PGRST205") {
      console.error(`Supabase connection failed: ${error.message}`);
      return;
    }

    if (error && error.code === "PGRST205") {
      console.log(
        `Supabase connected, but table "${ticketsTable}" does not exist yet. Run supabase/schema.sql first.`,
      );
      return;
    }

    console.log("Supabase connected successfully.");
  } catch (error) {
    console.error(`Supabase connection failed: ${error.message}`);
  }
}

async function bootstrap() {
  if (env.autoRunMigrations === "true") {
    if (!isDatabaseUrlConfigured()) {
      console.warn(
        "AUTO_RUN_MIGRATIONS is enabled, but DATABASE_URL/SUPABASE_DB_URL is missing. Skipping migrations.",
      );
    } else {
      const migrationResult = await runMigrationsIfEnabled();

      if (migrationResult.executed && migrationResult.executed.length > 0) {
        console.log(
          `Applied migrations on startup: ${migrationResult.executed.join(", ")}`,
        );
      } else if (!migrationResult.skipped) {
        console.log("No pending migrations found on startup.");
      }
    }
  }

  app.listen(PORT, HOST, async () => {
    console.log(`Server running on port ${PORT}`);
    await logSupabaseStatus();
  });
}

bootstrap().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
