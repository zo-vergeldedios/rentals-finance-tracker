import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createServer } from "pglite-server";
import type { Express } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: Express;
let pgServer: ReturnType<typeof createServer>;
let request: typeof import("supertest")["default"];

async function getFreePort(): Promise<number> {
  const net = await import("node:net");
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();
      if (address && typeof address === "object") {
        const port = address.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error("No port")));
      }
    });
    srv.on("error", reject);
  });
}

before(async () => {
  process.env.JWT_SECRET = "test-secret";

  const db = new PGlite();
  await db.waitReady;

  const port = await getFreePort();
  pgServer = createServer(db);
  await new Promise<void>((resolve) => pgServer.listen(port, resolve));

  process.env.DATABASE_URL = `postgres://postgres@localhost:${port}`;

  const [{ initDb }, { default: express }, supertest, { default: authRouter }, { default: logsRouter }, { default: statsRouter }, { requireAuth }] =
    await Promise.all([
      import("../src/db"),
      import("express"),
      import("supertest"),
      import("../src/routes/auth"),
      import("../src/routes/logs"),
      import("../src/routes/stats"),
      import("../src/auth"),
    ]);

  await initDb();
  request = supertest.default;

  app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use("/api/logs", requireAuth, logsRouter);
  app.use("/api/stats", requireAuth, statsRouter);
});

after(async () => {
  if (pgServer) {
    await new Promise<void>((resolve) => pgServer.close(() => resolve()));
  }
});

describe("rentals finance tracker API", () => {
  let token: string;

  it("rejects register with a taken username", async () => {
    const r1 = await request(app)
      .post("/api/auth/register")
      .send({ username: "host", password: "password123" });
    assert.equal(r1.status, 201);

    const r2 = await request(app)
      .post("/api/auth/register")
      .send({ username: "host", password: "password123" });
    assert.equal(r2.status, 409);
    assert.match(r2.body.error, /taken/i);
  });

  it("logs in and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "host", password: "password123" });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    token = res.body.token;
  });

  it("rejects bad login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "host", password: "wrongpassword" });
    assert.equal(res.status, 401);
  });

  it("rejects unauthenticated log access", async () => {
    const res = await request(app).get("/api/logs");
    assert.equal(res.status, 401);
  });

  it("creates logs and lists them for the month", async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const income = await request(app)
      .post("/api/logs")
      .set(auth)
      .send({ type: "income", amount: 500, category: "Booking Income", date: "2026-08-10" });
    assert.equal(income.status, 201);

    const expense = await request(app)
      .post("/api/logs")
      .set(auth)
      .send({ type: "expense", amount: 120.5, category: "Cleaning", date: "2026-08-12" });
    assert.equal(expense.status, 201);

    const outside = await request(app)
      .post("/api/logs")
      .set(auth)
      .send({ type: "expense", amount: 50, category: "Other", date: "2026-07-01" });
    assert.equal(outside.status, 201);

    const list = await request(app).get("/api/logs?year=2026&month=8").set(auth);
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 2);
  });

  it("rejects invalid log payloads", async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const badAmount = await request(app)
      .post("/api/logs")
      .set(auth)
      .send({ type: "expense", amount: -5, category: "Cleaning", date: "2026-08-01" });
    assert.equal(badAmount.status, 400);

    const noCategory = await request(app)
      .post("/api/logs")
      .set(auth)
      .send({ type: "expense", amount: 10, category: "", date: "2026-08-01" });
    assert.equal(noCategory.status, 400);
  });

  it("computes stats for the year and month", async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const res = await request(app).get("/api/stats?year=2026&month=8").set(auth);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.monthly[7], { month: 8, income: 500, expense: 120.5 });
    assert.deepEqual(res.body.incomeCategories, [{ category: "Booking Income", amount: 500 }]);
    assert.deepEqual(res.body.expenseCategories, [{ category: "Cleaning", amount: 120.5 }]);
  });

  it("deletes a log", async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const list = await request(app).get("/api/logs?year=2026&month=8").set(auth);
    const id = list.body[0].id;
    const del = await request(app).delete(`/api/logs/${id}`).set(auth);
    assert.equal(del.status, 200);

    const list2 = await request(app).get("/api/logs?year=2026&month=8").set(auth);
    assert.equal(list2.body.length, 1);
  });
});
