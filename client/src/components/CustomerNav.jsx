//customer nav component
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Nav.css";

/**
 * CustomerNav - shared navigation for all customer pages.
 * Features:
 * - Active link highlighting using NavLink
 * - Optional cart count badge via prop
 * - Responsive mobile toggle
 */
export default function CustomerNav({ cartCount = 0 }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/customer/index", label: "Products" },
    { to: "/customer/booking", label: "Services" },
    { to: "/customer/history", label: "Order History" },
    { to: "/customer/cart", label: "Cart", cart: true },
    { to: "/customer/chat", label: "Chat" },
    { to: "/customer/profile", label: "Profile" },
  ];

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
        aria-label="Customer navigation"
      >
        <div className="container">
          <div className="brand">
            <img src="/images3/logo2.jpg" alt="AutoCustomizer Logo" />
            <span>AutoCustomizer</span>
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
                  end={l.to === "/"}
                >
                  {l.cart ? (
                    <span className="cart-link">
                      <img src="/images/cart-icon.png" alt="Cart" />
                      <span>{l.label}</span>
                      {cartCount > 0 && (
                        <span
                          className="badge"
                          aria-label={`Items in cart: ${cartCount}`}
                        >
                          {cartCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    l.label
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              {/* Use a normal anchor for logout to hit server session endpoint */}
              <a
                href="/logout"
                onClick={handleLogout}
                className={
                  location.pathname === "/logout" ? "active" : undefined
                }
              >
                Logout
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
