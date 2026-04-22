require("dotenv").config();

const app = require("./app");
const supabase = require("./config/supabase");

const PORT = process.env.PORT || 3000;

async function logSupabaseStatus() {
  try {
    const { error } = await supabase.from("_").select("*").limit(1);

    if (error && error.code !== "PGRST205") {
      console.error(`Supabase connection failed: ${error.message}`);
      return;
    }

    console.log("Supabase connected successfully.");
  } catch (error) {
    console.error(`Supabase connection failed: ${error.message}`);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await logSupabaseStatus();
});
