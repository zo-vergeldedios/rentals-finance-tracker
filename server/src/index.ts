import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { initDb } from "./db";
import { requireAuth } from "./auth";
import authRouter from "./routes/auth";
import logsRouter from "./routes/logs";
import statsRouter from "./routes/stats";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/logs", requireAuth, logsRouter);
app.use("/api/stats", requireAuth, statsRouter);

app.use((err: Error, _req: Request, res: Response) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
