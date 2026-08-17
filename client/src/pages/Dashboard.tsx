import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../api";
import type { Stats } from "../types";
import MonthPicker from "../components/MonthPicker";
import { MONTH_NAMES, formatMoney } from "../utils";

const COLORS = ["#3B82F6", "#22C55E", "#F97316", "#8B5CF6", "#EF4444", "#06B6D4"];

const PIE_STROKE = "#18181B";

const AXIS_TICK = { fontSize: 12, fill: "#A1A1AA" };

const TOOLTIP_STYLE = {
  background: "#242428",
  border: "1px solid #3F3F46",
  borderRadius: 8,
  color: "#F5F5F5",
};

const LABEL_STYLE = { color: "#F5F5F5" };

export default function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStats(null);
    apiFetch<Stats>(`/stats?year=${year}&month=${month}`)
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"));
  }, [year, month]);

  if (error) {
    return <p className="error-text">{error}</p>;
  }
  if (!stats) {
    return <p className="muted">Loading dashboard...</p>;
  }

  const totalIncome = stats.monthly.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = stats.monthly.reduce((sum, m) => sum + m.expense, 0);
  const avgIncome = totalIncome / 12;
  const avgExpense = totalExpense / 12;
  const avgNet = avgIncome - avgExpense;

  const barData = stats.monthly.map((m) => ({
    name: MONTH_NAMES[m.month - 1].slice(0, 3),
    net: m.income - m.expense,
  }));

  const incomePie = stats.incomeCategories;
  const expensePie = stats.expenseCategories;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Average monthly net profit</span>
          <span className={avgNet >= 0 ? "stat-value positive" : "stat-value negative"}>
            {formatMoney(avgNet)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average monthly income</span>
          <span className="stat-value positive">{formatMoney(avgIncome)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average monthly expense</span>
          <span className="stat-value negative">{formatMoney(avgExpense)}</span>
        </div>
      </div>

      <div className="chart-card">
        <h3>Monthly net profit ({year})</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3F3F46" />
            <XAxis dataKey="name" tick={AXIS_TICK} stroke="#3F3F46" />
            <YAxis tick={AXIS_TICK} stroke="#3F3F46" />
            <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={LABEL_STYLE} />
            <Bar dataKey="net" name="Net profit">
              {barData.map((entry) => (
                <Cell key={entry.name} fill={entry.net >= 0 ? "#22C55E" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Income by category</h3>
          <p className="chart-subtitle">
            {MONTH_NAMES[stats.month - 1]} {stats.year}
          </p>
          {incomePie.length === 0 ? (
            <p className="muted">No income recorded for this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={incomePie} dataKey="amount" nameKey="category" outerRadius={100} stroke={PIE_STROKE} strokeWidth={2}>
                  {incomePie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={LABEL_STYLE} />
                <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Expense by category</h3>
          <p className="chart-subtitle">
            {MONTH_NAMES[stats.month - 1]} {stats.year}
          </p>
          {expensePie.length === 0 ? (
            <p className="muted">No expenses recorded for this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expensePie} dataKey="amount" nameKey="category" outerRadius={100} stroke={PIE_STROKE} strokeWidth={2}>
                  {expensePie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} itemStyle={LABEL_STYLE} />
                <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
