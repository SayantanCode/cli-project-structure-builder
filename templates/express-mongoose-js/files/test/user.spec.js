import request from "supertest";
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
