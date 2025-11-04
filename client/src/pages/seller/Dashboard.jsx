import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";

function useLink(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

export default function SellerDashboard() {
  useLink("/Css/CStyle.css");
  useLink("/newstyle.css");
  useLink("/Css/sellerBase.css");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalEarnings: 0,
    totalOrders: 0,
  });
  const [stockAlerts, setStockAlerts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState({});

  const pieRef = useRef(null);
  const pieInst = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/seller/api/dashboard", {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const j = await res.json();
        if (!j.success)
          throw new Error(j.message || "Failed to load dashboard");
        if (cancelled) return;
        setStats({
          totalSales: j.totalSales || 0,
          totalEarnings: j.totalEarnings || 0,
          totalOrders: j.totalOrders || 0,
        });
        setStockAlerts(j.stockAlerts || []);
        setRecentOrders(j.recentOrders || []);
        setStatusDistribution(j.statusDistribution || {});
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pieRef.current) return;
    if (pieInst.current) pieInst.current.destroy();
    const labels = Object.keys(statusDistribution || {});
    const values = Object.values(statusDistribution || {});
    try {
      pieInst.current = new Chart(pieRef.current.getContext("2d"), {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: [
                "#6a11cb",
                "#2575fc",
                "#ff6f61",
                "#2ecc71",
                "#f1c40f",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    } catch {}
    return () => {
      if (pieInst.current) pieInst.current.destroy();
    };
  }, [statusDistribution]);

  return (
    <div className="seller-page">
      <nav className="navbar">
        <div className="brand">AutoCustomizer</div>
        <ul>
          <li>
            <a href="/seller/dashboard" className="active">
              Dashboard
            </a>
          </li>
          <li>
            <a href="/seller/profileSettings">Profile Settings</a>
          </li>
          <li>
            <a href="/seller/productmanagement">Products</a>
          </li>
          <li>
            <a href="/seller/orders">Orders</a>
          </li>
          <li>
            <a href="/logout">Logout</a>
          </li>
        </ul>
      </nav>

      <header>
        <h1>AutoCustomizer Seller Dashboard</h1>
      </header>

      <main className="seller-main">
        <section className="stats" id="statsCards">
          <div className="card">
            <h2>Total Sales</h2>
            <p id="totalSalesVal">{stats.totalSales}</p>
          </div>
          <div className="card">
            <h2>Total Earnings</h2>
            <p id="totalEarningsVal">₹{stats.totalEarnings}</p>
          </div>
          <div className="card">
            <h2>Total Orders</h2>
            <p id="totalOrdersVal">{stats.totalOrders}</p>
          </div>
        </section>

        <section className="alerts" style={{ marginTop: 30 }}>
          <h2>Stock Alerts</h2>
          <div id="stockAlerts">
            {stockAlerts.length ? (
              <ul>
                {stockAlerts.map((a, i) => (
                  <li key={i}>
                    <strong>{a.product}</strong> - Only {a.stock} left!
                  </li>
                ))}
              </ul>
            ) : (
              <p>All products are well-stocked.</p>
            )}
          </div>
        </section>

        <div
          className="orders-and-chart"
          style={{ display: "flex", flexWrap: "wrap", gap: 30, marginTop: 30 }}
        >
          <section className="orders" style={{ flex: 1, minWidth: 320 }}>
            <h2>Recent Orders</h2>
            <div id="recentOrdersWrap">
              {recentOrders.length ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          borderBottom: "1px solid #ccc",
                        }}
                      >
                        Order ID
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          borderBottom: "1px solid #ccc",
                        }}
                      >
                        Customer
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          borderBottom: "1px solid #ccc",
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o, i) => (
                      <tr key={i}>
                        <td>{o.orderId}</td>
                        <td>{o.customer}</td>
                        <td>{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No recent orders available.</p>
              )}
            </div>
          </section>

          <section className="pie-chart" style={{ flex: 1, minWidth: 320 }}>
            <h2>Order Status Distribution</h2>
            <div style={{ position: "relative", height: 300 }}>
              <canvas ref={pieRef} id="orderStatusChart" />
            </div>
          </section>
        </div>
      </main>

      <footer className="seller-footer">
        <p>© 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>

      {error ? (
        <p style={{ color: "red", textAlign: "center" }}>
          Failed to load dashboard: {error}
        </p>
      ) : null}

      {/* CSS guardrails to prevent bleed from other sections and keep visuals identical to legacy */}
      <style>{`
        .seller-page { background: linear-gradient(135deg, #f5f7fa, #c3cfe2); min-height: 100vh; }
        .seller-page .navbar { position: static !important; }
        .seller-page header { background: linear-gradient(135deg, #6a11cb, #2575fc); color:#fff; padding:30px 20px; text-align:center; box-shadow:0 4px 6px rgba(0,0,0,0.1); }
        .seller-page header h1 { margin:0; font-weight:600; }
      `}</style>
    </div>
  );
}
