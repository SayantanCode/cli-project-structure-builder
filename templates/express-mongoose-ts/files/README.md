# your-app

## Project Structure

This project follows a clean, modular architecture designed for scalability and maintainability.

### Key Directories

- `src/app.ts`: Express app initialization, middleware, and route mounting.
- `src/server.ts`: Entry point to bootstrap the server and database connection.
- `src/config/`: Environment variables, database connections, and other configurations.
- `src/loaders/`: Centralized setup for Express middleware, routes, and API documentation.
- `src/routes/`: Defines API endpoints.
- `src/controllers/`: Handles request logic and calls services.
- `src/services/`: Contains business logic.
- `src/repositories/`: A thin layer for database interactions (wrapping Mongoose models).
- `src/models/`: Mongoose schemas.
- `src/validators/`: Joi and Zod schemas for input validation.
- `src/middlewares/`: Custom Express middleware.
- `src/utils/`: Helper functions and classes (e.g., custom error handler, async handler).
- `src/types/`: TypeScript-specific type declarations.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-app.git
    cd your-app
    ```

2.  **Environment Setup:**
    - Create a `.env` file by copying `.env.example`.
    - Fill in your database and other configuration details.

3.  **Install Dependencies:**
    ```bash
    pnpm install # or npm install / yarn install
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:4000`.

## API Endpoints

- `GET /health`: Check the health of the server.

## Docker

- **Build and run with Docker:**
  ```bash
  docker-compose up --build
  ```
  This will launch the application, MongoDB, and Redis.

## Scripts

- `npm run dev`: Run the app in development mode with nodemon.
- `npm start`: Run the production build.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run lint`: Run ESLint.
- `npm test`: Run Jest tests.

