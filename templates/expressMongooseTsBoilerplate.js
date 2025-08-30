const expressMongooseTsBoilerplate = (projectName) => {
  return {
    // Top-level files
    ".editorconfig": `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
`,
    ".eslintignore": `node_modules
dist
coverage
.env
`,
    ".eslintrc.cjs": `module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Add your custom rules here
  }
};
`,
    ".prettierrc": `{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true
}`,
    ".gitignore": `node_modules
.env
dist
coverage
`,
    ".nvmrc": `18.17.1
`,
    ".env.example": `PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/${projectName}
NODE_ENV=development
`,
    "package.json": `{
  "name": "${projectName}",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc",
    "lint": "eslint . --ext .ts",
    "test": "jest --detectOpenHandles"
  },
  "dependencies": {
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "http-status-codes": "^2.3.0",
    "joi": "^17.13.1",
    "mongoose": "^8.4.1",
    "morgan": "^1.10.0",
    "pino": "^9.1.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "zod": "^3.23.8",
    "@bull-board/api": "^5.23.0",
    "@bull-board/express": "^5.23.0",
    "bullmq": "^5.10.1",
    "redis": "^4.6.15",
    "socket.io": "^4.7.5",
    "winston": "^3.13.0"
  },
  "devDependencies": {
    "@types/compression": "^1.7.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.14.2",
    "@types/pino": "^7.0.5",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/jest": "^29.5.12",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.4.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5",
    "nodemon": "^3.1.3",
    "ts-jest": "^29.1.5",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "mongodb-memory-server": "^10.0.0"
  }
}`,
    "pnpm-lock.yaml": "",
    "tsconfig.json": `{
  "compilerOptions": {
    "target": "es2021",
    "module": "es2020",
    "lib": ["es2021"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}`,
    "Dockerfile": `FROM node:18-alpine

WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --prod
COPY . .

EXPOSE 4000
CMD ["npm", "start"]
`,
    "docker-compose.yml": `version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - MONGO_URI=mongodb://mongo:27017/your-app-db
      - REDIS_URI=redis://redis:6379
    volumes:
      - .:/app
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6.0
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7.0-alpine
    container_name: redis
    ports:
      - "6379:6379"

volumes:
  mongo-data: {}
`,
    "README.md": `# your-app

## Project Structure

This project follows a clean, modular architecture designed for scalability and maintainability.

### Key Directories

- \`src/app.ts\`: Express app initialization, middleware, and route mounting.
- \`src/server.ts\`: Entry point to bootstrap the server and database connection.
- \`src/config/\`: Environment variables, database connections, and other configurations.
- \`src/loaders/\`: Centralized setup for Express middleware, routes, and API documentation.
- \`src/routes/\`: Defines API endpoints.
- \`src/controllers/\`: Handles request logic and calls services.
- \`src/services/\`: Contains business logic.
- \`src/repositories/\`: A thin layer for database interactions (wrapping Mongoose models).
- \`src/models/\`: Mongoose schemas.
- \`src/validators/\`: Joi and Zod schemas for input validation.
- \`src/middlewares/\`: Custom Express middleware.
- \`src/utils/\`: Helper functions and classes (e.g., custom error handler, async handler).
- \`src/types/\`: TypeScript-specific type declarations.

## Getting Started

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/your-username/your-app.git
    cd your-app
    \`\`\`

2.  **Environment Setup:**
    - Create a \`.env\` file by copying \`.env.example\`.
    - Fill in your database and other configuration details.

3.  **Install Dependencies:**
    \`\`\`bash
    pnpm install # or npm install / yarn install
    \`\`\`

4.  **Run the application:**
    \`\`\`bash
    npm run dev
    \`\`\`
    The server will start on \`http://localhost:4000\`.

## API Endpoints

- \`GET /health\`: Check the health of the server.

## Docker

- **Build and run with Docker:**
  \`\`\`bash
  docker-compose up --build
  \`\`\`
  This will launch the application, MongoDB, and Redis.

## Scripts

- \`npm run dev\`: Run the app in development mode with nodemon.
- \`npm start\`: Run the production build.
- \`npm run build\`: Compile TypeScript to JavaScript.
- \`npm run lint\`: Run ESLint.
- \`npm test\`: Run Jest tests.

`,
    "src/": {
      "app.ts": `import express from "express";
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
`,
      "server.ts": `import { createServer } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

async function bootstrap() {
  await connectDB();
  const app = createServer();
  const port = Number(env.PORT || 4000);
  app.listen(port, () => {
    console.log(\`🚀 Server ready at http://localhost:\${port}\`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
`,
      "config/": {
        "index.ts": `import { env } from "./env";
import { db } from "./db";
import { logger } from "./logger";
import { redisClient } from "./redis";
import { bullmq } from "./bullmq";
import { swagger } from "./swagger";
import { socket } from "./socket";

export default {
  env,
  db,
  logger,
  redisClient,
  bullmq,
  swagger,
  socket
};
`,
        "env.ts": `import 'dotenv/config';
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
  REDIS_URI: Joi.string().optional().description('Redis connection URI'),
  VALIDATOR: Joi.string().valid('joi', 'zod').default('joi'),
}).unknown().required();

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(\`Config validation error: \${error.message}\`);
}

export const env = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  MONGO_URI: envVars.MONGO_URI,
  REDIS_URI: envVars.REDIS_URI,
  VALIDATOR: envVars.VALIDATOR,
};
`,
        "db.ts": `import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}
`,
        "redis.ts": `import { createClient } from "redis";
import { env } from "./env";

const client = createClient({
  url: env.REDIS_URI
});

client.on("error", (err) => console.log("Redis Client Error", err));

export const redisClient = {
  connect: async () => {
    if (env.REDIS_URI) {
      await client.connect();
      console.log("✅ Redis client connected");
    } else {
      console.warn("⚠️  REDIS_URI not set, skipping Redis connection.");
    }
  },
  client,
};
`,
        "logger.ts": `import pino from 'pino';
import winston from 'winston';

// You can choose your logger here.
// Pino is lightweight and fast.
const pinoLogger = pino();

// Winston is more versatile.
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export const logger = winstonLogger;
`,
        "socket.ts": `import { Server } from "socket.io";
import http from "http";

export const socket = {
  init: (server: http.Server) => {
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });
    console.log("✅ Socket.IO server initialized");
    return io;
  },
};
`,
        "bullmq.ts": `import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { env } from './env';

const connection: ConnectionOptions = {
  host: 'localhost',
  port: 6379,
  // Add more connection options as needed
};

// Check if redis is configured
if (!env.REDIS_URI) {
  console.warn("⚠️  REDIS_URI not set, BullMQ is disabled.");
}

export const bullmq = {
  createQueue: (name: string) => {
    if (!env.REDIS_URI) return null;
    return new Queue(name, { connection });
  },
  createWorker: (name: string, processor: any) => {
    if (!env.REDIS_URI) return null;
    return new Worker(name, processor, { connection });
  },
};
`
      },
      "loaders/": {
        "express.ts": `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

export default (app: express.Application) => {
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));
};
`,
        "routes.ts": `import express from 'express';
import { Router } from "express";
import userRoutes from "../routes/user.routes";

export default (app: express.Application) => {
  const router = Router();
  router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Mount API routes
  app.use('/api/v1', router);
  app.use('/api/v1/users', userRoutes);
};
`,
        "swagger.ts": `import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API',
      version: '1.0.0',
      description: 'API documentation for your application.',
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
`
      },
      "routes/": {
        "index.ts": `import { Router } from "express";
import userRoutes from "./user.routes";

const router = Router();
router.use("/users", userRoutes);
export default router;
`,
        "user.routes.ts": `import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { validateWith } from "../middlewares/validate";
import { createUserSchema, updateUserSchema } from "../validations/joi/user.validation";

const router = Router();

router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);
router.post("/", validateWith(createUserSchema), userController.createUser);
router.patch("/:id", validateWith(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
`
      },
      "controllers/": {
        "user.controller.ts": `import * as userService from "../services/user.service";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  res.status(StatusCodes.OK).json({ data: users });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.status(StatusCodes.OK).json({ data: user });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(StatusCodes.CREATED).json({ data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(StatusCodes.OK).json({ data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.id);
  res.status(StatusCodes.NO_CONTENT).send();
});
`
      },
      "services/": {
        "user.service.ts": `import { User, UserDocument } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

export async function listUsers(): Promise<UserDocument[]> {
  return User.find().lean();
}

export async function getUserById(id: string): Promise<UserDocument> {
  const doc = await User.findById(id).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function createUser(payload: Partial<UserDocument>): Promise<UserDocument> {
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new ApiError(StatusCodes.CONFLICT, "Email already in use");
  const doc = await User.create(payload);
  return doc.toObject();
}

export async function updateUser(id: string, payload: Partial<UserDocument>): Promise<UserDocument> {
  const doc = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await User.findByIdAndDelete(id);
  if (!res) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return true;
}
`
      },
      "repositories/": {
        "user.repo.ts": `import { User, UserDocument } from "../models/user.model";
import { IRepository } from "./base.repo";

// A simple repository pattern for Mongoose models.
// It provides a thin, generic layer for CRUD operations.

export const userRepository: IRepository = {
  findById: (id: string) => User.findById(id).lean(),
  find: (query: any) => User.find(query).lean(),
  create: (payload: any) => User.create(payload),
  update: (id: string, payload: any) => User.findByIdAndUpdate(id, payload, { new: true }).lean(),
  delete: (id: string) => User.findByIdAndDelete(id).lean(),
};

interface IRepository {
  findById: (id: string) => Promise<UserDocument | null>;
  find: (query: any) => Promise<UserDocument[]>;
  create: (payload: any) => Promise<UserDocument>;
  update: (id: string, payload: any) => Promise<UserDocument | null>;
  delete: (id: string) => Promise<UserDocument | null>;
}
`
      },
      "models/": {
        "user.model.ts": `import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  email: string;
  role: "user" | "admin";
}

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>("User", userSchema);
`
      },
      "validators/": {
        "user.validator.ts": `import Joi from "joi";
import { z } from "zod";

export const joiUserSchema = {
  createUser: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid("user", "admin").default("user")
  }),
  updateUser: Joi.object({
    name: Joi.string().min(2).max(120),
    email: Joi.string().email(),
    role: Joi.string().valid("user", "admin")
  }).min(1)
};

export const zodUserSchema = {
  createUser: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    role: z.enum(["user", "admin"]).default("user")
  }),
  updateUser: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    role: z.enum(["user", "admin"]).optional()
  }).refine((v) => Object.keys(v).length > 0, { message: "At least one field must be provided" })
};
`
      },
      "middlewares/": {
        "auth.ts": `import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Simple auth example, a real implementation would be more complex
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
`,
        "error.ts": `import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export function notFound(_req: Request, res: Response, _next: NextFunction) {
  res.status(StatusCodes.NOT_FOUND).json({ error: "Not Found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";
  const meta = process.env.NODE_ENV !== "production" ? { stack: err.stack } : undefined;
  res.status(status).json({ error: message, ...(meta && { meta }) });
}
`,
        "validate.ts": `import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { AnyZodObject } from "zod";

export const validate = (schema: Schema | AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Determine validator based on schema type (Joi or Zod)
    if ('validate' in schema) { // Joi
      const { error, value } = (schema as Schema).validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new Error('Validation Error');
      }
      req.body = value;
    } else { // Zod
      const result = (schema as AnyZodObject).safeParse(req.body);
      if (!result.success) {
        throw new Error('Validation Error');
      }
      req.body = result.data;
    }
    next();
  } catch (err: any) {
    err.statusCode = 400; // Bad Request
    next(err);
  }
};
`,
        "notFound.ts": `import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export function notFound(_req: Request, res: Response, _next: NextFunction) {
  res.status(StatusCodes.NOT_FOUND).json({ error: "Not Found" });
}
`,
        "asyncHandler.ts": `import { Request, Response, NextFunction } from "express";

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
`
      },
      "jobs/": {
        "queues/": {
          "email.queue.ts": `import { Queue } from "bullmq";
import { env } from "../../config/env";

export const emailQueue = new Queue("emailQueue", {
  connection: {
    host: env.REDIS_URI,
    port: 6379,
  },
});

export const addEmailJob = (email: string, subject: string, body: string) => {
  emailQueue.add("sendEmail", { email, subject, body });
};
`,
        },
        "processors/": {
          "email.processor.ts": `import { Job, Worker } from "bullmq";
import { env } from "../../config/env";

const processor = async (job: Job) => {
  const { email, subject, body } = job.data;
  console.log(\`[EmailProcessor] Sending email to \${email} with subject "\${subject}"\`);
  // Simulate sending email
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("[EmailProcessor] Email sent successfully.");
};

export const emailWorker = new Worker("emailQueue", processor, {
  connection: {
    host: env.REDIS_URI,
    port: 6379,
  },
});
`,
        },
      },
      "sockets/": {
        "chat.gateway.ts": `import { Server, Socket } from "socket.io";
import { logger } from "../config/logger";

export const chatGateway = (io: Server) => {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket: Socket) => {
    logger.info("New client connected to chat namespace: " + socket.id);

    socket.on("joinRoom", (room: string) => {
      socket.join(room);
      logger.info(\`Client \${socket.id} joined room \${room}\`);
      chatNamespace.to(room).emit("message", \`\${socket.id} has joined the room.\`);
    });

    socket.on("sendMessage", (data: { room: string; message: string }) => {
      logger.info(\`Message from \${socket.id} in \${data.room}: \${data.message}\`);
      chatNamespace.to(data.room).emit("message", \`\${socket.id}: \${data.message}\`);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected: " + socket.id);
    });
  });
};
`
      },
      "events/": {
        "eventBus.ts": `import { EventEmitter } from "events";

export const eventBus = new EventEmitter();
`,
        "user.events.ts": `import { eventBus } from "./eventBus";

export const USER_CREATED_EVENT = "user.created";

export const publishUserCreated = (user: any) => {
  eventBus.emit(USER_CREATED_EVENT, user);
};

export const subscribeToUserCreated = (callback: (user: any) => void) => {
  eventBus.on(USER_CREATED_EVENT, callback);
};
`
      },
      "utils/": {
        "httpStatus.ts": `import { StatusCodes } from "http-status-codes";

export const httpStatus = StatusCodes;
`,
        "apiResponse.ts": `import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const apiResponse = {
  success: (res: Response, data: any, status: StatusCodes = StatusCodes.OK) => {
    res.status(status).json({ success: true, data });
  },
  error: (res: Response, message: string, status: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR) => {
    res.status(status).json({ success: false, error: message });
  },
};
`,
        "crypto.ts": `import crypto from "crypto";

export const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY || 'a-very-secret-key-that-is-32-bytes-long'), Buffer.from('initialization-vector'));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decrypt = (encryptedText: string) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY || 'a-very-secret-key-that-is-32-bytes-long'), Buffer.from('initialization-vector'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
`,
        "pagination.ts": `export const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};
`
      },
      "types/": {
        "express.d.ts": `import { UserDocument } from "../models/user.model";

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDocument;
  }
}
`,
      },
      "test/": {
        "setup.ts": `import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
`,
        "user.spec.ts": `import request from "supertest";
import { createServer } from "../../src/app";
import { User } from "../../src/models/user.model";

const app = createServer();

describe("User API", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should create a new user", async () => {
    const newUser = {
      name: "John Doe",
      email: "john@example.com",
    };
    const res = await request(app).post("/api/v1/users").send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("email", "john@example.com");
  });

  it("should get all users", async () => {
    await User.create({ name: "Jane Doe", email: "jane@example.com" });
    const res = await request(app).get("/api/v1/users");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
`,
      },
      "scripts/": {
        "seed.ts": `import mongoose from "mongoose";
import { User } from "../models/user.model";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/your-app-db");
    console.log("Connected to MongoDB for seeding.");

    const usersToSeed = [
      { name: "Admin User", email: "admin@example.com", role: "admin" },
      { name: "Normal User", email: "user@example.com", role: "user" },
    ];

    await User.deleteMany({});
    await User.insertMany(usersToSeed);

    console.log("Database seeded successfully with 2 users.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seed();
`,
        "create-admin.ts": `import mongoose from "mongoose";
import { User } from "../models/user.model";

const createAdmin = async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error("Usage: ts-node src/scripts/create-admin.ts <email>");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/your-app-db");
    console.log("Connected to MongoDB.");

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true, upsert: true }
    );

    console.log(\`User \${user.email} is now an admin.\`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdmin();
`,
      },
    }
  };
};

export default expressMongooseTsBoilerplate;