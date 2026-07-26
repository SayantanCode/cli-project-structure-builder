import express from 'express';
import { Router } from "express";
import userRoutes from "../routes/user.routes";

export default (app: express.Application) => {
  const router = Router();
  router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Mount API routes
  app.use('/api/v1', router);
  app.use('/api/v1/users', userRoutes);
};
