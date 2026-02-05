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

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  useLink("/styles/styles.css");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/customer/api/order/${id}`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Failed to load order details");
        const j = await res.json();
        if (!j.success) throw new Error(j.message || "Failed to load order");
        if (!cancelled) setOrder(j.order || null);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load order");
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
        {loading && <p>Loading order details...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && !error && order && (
          <div>
            <h2>Order Details</h2>
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
                <strong>Order ID:</strong> {order._id}
              </p>
              <p>
                <strong>Placed On:</strong>{" "}
                {order.placedAt
                  ? new Date(order.placedAt).toLocaleString()
                  : ""}
              </p>
              <p>
                <strong>Status:</strong> {order.orderStatus}
              </p>
              <p>
                <strong>Payment Status:</strong> {order.paymentStatus}
              </p>
              <p>
                <strong>Delivery Address:</strong> {order.deliveryAddress}
              </p>
              <p>
                <strong>District:</strong> {order.district}
              </p>
              <p>
                <strong>Total Amount:</strong> ₹{order.totalAmount}
              </p>
            </div>

            <h3>Items</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {(order.items || []).map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        margin: "8px 0",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  )}
                  <div>Quantity: {item.quantity}</div>
                  <div>Price: ₹{item.price}</div>
                  <div>Status: {item.itemStatus || order.orderStatus}</div>
                  {item.seller && <div>Seller: {item.seller.name || ""}</div>}

                  {(item.itemStatusHistory || []).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Status History</strong>
                      <ul style={{ marginTop: 6 }}>
                        {(item.itemStatusHistory || []).map((h, i) => (
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
                </div>
              ))}
            </div>

            {(order.orderStatusHistory || []).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3>Order Status History</h3>
                <ul>
                  {(order.orderStatusHistory || []).map((h, i) => (
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
