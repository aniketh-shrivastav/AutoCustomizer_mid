import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CustomerNav from "../../components/CustomerNav";
import { fetchCustomerHistory } from "../../store/customerSlice";

const STALE_AFTER_MS = 1000 * 60 * 5; // 5 minutes

function useLink(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

const ORDER_STATUS_STYLES = {
  pending: {
    label: "Pending",
    color: "#b45309",
    background: "#fef3c7",
  },
  confirmed: {
    label: "Confirmed",
    color: "#1d4ed8",
    background: "#dbeafe",
  },
  shipped: {
    label: "Shipped",
    color: "#6d28d9",
    background: "#ede9fe",
  },
  delivered: {
    label: "Delivered",
    color: "#047857",
    background: "#d1fae5",
  },
  cancelled: {
    label: "Cancelled",
    color: "#b91c1c",
    background: "#fee2e2",
  },
  default: {
    label: "Processing",
    color: "#374151",
    background: "#e5e7eb",
  },
};

const SERVICE_STATUS_STYLES = {
  waiting: {
    label: "Waiting for Confirmation",
    color: "#b45309",
    background: "#fef3c7",
  },
  confirmed: {
    label: "Confirmed",
    color: "#1d4ed8",
    background: "#dbeafe",
  },
  delivered: {
    label: "Delivered",
    color: "#047857",
    background: "#d1fae5",
  },
  rejected: {
    label: "Rejected",
    color: "#b91c1c",
    background: "#fee2e2",
  },
  default: {
    label: "In Progress",
    color: "#374151",
    background: "#e5e7eb",
  },
};

function renderStatusPill(style) {
  return (
    <span
      className="status-pill"
      style={{
        background: style.background,
        color: style.color,
        borderColor: style.color,
      }}
    >
      <span
        className="status-dot"
        style={{ background: style.color }}
        aria-hidden="true"
      />
      {style.label}
    </span>
  );
}

export default function CustomerHistory() {
  useLink("/styles/styles.css");
  function handleLogout(e) {
    e.preventDefault();
    const next = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `${backendBase}/logout?next=${next}`;
  }

  // Compute backend base URL for downloads. In dev (5173) point to 3000; in prod use same-origin.

  const backendBase = useMemo(() => {
    try {
      const hinted = window.__API_BASE__ || process.env.REACT_APP_API_BASE;
      if (hinted) return hinted;
      const { protocol, hostname, port } = window.location;
      if (port === "5173") return `${protocol}//${hostname}:3000`;
      return ""; // same-origin
    } catch {
      return "";
    }
  }, []);

  const dispatch = useDispatch();
  const { history, status, error, lastFetched } = useSelector(
    (state) => state.customer
  );
  const { upcomingOrders = [], pastOrders = [], bookings = [] } = history || {};
  const loading = status === "loading" || status === "idle";

  // Rating modal state
  const [showRating, setShowRating] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState("");
  const [ratingValue, setRatingValue] = useState("");
  const [ratingReview, setRatingReview] = useState("");

  useEffect(() => {
    const isStale =
      !lastFetched ||
      Date.now() - lastFetched > STALE_AFTER_MS ||
      status === "idle";
    if (isStale && status !== "loading") {
      dispatch(fetchCustomerHistory());
    }
  }, [dispatch, status, lastFetched]);

  function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString();
  }

  function statusSpan(status) {
    const key = String(status || "").toLowerCase();
    const style = ORDER_STATUS_STYLES[key] || ORDER_STATUS_STYLES.default;
    return renderStatusPill(style);
  }

  function serviceStatusSpan(status, id) {
    const normalized = String(status || "").toLowerCase();
    const style =
      normalized === "open"
        ? SERVICE_STATUS_STYLES.waiting
        : normalized === "confirmed"
        ? SERVICE_STATUS_STYLES.confirmed
        : normalized === "ready"
        ? SERVICE_STATUS_STYLES.delivered
        : normalized === "rejected"
        ? SERVICE_STATUS_STYLES.rejected
        : SERVICE_STATUS_STYLES.default;

    return (
      <>
        {renderStatusPill(style)}
        {normalized === "open" && (
          <>
            <br />
            <button className="cancel-btn" onClick={() => cancelService(id)}>
              Cancel Service
            </button>
          </>
        )}
      </>
    );
  }

  function pastServiceStatusSpan(s) {
    const normalized = String(s.status || "").toLowerCase();
    const style =
      normalized === "ready"
        ? SERVICE_STATUS_STYLES.delivered
        : normalized === "rejected"
        ? SERVICE_STATUS_STYLES.rejected
        : SERVICE_STATUS_STYLES.default;
    return renderStatusPill(style);
  }

  async function cancelOrder(id) {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`/customer/cancel-order/${id}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        alert("Failed to cancel order");
        return;
      }
      // optionally read JSON; either way we refresh
      refresh();
    } catch (e) {
      alert("Error cancelling order");
    }
  }

  async function cancelService(id) {
    if (!window.confirm("Cancel this service request?")) return;
    try {
      const res = await fetch(`/customer/cancel-service/${id}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        alert("Failed to cancel service");
        return;
      }
      refresh();
    } catch (e) {
      alert("Error cancelling service");
    }
  }

  function openRatingModal(id) {
    setRatingBookingId(id);
    setRatingValue("");
    setRatingReview("");
    setShowRating(true);
  }
  function closeRatingModal() {
    setShowRating(false);
  }

  function handleRateClick(service) {
    const normalizedStatus = String(service?.status || "").toLowerCase();
    if (normalizedStatus !== "ready") {
      alert("You can only rate services that are marked Ready for delivery.");
      return;
    }
    openRatingModal(service._id);
  }

  async function submitRating(e) {
    e.preventDefault();
    const numericRating = Number(ratingValue);
    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      alert("Please enter a rating between 1 and 5.");
      return;
    }
    try {
      const res = await fetch(`/customer/rate-service/${ratingBookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ rating: numericRating, review: ratingReview }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        alert("Failed to submit rating");
        return;
      }
      closeRatingModal();
      refresh();
    } catch (e) {
      alert("Error submitting rating");
    }
  }

  function refresh() {
    dispatch(fetchCustomerHistory());
  }

  const upcomingServices = useMemo(
    () => bookings.filter((b) => ["Open", "Confirmed"].includes(b.status)),
    [bookings]
  );
  const pastServices = useMemo(
    () => bookings.filter((b) => ["Ready", "Rejected"].includes(b.status)),
    [bookings]
  );

  return (
    <>
      <CustomerNav />

      <main>
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <div style={{ color: "#4b5563", fontSize: 14 }}>
            {lastFetched
              ? `Last updated ${new Date(lastFetched).toLocaleString()}`
              : "History loads automatically when you visit this page."}
            {loading && " • Refreshing..."}
          </div>
          <button
            type="button"
            style={{
              background: "#111827",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
            onClick={refresh}
          >
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </section>

        <h2>Upcoming Orders</h2>
        <ul id="upcoming-orders" className="parts-list">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : error ? (
            <p className="no-items">Failed to load. Refresh page.</p>
          ) : upcomingOrders.length === 0 ? (
            <p className="no-items">No upcoming orders found.</p>
          ) : (
            upcomingOrders.map((o) => (
              <li key={o._id} className="history-item">
                <div className="item-details">
                  <h3>Order ID: {o._id}</h3>
                  <p>
                    <strong>Placed on:</strong> {formatDate(o.placedAt)}
                  </p>
                  <p>
                    <strong>Status:</strong> {statusSpan(o.orderStatus)}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> ₹{o.totalAmount}
                  </p>
                  <p>
                    <strong>Items:</strong>
                  </p>
                  <ul>
                    {(o.items || []).map((i, idx) => (
                      <li key={idx}>
                        {i.name} x {i.quantity} (₹{i.price})
                      </li>
                    ))}
                  </ul>
                  {o.orderStatus === "pending" && (
                    <button
                      className="cancel-btn"
                      onClick={() => cancelOrder(o._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        <h2>Past Orders</h2>
        <ul id="past-orders" className="parts-list">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : error ? (
            <p className="no-items">Failed to load. Refresh page.</p>
          ) : pastOrders.length === 0 ? (
            <p className="no-items">No past orders found.</p>
          ) : (
            pastOrders.map((o) => (
              <li key={o._id} className="history-item">
                <div className="item-details">
                  <h3>Order ID: {o._id}</h3>
                  <p>
                    <strong>Placed on:</strong> {formatDate(o.placedAt)}
                  </p>
                  <p>
                    <strong>Status:</strong> {statusSpan(o.orderStatus)}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> ₹{o.totalAmount}
                  </p>
                  <p>
                    <strong>Items:</strong>
                  </p>
                  <ul>
                    {(o.items || []).map((i, idx) => (
                      <li key={idx}>
                        {i.name} x {i.quantity} (₹{i.price})
                      </li>
                    ))}
                  </ul>
                  {!String(o.orderStatus || "")
                    .toLowerCase()
                    .includes("cancel") && (
                    <a
                      href={`${backendBase}/customer/order-receipt/${o._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="download-btn"
                    >
                      Download Receipt
                    </a>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        <h2>Upcoming Services</h2>
        <ul id="upcoming-services" className="parts-list">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : error ? (
            <p className="no-items">Failed to load. Refresh page.</p>
          ) : upcomingServices.length === 0 ? (
            <p className="no-items">No upcoming services found.</p>
          ) : (
            upcomingServices.map((s) => (
              <li key={s._id} className="history-item">
                <div className="item-details">
                  <h3>{(s.selectedServices || []).join(", ")}</h3>
                  <p>
                    <strong>Service ID:</strong> {s._id}
                  </p>
                  <p>
                    <strong>Service Provider:</strong>{" "}
                    {s.providerId?.name || ""} | {s.providerId?.phone || ""}
                  </p>
                  <p>
                    <strong>Booked on:</strong> {formatDate(s.createdAt)}
                  </p>
                  <p>
                    <strong>Car Model:</strong> {s.carModel || ""}
                  </p>
                  <p>
                    <strong>Description:</strong> {s.description || ""}
                  </p>
                  <p>
                    <strong>Cost:</strong> ₹{s.totalCost || 0}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {serviceStatusSpan(s.status, s._id)}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>

        <h2>Past Services</h2>
        <ul id="past-services" className="parts-list">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : error ? (
            <p className="no-items">Failed to load. Refresh page.</p>
          ) : pastServices.length === 0 ? (
            <p className="no-items">No past services found.</p>
          ) : (
            pastServices.map((s) => {
              const normalizedStatus = String(s.status || "").toLowerCase();
              const showRateButton = !s.rating && normalizedStatus === "ready";
              const hasRating = Boolean(s.rating);
              return (
                <li key={s._id} className="history-item">
                  <div className="item-details">
                    <h3>{(s.selectedServices || []).join(", ")}</h3>
                    <p>
                      <strong>Service ID:</strong> {s._id}
                    </p>
                    <p>
                      <strong>Service Provider:</strong>{" "}
                      {s.providerId?.name || ""} | {s.providerId?.phone || ""}
                    </p>
                    <p>
                      <strong>Booked on:</strong> {formatDate(s.createdAt)}
                    </p>
                    <p>
                      <strong>Car Model:</strong> {s.carModel || ""}
                    </p>
                    <p>
                      <strong>Description:</strong> {s.description || ""}
                    </p>
                    <p>
                      <strong>Cost:</strong> ₹{s.totalCost || 0}
                    </p>
                    <p>
                      <strong>Status:</strong> {pastServiceStatusSpan(s)}
                    </p>
                    {showRateButton ? (
                      <button
                        className="rate-btn"
                        onClick={() => handleRateClick(s)}
                      >
                        Rate
                      </button>
                    ) : null}
                    {hasRating ? (
                      <>
                        <p>
                          <strong>Your Rating:</strong> {s.rating}/5
                        </p>
                        {s.review ? (
                          <p>
                            <strong>Comment:</strong> {s.review}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                    {s.status === "Ready" && (
                      <a
                        href={`${backendBase}/customer/service-receipt/${s._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="download-btn"
                      >
                        Download Receipt
                      </a>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </main>

      <footer>
        <div className="footer-container">
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>Email: support@autocustomizer.com</p>
            <p>Phone: +123-456-7890</p>
            <p>Address: 123 Auto Street, Custom City</p>
          </div>
          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#">
                <img src="/images/facebook-icon.png" alt="Facebook" />
              </a>
              <a href="#">
                <img src="/images/twitter-icon.png" alt="Twitter" />
              </a>
              <a href="#">
                <img src="/images/instagram-icon.png" alt="Instagram" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 AutoCustomizer. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Inline styles to match legacy */}
      <style>{`
        .history-item { display:flex; justify-content:space-between; align-items:flex-start; padding:20px; margin-bottom:15px; transition: var(--transition); }
        .item-details { flex:1; }
        .item-details h3 { font-size:18px; margin-bottom:8px; color: var(--text-dark); }
        .item-details p { color:#666; font-size:14px; }
        .rate-btn, .cancel-btn, .download-btn { background: var(--primary-color); color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600; margin-top:6px; display:inline-block; text-decoration:none; }
        .rate-btn { background: var(--warning-color); }
        .download-btn { background: var(--warning-color); color:#fff; text-decoration:none; line-height:1.2; }
        .download-btn:hover { filter:brightness(0.95); text-decoration:none; }
        .cancel-btn { background:#c0392b; }
        .status-pill { display:inline-flex; align-items:center; gap:8px; font-weight:600; padding:4px 12px; border-radius:999px; border:1px solid transparent; font-size:13px; letter-spacing:0.01em; text-transform:capitalize; }
        .status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
        .rate-btn:hover, .cancel-btn:hover, .download-btn:hover { opacity:0.9; }
        .no-items { text-align:center; color:#888; padding:20px; font-style:italic; }
        .modal { position:fixed; z-index:999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; }
        .modal-content { background:#fff; padding:20px; border-radius:8px; width:400px; box-shadow:0 0 10px #000; }
        .close { float:right; font-size:24px; cursor:pointer; }
        @media screen and (max-width: 768px) { .history-item { flex-direction:column; text-align:center; } .item-details { margin-bottom:15px; } }
      `}</style>

      {/* Rating Modal */}
      {showRating && (
        <div className="modal" style={{ display: "flex" }}>
          <div className="modal-content">
            <span className="close" onClick={closeRatingModal}>
              &times;
            </span>
            <h3>Rate This Service</h3>
            <form onSubmit={submitRating}>
              <input type="hidden" name="bookingId" value={ratingBookingId} />
              <label htmlFor="rating">Rating (1 to 5):</label>
              <input
                type="number"
                name="rating"
                id="rating"
                min={1}
                max={5}
                required
                value={ratingValue}
                onChange={(e) => setRatingValue(e.target.value)}
              />
              <br />
              <br />
              <label htmlFor="review">Comment (optional):</label>
              <br />
              <textarea
                name="review"
                id="review"
                rows={4}
                cols={40}
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
              />
              <br />
              <br />
              <button type="submit" className="rate-btn">
                Submit Rating
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
