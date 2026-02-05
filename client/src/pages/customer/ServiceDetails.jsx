import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerNav from "../../components/CustomerNav";

function useLink(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  useLink("/styles/styles.css");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/customer/api/service/${id}`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Failed to load service details");
        const j = await res.json();
        if (!j.success) throw new Error(j.message || "Failed to load service");
        if (!cancelled) setBooking(j.booking || null);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load service");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <>
      <CustomerNav />
      <div className="container mt-4">
        {loading && <p>Loading service details...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && !error && booking && (
          <div>
            <h2>Service Details</h2>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <p>
                <strong>Service ID:</strong> {booking._id}
              </p>
              <p>
                <strong>Booked On:</strong>{" "}
                {booking.createdAt
                  ? new Date(booking.createdAt).toLocaleString()
                  : ""}
              </p>
              <p>
                <strong>Status:</strong> {booking.status}
              </p>
              <p>
                <strong>Provider:</strong> {booking.providerId?.name || ""}
              </p>
              <p>
                <strong>Provider Email:</strong>{" "}
                {booking.providerId?.email || ""}
              </p>
              <p>
                <strong>Provider Phone:</strong>{" "}
                {booking.providerId?.phone || ""}
              </p>
              <p>
                <strong>Services:</strong>{" "}
                {(booking.selectedServices || []).join(", ")}
              </p>
              <p>
                <strong>Car Model:</strong> {booking.carModel}
              </p>
              <p>
                <strong>Car Year:</strong> {booking.carYear}
              </p>
              <p>
                <strong>Address:</strong> {booking.address}
              </p>
              <p>
                <strong>Description:</strong> {booking.description}
              </p>
              <p>
                <strong>Total Cost:</strong> ₹{booking.totalCost || 0}
              </p>
            </div>

            {(booking.statusHistory || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3>Status History</h3>
                <ul>
                  {(booking.statusHistory || []).map((h, i) => (
                    <li key={i}>
                      {h.from || "-"} → {h.to} on{" "}
                      {h.changedAt
                        ? new Date(h.changedAt).toLocaleString()
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(booking.costHistory || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3>Cost History</h3>
                <ul>
                  {(booking.costHistory || []).map((h, i) => (
                    <li key={i}>
                      {h.from ?? "-"} → {h.to} on{" "}
                      {h.changedAt
                        ? new Date(h.changedAt).toLocaleString()
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary mt-3"
              onClick={() => navigate("/customer/history")}
            >
              Back to History
            </button>
          </div>
        )}
      </div>
    </>
  );
}
