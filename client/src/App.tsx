import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { User } from "./types";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";

type Page = "dashboard" | "logs";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setPage("dashboard");
  }

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="layout">
      <Navbar user={user} page={page} onNavigate={setPage} onLogout={handleLogout} />
      <main className="content">
        {page === "dashboard" ? <Dashboard /> : <Logs />}
      </main>
    </div>
  );
}
