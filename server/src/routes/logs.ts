import { Router } from "express";
import { pool } from "../db";
import { asyncHandler } from "../auth";
import { monthBounds } from "../utils";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const year = parseInt(String(req.query.year), 10);
    const month = parseInt(String(req.query.month), 10);

    let query = "SELECT * FROM logs WHERE user_id = $1";
    const params: unknown[] = [userId];
    if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
      const [start, end] = monthBounds(year, month);
      query += " AND date >= $2 AND date < $3";
      params.push(start, end);
    }
    query += " ORDER BY date DESC, id DESC";

    const result = await pool.query(query, params);
    res.json(result.rows.map((row) => ({ ...row, amount: Number(row.amount) })));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { type, category, date } = req.body ?? {};
    const amount = Number(req.body?.amount);

    if (type !== "income" && type !== "expense") {
      res.status(400).json({ error: "Type must be 'income' or 'expense'" });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Amount must be a positive number" });
      return;
    }
    if (typeof category !== "string" || category.trim().length === 0) {
      res.status(400).json({ error: "Category is required" });
      return;
    }
    if (typeof date !== "string" || Number.isNaN(new Date(date).getTime())) {
      res.status(400).json({ error: "A valid date is required" });
      return;
    }

    const result = await pool.query(
      "INSERT INTO logs (user_id, type, amount, category, date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, type, amount, category.trim(), date]
    );
    const row = result.rows[0];
    res.status(201).json({ ...row, amount: Number(row.amount) });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid log id" });
      return;
    }
    const result = await pool.query(
      "DELETE FROM logs WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.json({ ok: true });
  })
);

export default router;
