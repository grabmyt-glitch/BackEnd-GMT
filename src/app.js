const express = require("express");
const cors = require("cors");

const supabase = require("./config/supabase");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express server is running.",
  });
});

app.get("/health", async (req, res, next) => {
  try {
    return res.status(200).json({
      status: "ok",
      message: "Server is healthy.",
      services: {
        supabaseConfigured: Boolean(supabase),
      },
    });
  } catch (error) {
    return next(error);
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({
    message: "Internal server error.",
    error: err.message,
  });
});

module.exports = app;
