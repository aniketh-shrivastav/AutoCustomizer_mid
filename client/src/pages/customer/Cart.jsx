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

export default function CustomerCart() {
  useLink("/styles/styles.css");

  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  function backendBase() {
    const { protocol, hostname, port } = window.location;
    if (port === "5173") return `${protocol}//${hostname}:3000`;
    return "";
  }
  function handleLogout(e) {
    e.preventDefault();
    const next = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `${backendBase()}/logout?next=${next}`;
  }

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/customer/api/cart", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load cart");
        const j = await res.json();
        if (cancelled) return;
        setItems(j.items || []);
        setUserId(j.user?.id || "");
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load cart");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateQuantity(productId, action) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/cart/update/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ productId, action }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Update failed");
      // reload items
      const cartRes = await fetch("/customer/api/cart", {
        headers: { Accept: "application/json" },
      });
      const cart = await cartRes.json();
      setItems(cart.items || []);
    } catch (e) {
      alert(e.message);
    }
  }

  function buildSummary() {
    if (items.length === 0) return;
    setShowPayment(true);
  }

  async function placeOrder() {
    try {
      const res = await fetch("/customer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ paymentMethod }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMessage = data.message || "Order failed. Please try again.";
        alert(errorMessage);
        
        // If it's a profile issue, redirect to profile page
        if (errorMessage.includes("profile") || errorMessage.includes("address") || errorMessage.includes("district")) {
          if (window.confirm("Would you like to update your profile now?")) {
            window.location.href = "/customer/profile";
          }
        }
        return;
      }
      
      alert(data.message || "Order placed successfully!");
      window.location.href = "/customer/history";
    } catch (e) {
      alert(e.message || "An error occurred while placing your order. Please try again.");
      console.error("Order placement error:", e);
    }
  }

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
              <a href="/customer/history">Order History</a>
            </li>
            <li>
              <a href="/customer/cart" className="cart-link">
                <img src="/images/cart-icon.png" alt="Cart" />
                <span>Cart</span>
                <span
                  className="badge"
                  style={{ display: totalCount > 0 ? "inline-block" : "none" }}
                >
                  {totalCount}
                </span>
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
        <h2>Your Cart Items</h2>
        <div className="underline"></div>

        {loading ? (
          <p className="empty-cart">Loading...</p>
        ) : error ? (
          <p className="empty-cart">Failed to load cart.</p>
        ) : items.length === 0 ? (
          <p className="empty-cart">Your cart is empty.</p>
        ) : (
          <div className="cart-container">
            {items.map((it) => (
              <div
                className="cart-item"
                key={it.productId}
                data-id={it.productId}
              >
                <img src={it.image} alt={it.name} />
                <div className="item-details">
                  <strong>{it.name}</strong>
                  <br />₹{it.price}
                </div>
                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(it.productId, "decrease")}
                  >
                    -
                  </button>
                  <span>{it.quantity}</span>
                  <button
                    onClick={() => updateQuantity(it.productId, "increase")}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", margin: "30px 0 10px" }}>
          <a href="/customer/index">
            <button id="buyproducts-btn">Buy Products</button>
          </a>
        </div>
        <div
          id="checkout-trigger"
          style={{
            textAlign: "center",
            margin: "10px 0 30px",
            display: items.length > 0 ? "block" : "none",
          }}
        >
          <button id="checkout-btn" onClick={buildSummary}>
            Proceed to Checkout
          </button>
        </div>

        {/* Payment selection */}
        {showPayment && (
          <div className="payment-container" id="payment-selection">
            <h2>Order Summary</h2>
            <div id="order-summary">
              {items.map((it) => (
                <p key={it.productId}>
                  <strong>{it.name}</strong> — ₹{it.price} x {it.quantity} = ₹
                  {it.price * it.quantity}
                </p>
              ))}
              <h3 style={{ marginTop: 20 }}>Total: ₹{totalAmount}</h3>
            </div>
            <h2>Select Payment Method</h2>
            <div id="saved-payments" className="payment-method"></div>
            <label>
              <input
                type="radio"
                name="payment-method"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on Delivery
            </label>
            <br />
            <button
              id="confirm-payment"
              onClick={() => {
                if (!paymentMethod) {
                  alert("Please select a payment method.");
                  return;
                }
                setShowPayment(false);
                setShowCheckout(true);
                alert(
                  "Payment method confirmed! Please proceed to place your order."
                );
              }}
            >
              Confirm Payment Method
            </button>
          </div>
        )}

        {/* Checkout */}
        {showCheckout && (
          <div className="checkout-container" id="checkout-section">
            <h2>Choose an Option</h2>
            <div className="checkout-options">
              <button id="place-order" onClick={placeOrder}>
                Place Order
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Style block from legacy page */}
      <style>{`
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        header .logo img { height: 80px; }
        h2 { margin-top: 10px; }
        main { background: transparent !important; box-shadow: none !important; width: 100% !important; max-width: none !important; padding: 0 0 40px 0 !important; margin: 0 auto; }
        .cart-container { max-width: 900px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .cart-item { display:flex; justify-content:space-between; align-items:center; padding:16px; margin-bottom:12px; border:1px solid #e0e0e0; border-radius:10px; background:#f9f9f9; }
        .cart-item img { width:80px; height:80px; object-fit:contain; border-radius:8px; }
        .item-details { flex:1; text-align:left; margin-left:20px; }
        .quantity-controls { display:flex; align-items:center; gap:8px; }
        .quantity-controls button { padding:4px 10px; font-size:16px; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer; }
        .quantity-controls button:hover { filter:brightness(0.9); }
        .quantity-controls span { min-width:24px; display:inline-block; text-align:center; }
        .empty-cart { text-align:center; font-size:20px; color:#888; margin-top:40px; }
        #buyproducts-btn, #checkout-btn { padding:10px 20px; font-size:16px; background:#007bff; color:#fff; border:none; border-radius:5px; cursor:pointer; }
        #buyproducts-btn:hover, #checkout-btn:hover { background:#0069d5; }
        .payment-container, .checkout-container { max-width:600px; margin:30px auto; padding:20px; background:#fff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .checkout-options button, #confirm-payment { padding:10px 20px; border:none; border-radius:5px; font-size:16px; margin:10px 5px; cursor:pointer; color:#fff; }
        #place-order { background:#28a745; }
        #place-order:hover { filter:brightness(0.9); }
        #confirm-payment { background:#ff9800; }
        #confirm-payment:hover { filter:brightness(0.95); }
        .payment-method { display:flex; justify-content:center; gap:10px; margin-bottom:10px; }
        .payment-method label { display:flex; align-items:center; padding:5px 10px; border:1px solid #ddd; border-radius:5px; cursor:pointer; }
        .payment-method input { margin-right:8px; }
        .cart-link { position:relative; }
        .cart-link .badge { position:absolute; top:-6px; right:-10px; background:#ff3b3b; color:#fff; border-radius:50%; padding:2px 6px; font-size:12px; }
      `}</style>
    </>
  );
}
