import React, { useEffect, useMemo } from "react";

export default function ManagerNav() {
  const links = useMemo(
    () => [
      { href: "/manager/dashboard", label: "Dashboard" },
      { href: "/manager/users", label: "User Management" },
      { href: "/manager/profiles", label: "User Profiles" },
      { href: "/manager/orders", label: "Orders & Bookings" },
      { href: "/manager/payments", label: "Payments" },
      { href: "/manager/support", label: "Support" },
      { href: "/logout", label: "Logout" },
    ],
    []
  );

  const path = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <nav>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className={l.href === path ? "active" : undefined}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
