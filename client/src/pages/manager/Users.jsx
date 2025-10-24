import React, { useEffect, useMemo, useState } from "react";
import ManagerNav from "../../components/ManagerNav";

const ROLES = ["customer", "seller", "service-provider", "manager"]; // order matters

export default function ManagerUsers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [activeRole, setActiveRole] = useState("all");
  const [term, setTerm] = useState("");

  // Add Manager form
  const [showAdd, setShowAdd] = useState(false);
  const [mgrName, setMgrName] = useState("");
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrPhone, setMgrPhone] = useState("");
  const [mgrPassword, setMgrPassword] = useState("");
  const [formMsg, setFormMsg] = useState("");

  const nameRegex = /^[A-Za-z\s.-]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const formValid = useMemo(() => {
    const phone = (mgrPhone || "").replace(/\D/g, "");
    const nameOk = nameRegex.test((mgrName || "").trim());
    const emailOk = emailRegex.test((mgrEmail || "").trim());
    const phoneOk = phone === "" || /^\d{10}$/.test(phone);
    const passOk = (mgrPassword || "").length >= 6;
    return nameOk && emailOk && phoneOk && passOk;
  }, [mgrName, mgrEmail, mgrPhone, mgrPassword]);

  useEffect(() => {
    // Ensure manager pages render on a light background and not auth gradient
    document.body.classList.add("manager-theme");
    return () => document.body.classList.remove("manager-theme");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetch("/manager/api/users", {
          headers: { Accept: "application/json" },
        });
        if (resp.status === 401 || resp.status === 403) {
          window.location.href = "/login";
          return;
        }
        if (!resp.ok) throw new Error("Failed to load users");
        const data = await resp.json();
        if (!cancelled) {
          setAllUsers(data.users || []);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load users");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function filteredUsersByRole(role) {
    const lowerTerm = (term || "").toLowerCase();
    return allUsers
      .filter((u) => (role === "all" ? true : u.role === role))
      .filter((u) => {
        const hay = `${u._id} ${u.name || ""} ${u.email || ""} ${
          u.role || ""
        }`.toLowerCase();
        return hay.includes(lowerTerm);
      });
  }

  async function onAction(userId, action) {
    const confirmMsg =
      action === "suspend"
        ? "Are you sure you want to suspend this user?"
        : "Are you sure you want to restore this user?";
    if (!window.confirm(confirmMsg)) return;
    try {
      const resp = await fetch(`/manager/users/${action}/${userId}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (resp.status === 401 || resp.status === 403) {
        window.location.href = "/login";
        return;
      }
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success)
        throw new Error(data.message || "Action failed");
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, suspended: action === "suspend" } : u
        )
      );
    } catch (e) {
      setError(e.message || "Action failed");
    }
  }

  async function onCreateManager(e) {
    e.preventDefault();
    if (!formValid) return;
    setFormMsg("Creating manager...");
    try {
      const resp = await fetch("/manager/users/create-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: mgrName.trim(),
          email: mgrEmail.trim(),
          phone: (mgrPhone || "").replace(/\D/g, "").slice(0, 10),
          password: mgrPassword,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success)
        throw new Error(data.message || "Create failed");
      setAllUsers((prev) => [...prev, data.user]);
      setActiveRole("manager");
      setTerm("");
      setFormMsg("Manager created successfully.");
      setMgrPassword("");
    } catch (e) {
      setFormMsg(e.message || "Error creating manager");
    }
  }

  if (loading)
    return (
      <div className="main-content">
        <p>Loading users...</p>
      </div>
    );
  if (error)
    return (
      <div className="main-content">
        <p style={{ color: "#e74c3c" }}>{error}</p>
      </div>
    );

  return (
    <>
      <div className="navbar">
        <div className="logo">
          <h2>Manager's Panel</h2>
        </div>
        <ManagerNav />
      </div>

      <div className="main-content">
        <h2>User Management</h2>
        <div className="filter-toolbar">
          <div className="filter-search">
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="search-box"
              placeholder="Search users..."
            />
          </div>
          <div className="filter-actions">
            {["all", ...ROLES].map((role) => (
              <button
                key={role}
                className={`filter-btn ${activeRole === role ? "active" : ""}`}
                onClick={() => setActiveRole(role)}
                data-role={role}
              >
                {role === "all"
                  ? "All Users"
                  : role.charAt(0).toUpperCase() +
                    role.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Add Manager */}
        <div className="add-manager" style={{ margin: "10px 0 20px" }}>
          <button
            className="btn btn-view"
            onClick={() => setShowAdd((s) => !s)}
          >
            {showAdd ? "− Hide" : "+ Add Manager"}
          </button>
          {showAdd && (
            <form
              onSubmit={onCreateManager}
              style={{ marginTop: 12, maxWidth: 560 }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                  placeholder="Full name"
                  required
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
                <input
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  required
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                <input
                  value={mgrPhone}
                  onChange={(e) =>
                    setMgrPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="Phone (10 digits)"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
                <input
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  type="password"
                  placeholder="Password (min 6)"
                  minLength={6}
                  required
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  className="btn btn-approve"
                  disabled={!formValid}
                >
                  Create Manager
                </button>
                <button
                  type="button"
                  className="btn btn-suspend"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
              </div>
              {formValid ? null : (
                <div style={{ marginTop: 6, color: "#e74c3c" }}>
                  Please fill all fields correctly.
                </div>
              )}
              {formMsg && (
                <div className="status" style={{ marginTop: 6 }}>
                  {formMsg}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Tables per role */}
        {[activeRole === "all" ? "customer" : activeRole].map((roleKey) =>
          activeRole === "all" ? (
            <RoleSection
              key={roleKey}
              role={roleKey}
              users={filteredUsersByRole(roleKey)}
              onAction={onAction}
            />
          ) : (
            <RoleSection
              key={roleKey}
              role={roleKey}
              users={filteredUsersByRole(roleKey)}
              onAction={onAction}
            />
          )
        )}
        {activeRole === "all" &&
          ROLES.slice(1).map((rk) => (
            <RoleSection
              key={rk}
              role={rk}
              users={filteredUsersByRole(rk)}
              onAction={onAction}
            />
          ))}
      </div>
    </>
  );
}

function RoleSection({ role, users, onAction }) {
  return (
    <div className={`user-section ${role}-section active`} data-role={role}>
      <h3>{role.charAt(0).toUpperCase() + role.slice(1).replace("-", " ")}</h3>
      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>No users in this category.</td>
              </tr>
            ) : (
              users.map((u) => {
                const isManager = u.role === "manager";
                const actions = isManager ? (
                  <span>Not Allowed</span>
                ) : !u.suspended ? (
                  <button
                    className="btn btn-suspend"
                    onClick={() => onAction(u._id, "suspend")}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    className="btn btn-restore"
                    onClick={() => onAction(u._id, "restore")}
                  >
                    Restore
                  </button>
                );
                const statusBadge = u.suspended ? (
                  <span className="badge badge-danger">Suspended</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                );
                return (
                  <tr
                    key={u._id}
                    className={u.suspended ? "suspended-user" : undefined}
                  >
                    <td>{u._id}</td>
                    <td>{u.name || ""}</td>
                    <td>{u.email || ""}</td>
                    <td>{statusBadge}</td>
                    <td>{actions}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
