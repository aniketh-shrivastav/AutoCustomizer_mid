import React, { useEffect, useMemo, useRef, useState } from "react";
import ManagerNav from "../../components/ManagerNav";
import Chart from "chart.js/auto";

function formatCurrency(v) {
  return "₹" + Number(v || 0).toFixed(2);
}

function ProductTable({ title, products, type }) {
  if (!products || products.length === 0) {
    return (
      <div className="product-tabs">
        <h2>{title}</h2>
        <p className="empty-state">No {type} products.</p>
      </div>
    );
  }
  return (
    <div className="product-tabs">
      <h2>{title}</h2>
      <div className="table-responsive">
        <table className="generic-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Description</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: 50, height: 50, objectFit: "cover" }}
                    />
                  ) : (
                    "No image"
                  )}
                </td>
                <td>{p.name || ""}</td>
                <td>{(p.seller && p.seller.name) || "N/A"}</td>
                <td>{formatCurrency(p.price)}</td>
                <td>{p.category || "N/A"}</td>
                <td>{p.brand || "N/A"}</td>
                <td>{p.description || "No description"}</td>
                <td>{p.quantity || 0}</td>
                <td>
                  {type === "pending" && (
                    <>
                      <form
                        method="POST"
                        action={`/manager/products/${p._id}/approve`}
                        style={{ display: "inline" }}
                      >
                        <button type="submit" className="btn btn-approve">
                          Approve
                        </button>
                      </form>
                      <form
                        method="POST"
                        action={`/manager/products/${p._id}/reject`}
                        style={{ display: "inline" }}
                      >
                        <button type="submit" className="btn btn-suspend">
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                  {type === "approved" && (
                    <form
                      method="POST"
                      action={`/manager/products/${p._id}/reject`}
                      style={{ display: "inline" }}
                    >
                      <button type="submit" className="btn btn-suspend">
                        Reject
                      </button>
                    </form>
                  )}
                  {type === "rejected" && (
                    <form
                      method="POST"
                      action={`/manager/products/${p._id}/approve`}
                      style={{ display: "inline" }}
                    >
                      <button type="submit" className="btn btn-approve">
                        Approve
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const userDistRef = useRef(null);
  const revenueRef = useRef(null);
  const growthRef = useRef(null);
  const userDistChart = useRef();
  const revenueChart = useRef();
  const growthChart = useRef();

  useEffect(() => {
    // Ensure manager pages render on a light background and not auth gradient
    document.body.classList.add("manager-theme");
    return () => document.body.classList.remove("manager-theme");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/manager/api/dashboard", {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
          return;
        }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Network error");
        const d = await res.json();
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load dashboard data.");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      // cleanup charts
      userDistChart.current?.destroy?.();
      revenueChart.current?.destroy?.();
      growthChart.current?.destroy?.();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    // Draw charts
    userDistChart.current?.destroy?.();
    revenueChart.current?.destroy?.();
    growthChart.current?.destroy?.();

    if (userDistRef.current) {
      userDistChart.current = new Chart(userDistRef.current, {
        type: "pie",
        data: {
          labels: ["Customers", "Service Providers", "Sellers", "Manager"],
          datasets: [
            {
              data: data.userCounts,
              backgroundColor: ["#4299e1", "#48bb78", "#ed8936", "#9f7aea"],
            },
          ],
        },
        options: { plugins: { legend: { position: "bottom" } } },
      });
    }

    if (revenueRef.current) {
      revenueChart.current = new Chart(revenueRef.current, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Total Revenue",
              data: [8500, 9200, 7800, 10500, 11200, 9800],
              backgroundColor: "#4299e1",
              borderRadius: 5,
            },
            {
              label: "Commission (20%)",
              data: [1700, 1840, 1560, 2100, 2240, 1960],
              backgroundColor: "#48bb78",
              borderRadius: 5,
            },
          ],
        },
      });
    }

    if (growthRef.current) {
      growthChart.current = new Chart(growthRef.current, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Total Users",
              data: [850, 950, 1050, 1150, 1200, 1234],
              borderColor: "#4299e1",
              tension: 0.3,
              fill: false,
            },
            {
              label: "Service Providers",
              data: [200, 230, 260, 290, 320, 340],
              borderColor: "#48bb78",
              tension: 0.3,
              fill: false,
            },
            {
              label: "Sellers",
              data: [100, 120, 150, 180, 210, 230],
              borderColor: "#ed8936",
              tension: 0.3,
              fill: false,
            },
          ],
        },
      });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="main-content">
        <p>Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="main-content">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="navbar">
        <div className="logo">
          <h2>Manager's Panel</h2>
        </div>
        <div id="manager-nav">
          <ManagerNav />
        </div>
      </div>

      <div className="main-content">
        <h1>Dashboard Overview</h1>

        <div className="stats-grid" id="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="number">{data.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Total Earnings</h3>
            <p className="number">{formatCurrency(data.totalEarnings)}</p>
          </div>
          <div className="stat-card">
            <h3>Commission (20%)</h3>
            <p className="number">{formatCurrency(data.commission)}</p>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-wrapper">
            <h2>User Distribution</h2>
            <div className="chart-box">
              <canvas ref={userDistRef} />
            </div>
          </div>
          <div className="chart-wrapper">
            <h2>Monthly Revenue & Commission</h2>
            <div className="chart-box">
              <canvas ref={revenueRef} />
            </div>
          </div>
          <div className="chart-wrapper">
            <h2>User Growth</h2>
            <div className="chart-box">
              <canvas ref={growthRef} />
            </div>
          </div>
        </div>

        <div className="product-tabs">
          <h2>Product Approval</h2>
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
              data-tab="pending"
            >
              Pending
            </button>
            <button
              className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
              data-tab="approved"
            >
              Approved
            </button>
            <button
              className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
              data-tab="rejected"
            >
              Rejected
            </button>
          </div>

          {activeTab === "pending" && (
            <div className="tab-content" style={{ display: "block" }}>
              <ProductTable
                title="Pending"
                products={data.pendingProducts}
                type="pending"
              />
            </div>
          )}
          {activeTab === "approved" && (
            <div className="tab-content" style={{ display: "block" }}>
              <ProductTable
                title="Approved"
                products={data.approvedProducts}
                type="approved"
              />
            </div>
          )}
          {activeTab === "rejected" && (
            <div className="tab-content" style={{ display: "block" }}>
              <ProductTable
                title="Rejected"
                products={data.rejectedProducts}
                type="rejected"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
