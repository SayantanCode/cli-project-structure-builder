export const authMiddleware = (req, res, next) => {
  // Simple auth example, a real implementation would be more complex
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
