export interface User {
  id: number;
  username: string;
}

export interface Log {
  id: number;
  user_id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

export interface CategoryRow {
  category: string;
  amount: number;
}

export interface MonthlyRow {
  month: number;
  income: number;
  expense: number;
}

export interface Stats {
  monthly: MonthlyRow[];
  incomeCategories: CategoryRow[];
  expenseCategories: CategoryRow[];
  year: number;
  month: number;
}
