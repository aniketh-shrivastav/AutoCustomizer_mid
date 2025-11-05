import React, { useEffect, useMemo, useState } from "react";

function useLink(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Rating modal state
  const [showRating, setShowRating] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState("");
  const [ratingValue, setRatingValue] = useState("");
  const [ratingReview, setRatingReview] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/customer/api/history", {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to load history");
        const j = await res.json();
        if (cancelled) return;
        setUpcomingOrders(j.upcomingOrders || []);
        setPastOrders(j.pastOrders || []);
        setBookings(j.bookings || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString();
  }

  function statusSpan(status) {
    if (["pending", "confirmed", "shipped"].includes(status)) {
      return <span style={{ color: "orange" }}>{status}</span>;
    }
    return <span style={{ color: "green" }}>{status}</span>;
  }

  function serviceStatusSpan(status, id) {
    if (status === "Open") {
      return (
        <>
          <span style={{ color: "orange" }}>Waiting for Confirmation</span>
          <br />
          <button className="cancel-btn" onClick={() => cancelService(id)}>
            Cancel Service
          </button>
        </>
      );
    }
    return <span style={{ color: "green" }}>Confirmed</span>;
  }

  function pastServiceStatusSpan(s) {
    if (s.status === "Ready")
      return <span style={{ color: "green" }}>Completed</span>;
    return <span style={{ color: "red" }}>Rejected</span>;
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

  async function submitRating(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/customer/rate-service/${ratingBookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ rating: ratingValue, review: ratingReview }),
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
    // simple reload of data
    setLoading(true);
    fetch("/customer/api/history", { headers: { Accept: "application/json" } })
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return Promise.reject();
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((j) => {
        setUpcomingOrders(j.upcomingOrders || []);
        setPastOrders(j.pastOrders || []);
        setBookings(j.bookings || []);
      })
      .catch(() => setError("Failed to load history"))
      .finally(() => setLoading(false));
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
      <header>
        <div className="logo">
          <img
            style={{ height: 80 }}
            src="/images3/logo2.jpg"
            alt="AutoCustomizer Logo"
          />
        </div>
        <nav>
          <ul className="nav-links">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/customer/index">Products</a>
            </li>
            <li>
              <a href="/customer/booking">Services</a>
            </li>
            <li>
              <a href="/customer/history" className="active">
                Order History
              </a>
            </li>
            <li>
              <a href="/customer/cart" className="cart-link">
                <img src="/images/cart-icon.png" alt="Cart" />
                <span>Cart</span>
              </a>
            </li>
            <li>
              <a href="/customer/profile">Profile</a>
            </li>
            <li>
              <a href="/logout" onClick={handleLogout}>
                Logout
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main>
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
                    <strong>Status:</strong> {o.orderStatus}
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
            pastServices.map((s) => (
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
                  {!s.rating ? (
                    <button
                      className="rate-btn"
                      onClick={() => openRatingModal(s._id)}
                    >
                      Rate
                    </button>
                  ) : (
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
                  )}
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
            ))
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
