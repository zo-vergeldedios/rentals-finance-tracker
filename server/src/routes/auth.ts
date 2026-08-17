import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { signToken, verifyToken } from "../auth";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const name = username.trim();
  if (name.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters long" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters long" });
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [name]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: "That username is already taken" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
    [name, hash]
  );
  const user = result.rows[0];
  res.status(201).json({ token: signToken(user.id), user });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const result = await pool.query("SELECT * FROM users WHERE username = $1", [
    username.trim(),
  ]);
  const user = result.rows[0];
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  res.json({
    token: signToken(user.id),
    user: { id: user.id, username: user.username },
  });
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const result = await pool.query("SELECT id, username FROM users WHERE id = $1", [userId]);
  if (result.rows.length === 0) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ user: result.rows[0] });
});

export default router;
