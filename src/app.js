const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

const corsOrigin =
  env.corsOrigin === "*"
    ? "*"
    : env.corsOrigin.split(",").map((origin) => origin.trim());

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express server is running.",
  });
});

app.use("/api/v1", apiRoutes);

app.get("/health", async (req, res, next) => {
  try {
    return res.status(200).json({
      status: "ok",
      message: "Server is healthy.",
      services: {
        databaseProvider: env.dbProvider,
        environment: env.appEnv,
        port: env.port,
        host: env.host,
      },
    });
  } catch (error) {
    return next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
