const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables.");
}

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  if (error.message.includes("Invalid URL") || error.message.includes("Invalid supabaseUrl")) {
    throw new Error(
      `Supabase connection failed: The SUPABASE_URL "${supabaseUrl}" is not a valid URL. Make sure it starts with https:// and check your Render environment variables.`,
    );
  }
  throw error;
}

module.exports = supabase;
