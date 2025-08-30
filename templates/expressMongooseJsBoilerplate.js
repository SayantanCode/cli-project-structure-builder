const expressMongooseJsBoilerplate = (projectName) => {
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
  "main": "server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "lint": "eslint . --ext .js",
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
    "eslint": "^9.4.0",
    "nodemon": "^3.1.3",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "mongodb-memory-server": "^10.0.0"
  }
}`,
    "pnpm-lock.yaml": "",
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

- \`app.js\`: Express app initialization, middleware, and route mounting.
- \`server.js\`: Entry point to bootstrap the server and database connection.
- \`config/\`: Environment variables, database connections, and other configurations.
- \`loaders/\`: Centralized setup for Express middleware, routes, and API documentation.
- \`routes/\`: Defines API endpoints.
- \`controllers/\`: Handles request logic and calls services.
- \`services/\`: Contains business logic.
- \`repositories/\`: A thin layer for database interactions (wrapping Mongoose models).
- \`models/\`: Mongoose schemas.
- \`validators/\`: Joi and Zod schemas for input validation.
- \`middlewares/\`: Custom Express middleware.
- \`utils/\`: Helper functions and classes (e.g., custom error handler, async handler).

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
- \`npm run lint\`: Run ESLint.
- \`npm test\`: Run Jest tests.

`,
    "app.js": `import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import loaders from "./loaders/index.js";
import { notFound, errorHandler } from "./middlewares/error.js";

/**
 * Creates and returns the Express application.
 * This function should only contain middleware and route loaders.
 * Server bootstrap logic is in server.js.
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
    "server.js": `import { createServer } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

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
      "index.js": `import { env } from "./env.js";
import { db } from "./db.js";
import { logger } from "./logger.js";
import { redisClient } from "./redis.js";
import { bullmq } from "./bullmq.js";
import { swagger } from "./swagger.js";
import { socket } from "./socket.js";

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
      "env.js": `import 'dotenv/config';
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
      "db.js": `import mongoose from "mongoose";
import { env } from "./env.js";

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
      "redis.js": `import { createClient } from "redis";
import { env } from "./env.js";

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
      "logger.js": `import pino from 'pino';
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
      "socket.js": `import { Server } from "socket.io";

