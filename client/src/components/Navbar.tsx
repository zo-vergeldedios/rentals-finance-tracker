import type { User } from "../types";

interface Props {
  user: User;
  page: "dashboard" | "logs";
  onNavigate: (page: "dashboard" | "logs") => void;
  onLogout: () => void;
}

export default function Navbar({ user, page, onNavigate, onLogout }: Props) {
  return (
    <nav className="sidebar">
      <div className="brand">
        <span className="brand-dot" />
        <span className="brand-name">Rentals</span>
      </div>

      <ul className="nav-links">
        <li>
          <button
            type="button"
            className={page === "dashboard" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("dashboard")}
          >
            Dashboard
          </button>
        </li>
        <li>
          <button
            type="button"
            className={page === "logs" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("logs")}
          >
            Income &amp; Expenses
          </button>
        </li>
      </ul>

      <div className="sidebar-footer">
        <span className="user-name">@{user.username}</span>
        <button type="button" className="btn ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
