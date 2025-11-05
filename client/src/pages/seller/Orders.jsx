import React, { useEffect, useState } from "react";

function useLink(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const color =
    s === "pending"
      ? "#FFC107"
      : s === "confirmed"
      ? "#7e57c2"
      : s === "shipped"
      ? "#2196F3"
      : s === "delivered"
      ? "#4CAF50"
      : s === "cancelled"
      ? "#e53935"
      : "#546e7a";
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`status ${s}`}
      style={{
        padding: "6px 12px",
        borderRadius: 16,
        color: "#fff",
        display: "inline-block",
        background: color,
        fontSize: ".85rem",
      }}
    >
      {label}
    </span>
  );
}

export default function SellerOrders() {
  useLink("/Css/CStyle.css");
  useLink("/newstyle.css");
  useLink("/Css/sellerBase.css");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/seller/api/orders", {
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to load orders");
      setOrders(data.orders || []);
    } catch (e) {
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId, newStatus) {
    try {
      const res = await fetch(`/seller/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newStatus }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update status");
      }
      const out = await res.json().catch(() => ({ success: true }));
      if (out && out.success === false) {
        throw new Error(out.message || "Failed to update status");
      }
      // Re-fetch to ensure UI reflects persisted status from server
      await loadOrders();
    } catch (e) {
      alert(e.message || "Error updating order");
    }
  }

  const allStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="seller-page">
      <nav className="navbar">
        <div className="brand">AutoCustomizer</div>
        <ul>
          <li>
            <a href="/seller/dashboard">Dashboard</a>
          </li>
          <li>
            <a href="/seller/profileSettings">Profile Settings</a>
          </li>
          <li>
            <a href="/seller/productmanagement">Products</a>
          </li>
          <li>
            <a href="/seller/orders" className="active">
              Orders
            </a>
          </li>
          <li>
            <a href="/logout">Logout</a>
          </li>
        </ul>
      </nav>

      <header>
        <h1>Order Management</h1>
      </header>

      <main className="seller-main">
        <div
          className="container"
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#6a11cb" }}>Orders</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Order ID",
                    "Customer",
                    "Product",
                    "Qty",
                    "Delivery Address",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 10,
                        background: "#6a11cb",
                        color: "#fff",
                        textAlign: "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: 20 }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: 20, color: "red" }}
                    >
                      {error}
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 25,
                        color: "#888",
                      }}
                    >
                      No orders available.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const disabled = ["delivered", "cancelled"].includes(
                      String(o.status).toLowerCase()
                    );
                    return (
                      <tr key={o.orderId}>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {o.orderId}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {o.customerName}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {o.productName}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {o.quantity}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          {o.deliveryAddress}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          <StatusBadge status={o.status} />
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #ddd" }}
                        >
                          <div
                            className="form-inline"
                            style={{
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            <select
                              value={String(o.status).toLowerCase()}
                              disabled={disabled}
                              onChange={(e) =>
                                setOrders((list) =>
                                  list.map((x) =>
                                    x.orderId === o.orderId
                                      ? { ...x, status: e.target.value }
                                      : x
                                  )
                                )
                              }
                              style={{ padding: 6, borderRadius: 6 }}
                            >
                              {allStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn"
                              disabled={disabled}
                              style={{ marginLeft: 8 }}
                              onClick={(e) => {
                                e.preventDefault();
                                const current = orders.find(
                                  (x) => x.orderId === o.orderId
                                )?.status;
                                updateStatus(o.orderId, current);
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="seller-footer">
        <p>© 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>

      {/* Scoped CSS guardrails */}
      <style>{`
        .seller-page { background: linear-gradient(135deg, #f5f7fa, #c3cfe2); min-height: 100vh; }
        .seller-page .navbar { position: static !important; }
        .seller-page header { background: linear-gradient(135deg, #6a11cb, #2575fc); color:#fff; padding:30px 20px; text-align:center; box-shadow:0 4px 6px rgba(0,0,0,0.1); }
        .seller-page header h1 { margin:0; font-weight:600; }

        /* Make the Update button look enabled unless actually disabled */
        .seller-page .form-inline .btn {
          background: linear-gradient(135deg, #6a11cb, #2575fc) !important;
          color: #fff !important;
          border: none !important;
          padding: 8px 14px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          opacity: 1 !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          transition: transform .15s ease, box-shadow .15s ease, background .2s ease;
        }
        .seller-page .form-inline .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.18);
        }
        .seller-page .form-inline .btn:disabled {
          background: #d5d7de !important;
          color: #888 !important;
          cursor: not-allowed !important;
          opacity: .75 !important;
          box-shadow: none !important;
          transform: none !important;
        }
      `}</style>
    </div>
  );
}
