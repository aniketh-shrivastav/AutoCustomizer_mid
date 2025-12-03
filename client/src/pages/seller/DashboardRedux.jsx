import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chart from "chart.js/auto";
import { fetchDashboard, clearError } from "../redux/sellerDashboardSlice";

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

  const dispatch = useDispatch();
  const {
    totalSales,
    totalEarnings,
    totalOrders,
    stockAlerts,
    recentOrders,
    statusDistribution,
    loading,
    error
  } = useSelector(state => state.sellerDashboard);

  const pieRef = React.useRef(null);
  const pieInst = React.useRef(null);

  // Fetch dashboard on mount
  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  // Destroy previous chart instance
  useEffect(() => {
    if (pieInst.current) pieInst.current.destroy();
  }, []);

  // Render pie chart when data updates
  useEffect(() => {
    if (!pieRef.current || loading) return;
    if (pieInst.current) pieInst.current.destroy();

    const labels = Object.keys(statusDistribution || {});
    const values = Object.values(statusDistribution || {});

    if (labels.length === 0) return;

    try {
      pieInst.current = new Chart(pieRef.current.getContext("2d"), {
        type: "pie",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ["#6a11cb", "#2575fc", "#ff6f61", "#2ecc71", "#f1c40f"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    } catch (e) {
      console.error("Chart error:", e);
    }

    return () => {
      if (pieInst.current) pieInst.current.destroy();
    };
  }, [statusDistribution, loading]);

  return (
    <div className="seller-page">
      <nav className="navbar">
        <div className="brand">
          <img src="/images3/logo2.jpg" alt="AutoCustomizer" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <ul>
          <li><a href="/seller/dashboard" className="active">Dashboard</a></li>
          <li><a href="/seller/profileSettings">Profile Settings</a></li>
          <li><a href="/seller/productmanagement">Products</a></li>
          <li><a href="/seller/orders">Orders</a></li>
          <li><a href="/logout">Logout</a></li>
        </ul>
      </nav>

      <header>
        <h1>AutoCustomizer Seller Dashboard</h1>
      </header>

      <main className="seller-main">
        {error && (
          <div style={{
            background: "#fee", border: "1px solid #f88", color: "#c33",
            padding: "12px 16px", borderRadius: "8px", marginBottom: "20px"
          }}>
            <strong>Error:</strong> {error}
            <button onClick={() => dispatch(clearError())} style={{ marginLeft: "10px" }}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", fontSize: "1.1rem" }}>Loading dashboard...</div>
        ) : (
          <>
            <section className="stats" style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
              <div className="card" style={{ flex: 1, minWidth: "200px", background: "linear-gradient(135deg, #6a11cb, #2575fc)", color: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <h2>Total Sales</h2>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalSales}</p>
              </div>
              <div className="card" style={{ flex: 1, minWidth: "200px", background: "linear-gradient(135deg, #6a11cb, #2575fc)", color: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <h2>Total Earnings</h2>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>₹{totalEarnings}</p>
              </div>
              <div className="card" style={{ flex: 1, minWidth: "200px", background: "linear-gradient(135deg, #6a11cb, #2575fc)", color: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <h2>Total Orders</h2>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalOrders}</p>
              </div>
            </section>

            <section style={{ background: "#fff", padding: "20px", borderRadius: "10px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h2 style={{ marginTop: 0, color: "#6a11cb" }}>Stock Alerts</h2>
              {stockAlerts.length > 0 ? (
                <ul>
                  {stockAlerts.map((a, i) => (
                    <li key={i}><strong>{a.product}</strong> - Only {a.stock} left!</li>
                  ))}
                </ul>
              ) : (
                <p>All products are well-stocked.</p>
              )}
            </section>

            <div style={{ display: "flex", gap: "30px", marginTop: "30px", flexWrap: "wrap" }}>
              <section style={{ flex: 1, minWidth: "320px", background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h2 style={{ marginTop: 0, color: "#6a11cb" }}>Recent Orders</h2>
                {recentOrders.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Order ID</th>
                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Customer</th>
                        <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o, i) => (
                        <tr key={i}>
                          <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{o.orderId}</td>
                          <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{o.customer}</td>
                          <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No recent orders available.</p>
                )}
              </section>

              <section style={{ flex: 1, minWidth: "320px", background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h2 style={{ marginTop: 0, color: "#6a11cb" }}>Order Status Distribution</h2>
                <div style={{ position: "relative", height: 300 }}>
                  <canvas ref={pieRef} id="orderStatusChart" />
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      <footer className="seller-footer">
        <p>© 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>
    </div>
  );
}
