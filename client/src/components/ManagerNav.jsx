import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Nav.css";

/**
 * ManagerNav - navigation bar for manager role with responsive toggle.
 * Uses NavLink for SPA navigation and active state styling.
 */
export default function ManagerNav() {
  const [open, setOpen] = useState(false);
  const links = useMemo(
    () => [
      { to: "/manager/dashboard", label: "Dashboard" },
      { to: "/manager/users", label: "User Management" },
      { to: "/manager/profiles", label: "User Profiles" },
      { to: "/manager/orders", label: "Orders & Bookings" },
      { to: "/manager/payments", label: "Payments" },
      { to: "/manager/support", label: "Support" },
      { to: "/manager/chat", label: "Chat" },
    ],
    []
  );

  function backendBase() {
    const { protocol, hostname, port } = window.location;
    if (port === "5173") return `${protocol}//${hostname}:3000`;
    return "";
  }
  function handleLogout(e) {
    e.preventDefault();
    const next = encodeURIComponent(`${window.location.origin}/login`);
    window.location.href = `${backendBase()}/logout?next=${next}`;
  }

  return (
    <>
      <nav
        className="ac-navbar"
        role="navigation"
        aria-label="Manager navigation"
      >
        <div className="container">
          <div className="brand">
            <img src="/images3/logo2.jpg" alt="AutoCustomizer Logo" />
            <span>Manager Panel</span>
          </div>
          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
          <ul className={`nav-links ${open ? "open" : ""}`}>
            {links.map((l) => (
              <li key={l.to} onClick={() => setOpen(false)}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? "active" : undefined
                  }
                  end={false}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li>
              <a href="/logout" onClick={handleLogout}>
                Logout
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
