import { FormEvent, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { apiFetch } from "../api";
import type { Log } from "../types";
import MonthPicker from "../components/MonthPicker";
import { MONTH_NAMES, formatDate, formatMoney, todayInputValue } from "../utils";

const INCOME_CATEGORIES = ["Booking Income", "Cleaning Fee", "Security Deposit", "Other Income"];
const EXPENSE_CATEGORIES = [
  "Cleaning",
  "Utilities",
  "Maintenance",
  "Supplies",
  "Insurance",
  "Fees",
  "Mortgage",
  "Other",
];

export default function Logs() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayInputValue());

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function loadLogs() {
    try {
      const data = await apiFetch<Log[]>(`/logs?year=${year}&month=${month}`);
      setLogs(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    }
  }

  useEffect(() => {
    loadLogs();
  }, [year, month]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError("Amount must be a positive number");
      return;
    }
    if (!category.trim()) {
      setFormError("Category is required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<Log>("/logs", {
        method: "POST",
        body: { type, amount: numAmount, category: category.trim(), date },
      });
      setAmount("");
      setCategory("");
      setDate(todayInputValue());
      await loadLogs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save log");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/logs/${id}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete log");
    }
  }

  const totalIncome = logs.filter((l) => l.type === "income").reduce((s, l) => s + l.amount, 0);
  const totalExpense = logs.filter((l) => l.type === "expense").reduce((s, l) => s + l.amount, 0);
  const netProfit = totalIncome - totalExpense;

  function handleExport() {
    const rows: (string | number)[][] = [
      ["Rentals Finance Tracker"],
      [`Income & Expense Logs - ${MONTH_NAMES[month - 1]} ${year}`],
      [],
      ["Summary"],
      ["Income", totalIncome],
      ["Expenses", totalExpense],
      ["Net Profit", netProfit],
      [],
      ["Logs"],
      ["Date", "Type", "Category", "Amount"],
    ];
    logs.forEach((log) => {
      rows.push([formatDate(log.date), log.type, log.category, log.amount]);
    });

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 24 }, { wch: 14 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Logs");
    XLSX.writeFile(workbook, `rentals-logs-${year}-${String(month).padStart(2, "0")}.xlsx`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Income &amp; Expenses</h2>
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      <form className="log-form" onSubmit={handleSave}>
        <div className="log-form-row">
          <div className="segmented">
            <button
              type="button"
              className={type === "expense" ? "segment active expense" : "segment"}
              onClick={() => setType("expense")}
            >
              Expense
            </button>
            <button
              type="button"
              className={type === "income" ? "segment active income" : "segment"}
              onClick={() => setType("income")}
            >
              Income
            </button>
          </div>

          <label className="field">
            <span>Category</span>
            <input
              type="text"
              list="category-options"
              placeholder="Select or type a category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="field">
            <span>Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving..." : "Save log"}
          </button>
        </div>

        {formError && <p className="form-error">{formError}</p>}
      </form>

      <div className="totals">
        <div className="totals-item">
          <span>Income</span>
          <strong className="positive">{formatMoney(totalIncome)}</strong>
        </div>
        <div className="totals-item">
          <span>Expenses</span>
          <strong className="negative">{formatMoney(totalExpense)}</strong>
        </div>
        <div className="totals-item">
          <span>Net Profit</span>
          <strong className="net">{formatMoney(totalIncome - totalExpense)}</strong>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="table-card">
        <div className="table-card-header">
          <h3>Logs</h3>
          <button type="button" className="btn secondary" onClick={handleExport}>
            Export to Excel
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="muted">No logs for this month yet.</p>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th className="right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.date)}</td>
                  <td>
                    <span className={`badge ${log.type}`}>{log.type}</span>
                  </td>
                  <td>{log.category}</td>
                  <td className={`right ${log.type === "income" ? "positive" : "negative"}`}>
                    {log.type === "income" ? "+" : "-"}
                    {formatMoney(log.amount)}
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="btn icon danger"
                      onClick={() => handleDelete(log.id)}
                      aria-label={`Delete ${log.category} log`}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
