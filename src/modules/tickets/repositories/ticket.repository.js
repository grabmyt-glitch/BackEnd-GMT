const AppError = require("../../../utils/app-error");

const provider = process.env.DB_PROVIDER || "supabase";

function getRepository() {
  if (provider === "supabase") {
    return require("./supabase/ticket.repository");
  }

  throw new AppError(
    `Unsupported DB_PROVIDER "${provider}". Add a repository adapter for it.`,
    500,
  );
}

module.exports = getRepository();