export const socket = {
  init: (server) => {
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
      "bullmq.js": `import { Queue, Worker } from 'bullmq';
import { env } from './env.js';

const connection = {
  host: 'localhost',
  port: 6379,
  // Add more connection options as needed
};

// Check if redis is configured
if (!env.REDIS_URI) {
  console.warn("⚠️  REDIS_URI not set, BullMQ is disabled.");
}

export const bullmq = {
  createQueue: (name) => {
    if (!env.REDIS_URI) return null;
    return new Queue(name, { connection });
  },
  createWorker: (name, processor) => {
    if (!env.REDIS_URI) return null;
    return new Worker(name, processor, { connection });
  },
};
`,
    },
    "loaders/": {
      "index.js": `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

export default (app) => {
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));
};
`,
      "routes.js": `import { Router } from "express";
import userRoutes from "../routes/user.routes.js";

export default (app) => {
  const router = Router();
  router.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Mount API routes
  app.use('/api/v1', router);
  app.use('/api/v1/users', userRoutes);
};
`,
      "swagger.js": `import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
`,
    },
    "routes/": {
      "index.js": `import { Router } from "express";
import userRoutes from "./user.routes.js";

const router = Router();
router.use("/users", userRoutes);
export default router;
`,
      "user.routes.js": `import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { validateWith } from "../middlewares/validate.js";
import { createUserSchema, updateUserSchema } from "../validators/user.validator.js";

const router = Router();

router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);
router.post("/", validateWith(createUserSchema), userController.createUser);
router.patch("/:id", validateWith(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
`,
    },
    "controllers/": {
      "user.controller.js": `import * as userService from "../services/user.service.js";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await userService.listUsers();
  res.status(StatusCodes.OK).json({ data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(StatusCodes.OK).json({ data: user });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(StatusCodes.CREATED).json({ data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(StatusCodes.OK).json({ data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(StatusCodes.NO_CONTENT).send();
});
`,
    },
    "services/": {
      "user.service.js": `import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export async function listUsers() {
  return User.find().lean();
}

export async function getUserById(id) {
  const doc = await User.findById(id).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function createUser(payload) {
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new ApiError(StatusCodes.CONFLICT, "Email already in use");
  const doc = await User.create(payload);
  return doc.toObject();
}

export async function updateUser(id, payload) {
  const doc = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return doc;
}

export async function deleteUser(id) {
  const res = await User.findByIdAndDelete(id);
  if (!res) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  return true;
}
`,
    },
    "repositories/": {
      "user.repo.js": `import { User } from "../models/user.model.js";

// A simple repository pattern for Mongoose models.
// It provides a thin, generic layer for CRUD operations.

export const userRepository = {
  findById: (id) => User.findById(id).lean(),
  find: (query) => User.find(query).lean(),
  create: (payload) => User.create(payload),
  update: (id, payload) => User.findByIdAndUpdate(id, payload, { new: true }).lean(),
  delete: (id) => User.findByIdAndDelete(id).lean(),
};
`,
    },
    "models/": {
      "user.model.js": `import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
`,
    },
    "validators/": {
      "user.validator.js": `import Joi from "joi";
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
`,
    },
    "middlewares/": {
      "auth.js": `export const authMiddleware = (req, res, next) => {
  // Simple auth example, a real implementation would be more complex
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};
`,
      "error.js": `import { StatusCodes } from "http-status-codes";

export function notFound(_req, res, _next) {
  res.status(StatusCodes.NOT_FOUND).json({ error: "Not Found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal Server Error";
  const meta = process.env.NODE_ENV !== "production" ? { stack: err.stack } : undefined;
  res.status(status).json({ error: message, ...(meta && { meta }) });
}
`,
      "validate.js": `import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { joiUserSchema, zodUserSchema } from "../validators/user.validator.js";

// A utility to determine which validator to use
const getValidator = (name) => {
  if (env.VALIDATOR === 'joi') {
    return joiUserSchema[name];
  } else if (env.VALIDATOR === 'zod') {
    return zodUserSchema[name];
  }
  throw new Error('Invalid validator configured');
};

export const validateWith = (schema) => (req, res, next) => {
  try {
    if (env.VALIDATOR === 'joi') {
      const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new Error(error.details.map(d => d.message).join(', '));
      }
      req.body = value;
    } else if (env.VALIDATOR === 'zod') {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        throw new Error(result.error.issues.map(issue => \`\${issue.path.join('.')}: \${issue.message}\`).join(', '));
      }
      req.body = result.data;
    }
    next();
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: 'Validation Error', details: err.message });
  }
};
`,
      "asyncHandler.js": `export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
`,
    },
    "jobs/": {
      "queues/": {
        "email.queue.js": `import { Queue } from "bullmq";
import { env } from "../../config/env.js";

export const emailQueue = new Queue("emailQueue", {
  connection: {
    host: env.REDIS_URI,
    port: 6379,
  },
});

export const addEmailJob = (email, subject, body) => {
  emailQueue.add("sendEmail", { email, subject, body });
};
`,
      },
      "processors/": {
        "email.processor.js": `import { Worker } from "bullmq";
import { env } from "../../config/env.js";

const processor = async (job) => {
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
      "chat.gateway.js": `export const chatGateway = (io) => {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket) => {
    console.log("New client connected to chat namespace: " + socket.id);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(\`Client \${socket.id} joined room \${room}\`);
      chatNamespace.to(room).emit("message", \`\${socket.id} has joined the room.\`);
    });

    socket.on("sendMessage", (data) => {
      console.log(\`Message from \${socket.id} in \${data.room}: \${data.message}\`);
      chatNamespace.to(data.room).emit("message", \`\${socket.id}: \${data.message}\`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: " + socket.id);
    });
  });
};
`,
    },
    "events/": {
      "eventBus.js": `import { EventEmitter } from "events";

export const eventBus = new EventEmitter();
`,
      "user.events.js": `import { eventBus } from "./eventBus.js";

export const USER_CREATED_EVENT = "user.created";

export const publishUserCreated = (user) => {
  eventBus.emit(USER_CREATED_EVENT, user);
};

export const subscribeToUserCreated = (callback) => {
  eventBus.on(USER_CREATED_EVENT, callback);
};
`,
    },
    "utils/": {
      "httpStatus.js": `import { StatusCodes } from "http-status-codes";

export const httpStatus = StatusCodes;
`,
      "apiResponse.js": `import { StatusCodes } from "http-status-codes";

export const apiResponse = {
  success: (res, data, status = StatusCodes.OK) => {
    res.status(status).json({ success: true, data });
  },
  error: (res, message, status = StatusCodes.INTERNAL_SERVER_ERROR) => {
    res.status(status).json({ success: false, error: message });
  },
};
`,
      "ApiError.js": `import { StatusCodes } from "http-status-codes";

export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
`,
      "asyncHandler.js": `export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
`,
    },
    "test/": {
      "setup.js": `import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

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
      "user.spec.js": `import request from "supertest";
import { createServer } from "../../app.js";
import { User } from "../../models/user.model.js";

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
      "seed.js": `import mongoose from "mongoose";
import { User } from "../models/user.model.js";

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
      "create-admin.js": `import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const createAdmin = async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error("Usage: node src/scripts/create-admin.js <email>");
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
  };
};

export default expressMongooseJsBoilerplate;