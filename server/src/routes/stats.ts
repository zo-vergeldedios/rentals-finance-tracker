import { Router } from "express";
import { pool } from "../db";
import { asyncHandler } from "../auth";
import { monthBounds } from "../utils";

const router = Router();

interface CategoryRow {
  category: string;
  amount: number;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const now = new Date();
    const year = parseInt(String(req.query.year), 10) || now.getFullYear();
    const month = parseInt(String(req.query.month), 10) || now.getMonth() + 1;

    const monthlyResult = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM date)::int AS month,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM logs
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY month
       ORDER BY month`,
      [userId, year]
    );

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));
    for (const row of monthlyResult.rows) {
      monthly[row.month - 1].income = Number(row.income);
      monthly[row.month - 1].expense = Number(row.expense);
    }

    const safeMonth = Math.min(Math.max(month, 1), 12);
    const [start, end] = monthBounds(year, safeMonth);
    const categoryQuery = `
      SELECT category, SUM(amount) AS amount
      FROM logs
      WHERE user_id = $1
        AND type = $2
        AND date >= $3
        AND date < $4
      GROUP BY category
      ORDER BY amount DESC`;

    const incomeResult = await pool.query(categoryQuery, [userId, "income", start, end]);
    const expenseResult = await pool.query(categoryQuery, [userId, "expense", start, end]);

    const incomeCategories: CategoryRow[] = incomeResult.rows.map((r) => ({
      category: r.category,
      amount: Number(r.amount),
    }));
    const expenseCategories: CategoryRow[] = expenseResult.rows.map((r) => ({
      category: r.category,
      amount: Number(r.amount),
    }));

    res.json({ monthly, incomeCategories, expenseCategories, year, month: safeMonth });
  })
);

export default router;
