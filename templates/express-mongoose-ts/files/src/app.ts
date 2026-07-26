import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import loaders from "./loaders";
import { notFound, errorHandler } from "./middlewares/error";

/**
 * Creates and returns the Express application.
 * This function should only contain middleware and route loaders.
 * Server bootstrap logic is in server.ts.
 */
export function createServer() {
  const app = express();

  // Core middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // Loaders
  loaders.init(app);

  // Health check endpoint
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  // Error handling middleware
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
