import { Router } from "express";
import userRoutes from "../routes/user.routes.js";

export default (app) => {
  const router = Router();
  router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Mount API routes
  app.use('/api/v1', router);
  app.use('/api/v1/users', userRoutes);
};
