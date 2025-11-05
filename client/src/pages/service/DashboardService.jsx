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

export default function ServiceDashboard() {
  // Match legacy CSS and icons
  useLink("/styles/dashboardService.css");
  useLink(
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
  );

  const [navOpen, setNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [serviceLabels, setServiceLabels] = useState([]);
  const [serviceCounts, setServiceCounts] = useState([]);
  const [totals, setTotals] = useState({
    earnings: 0,
    ongoing: 0,
    completed: 0,
    avgRating: "N/A",
    totalReviews: 0,
  });

  const pieRef = useRef(null);
  const barRef = useRef(null);
  const pieChart = useRef(null);
  const barChart = useRef(null);

  // Compute backend base for dev (Vite at 5173) vs prod (same-origin)
  const backendBase = useMemo(() => {
    try {
      const hinted = window.__API_BASE__ || process.env.REACT_APP_API_BASE;
      if (hinted) return hinted;
      const { protocol, hostname, port } = window.location;
      if (port === "5173") return `${protocol}//${hostname}:3000`;
      return ""; // same-origin in prod
    } catch {
      return "";
    }
  }, []);

  function handleLogout(e) {
    e.preventDefault();
    const next = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `${backendBase}/logout?next=${next}`;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/service/api/dashboard`, {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (!ct.includes("application/json")) {
          // Likely got HTML (dev server index or login page). Treat as unauthenticated.
          const text = await res.text().catch(() => "");
          if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Unexpected response format from server");
        }
        const data = await res.json();
        if (cancelled) return;
        setServiceLabels(data.serviceLabels || []);
        setServiceCounts(data.serviceCounts || []);
        setTotals(data.totals || {});
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Build charts when data available
    if (!pieRef.current || !barRef.current) return;

    // Cleanup previous instances
    if (pieChart.current) pieChart.current.destroy();
    if (barChart.current) barChart.current.destroy();

    try {
      const pieCtx = pieRef.current.getContext("2d");
      pieChart.current = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: serviceLabels,
          datasets: [
            {
              data: serviceCounts,
              backgroundColor: [
                "#1abc9c",
                "#3498db",
                "#9b59b6",
                "#f1c40f",
                "#e74c3c",
                "#2ecc71",
                "#e67e22",
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

      const barCtx = barRef.current.getContext("2d");
      barChart.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          datasets: [
            {
              label: "Earnings",
              data: [1500, 2200, 1800, 2500],
              backgroundColor: "#1abc9c",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Earnings (₹)" },
            },
            x: { title: { display: true, text: "Weeks" } },
          },
          plugins: {
            title: {
              display: true,
              text: "Monthly Earnings Overview (Weekly Basis)",
            },
          },
        },
      });
    } catch (e) {
      // ignore chart errors in case DOM not ready
    }

    return () => {
      if (pieChart.current) pieChart.current.destroy();
      if (barChart.current) barChart.current.destroy();
    };
  }, [serviceLabels, serviceCounts]);

  const activity = useMemo(
    () => [
      {
        icon: "fa-check-circle",
        text: "Completed: Brake Repair for Karthick",
        time: "2 hours ago",
      },
      {
        icon: "fa-tools",
        text: "Started: Oil Change for Suresh",
        time: "4 hours ago",
      },
      {
        icon: "fa-star",
        text: "New Review: 5 stars from Harish",
        time: "1 day ago",
      },
    ],
    []
  );

  return (
    <>
      <nav className="navbar">
        <div className="logo-brand">
          <img src="/images3/logo2.jpg" alt="Logo" className="logo" />
          <span className="brand">AutoCustomizer</span>
        </div>
        <a
          href="#"
          className="menu-btn"
          onClick={(e) => {
            e.preventDefault();
            setSidebarOpen((s) => !s);
          }}
        >
          ☰
        </a>
        <div className={`nav-links ${navOpen ? "active" : ""}`} id="navLinks">
          <a href="/service/dashboard" className="active">
            Dashboard
          </a>
          <a href="/service/profileSettings">Profile Settings</a>
          <a href="/service/bookingManagement">Booking Management</a>
          <a href="/service/reviews">Reviews & Ratings</a>
          <a href="/logout" onClick={handleLogout}>
            Logout
          </a>
        </div>
      </nav>

      <div className={`sidebar ${sidebarOpen ? "active" : ""}`} id="sidebar">
        <a className="close-btn" onClick={() => setSidebarOpen(false)}>
          Close ×
        </a>
        <a href="/service/dashboard">
          <i className="fas fa-tachometer-alt" /> Dashboard
        </a>
        <a href="/service/profileSettings">
          <i className="fas fa-user-cog" /> Profile Settings
        </a>
        <a href="/service/bookingManagement">
          <i className="fas fa-calendar-alt" /> Bookings
        </a>
        <a href="/service/customerCommunication">
          <i className="fas fa-comments" /> Communication
        </a>
        <a href="/service/earnings">
          <i className="fas fa-money-bill-wave" /> Earnings
        </a>
        <a href="/service/reviews">
          <i className="fas fa-star" /> Reviews
        </a>
        <a href="/logout" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt" /> Logout
        </a>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Welcome! Here's your daily overview.</h2>
        </div>

        <div className="cards" id="metricCards">
          <div className="card">
            <div className="card-icon">
              <i className="fas fa-rupee-sign"></i>
            </div>
            <div className="card-content">
              <h2>Total Earnings</h2>
              <p className="amount" id="earningsValue">
                ₹{totals.earnings || 0}
              </p>
              <p className="subtext">After 20% commission</p>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">
              <i className="fas fa-tools"></i>
            </div>
            <div className="card-content">
              <h2>Confirmed Services</h2>
              <p className="amount" id="ongoingValue">
                {totals.ongoing || 0}
              </p>
              <p className="subtext">Currently active</p>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="card-content">
              <h2>Ready for Delivery</h2>
              <p className="amount" id="completedValue">
                {totals.completed || 0}
              </p>
              <p className="subtext">Total completed</p>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">
              <i className="fas fa-smile"></i>
            </div>
            <div className="card-content">
              <h2>Customer Satisfaction</h2>
              <p className="amount" id="ratingValue">
                {totals.avgRating ?? "N/A"}/5
              </p>
              <p className="subtext" id="reviewsValue">
                Based on {totals.totalReviews || 0} reviews
              </p>
            </div>
          </div>
        </div>

        <div className="charts">
          <div className="chart-card">
            <h2>Service Distribution</h2>
            <div className="chart-wrapper" style={{ height: 300 }}>
              <canvas ref={pieRef} id="servicePieChart"></canvas>
            </div>
          </div>
          <div className="chart-card">
            <h2>Monthly Earnings Overview (Weekly Basis)</h2>
            <div className="chart-wrapper" style={{ height: 300 }}>
              <canvas ref={barRef} id="earningsBarChart"></canvas>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <ul className="activity-list" id="activityList">
            {activity.map((a, idx) => (
              <li key={idx}>
                <i className={`fas ${a.icon}`}></i>
                <span>{a.text}</span>
                <span className="time">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error ? (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            right: 12,
            background: "#e74c3c",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Minor visual guardrails to ensure activity text is visible regardless of global theme overrides */}
      <style>{`
        .activity-list span { color: #0f2944; }
        .activity-list .time { color: #666; }
      `}</style>
    </>
  );
}
