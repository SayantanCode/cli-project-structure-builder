import { createServer } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function bootstrap() {
  await connectDB();
  const app = createServer();
  const port = Number(env.PORT || 4000);
  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
