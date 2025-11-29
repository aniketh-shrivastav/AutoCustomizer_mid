import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "../../Css/sellerDashboard.css";

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
  // Add class to <body> for dashboard-specific CSS
  useEffect(() => {
    document.body.classList.add("seller-page");
    return () => {
      document.body.classList.remove("seller-page");
    };
  }, []);

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

    return () => (cancelled = true);
  }, []);

  // Pie chart setup
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

    return () => pieInst.current && pieInst.current.destroy();
  }, [statusDistribution]);

  return (
    <div>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <img
            src="/images3/logo2.jpg"
            alt="AutoCustomizer"
            style={{ height: "40px", objectFit: "contain" }}
          />
        </div>
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

      {/* HEADER */}
      <header>
        <h1>AutoCustomizer Seller Dashboard</h1>
      </header>

      {/* MAIN CONTENT */}
      <main className="seller-main">
        {/* Stat Cards */}
        <section className="stats">
          <div className="card">
            <h2>Total Sales</h2>
            <p>{stats.totalSales}</p>
          </div>
          <div className="card">
            <h2>Total Earnings</h2>
            <p>₹{stats.totalEarnings}</p>
          </div>
          <div className="card">
            <h2>Total Orders</h2>
            <p>{stats.totalOrders}</p>
          </div>
        </section>

        {/* Stock Alerts */}
        <section className="alerts" style={{ marginTop: 30 }}>
          <h2>Stock Alerts</h2>
          <div>
            {stockAlerts.length ? (
              <ul>
                {stockAlerts.map((a, i) => (
                  <li key={i}>
                    <strong>{a.product}</strong> — Only {a.stock} left!
                  </li>
                ))}
              </ul>
            ) : (
              <p>All products are well-stocked.</p>
            )}
          </div>
        </section>

        {/* Orders + Chart */}
        <div className="orders-and-chart">
          {/* Orders Table */}
          <section className="orders">
            <h2>Recent Orders</h2>
            {recentOrders.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
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
              <p>No recent orders.</p>
            )}
          </section>

          {/* Pie Chart */}
          <section className="pie-chart">
            <h2>Order Status Distribution</h2>
            <div style={{ position: "relative", height: 300 }}>
              <canvas ref={pieRef} />
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="seller-footer">
        <p>© 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>

      {error && (
        <p style={{ color: "red", textAlign: "center" }}>
          Failed to load dashboard: {error}
        </p>
      )}
    </div>
  );
}
