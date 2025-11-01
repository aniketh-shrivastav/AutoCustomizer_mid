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

export default function CustomerIndex() {
  // Load same CSS as static page (styles.css) and Bootstrap CDN
  useLink("/styles/styles.css");
  useLink(
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
  );

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/customer/api/index", {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to load products");
        const j = await res.json();
        if (!cancelled)
          setProducts(Array.isArray(j.products) ? j.products : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    (products || []).forEach((p) => {
      const c = (p.category || "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const q = term.toLowerCase().trim();
    const cat = category.toLowerCase();
    return (products || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      const matchesText = name.includes(q) || c.includes(q);
      const matchesCat = !cat || c === cat;
      return matchesText && matchesCat;
    });
  }, [products, term, category]);

  async function addToCart(id, button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Adding...";
    try {
      const res = await fetch("/customer/cart/add", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const j = await res.json();
      if (j && j.success) {
        alert("Product added to cart successfully! 🛒");
      } else {
        alert(
          "Failed to add product: " + ((j && j.message) || "Unknown error")
        );
      }
    } catch (e) {
      alert("Error adding product to cart. Try again.");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function productId(p) {
    return (p && (p._id?.$oid || p._id)) || "";
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
              </a>
            </li>
            <li>
              <a href="/customer/profile">Profile</a>
            </li>
            <li>
              <a href="/logout">Logout</a>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <div
          className="search-bar"
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            margin: "0 16px",
          }}
        >
          <input
            type="text"
            placeholder="Search for car parts..."
            className="form-control"
            style={{ maxWidth: 360 }}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <label className="form-label mb-0">Category</label>
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 220 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="alert alert-info mx-3 mt-3" role="alert">
          <h5 className="mb-2">🛠️ Important Instructions Before You Order</h5>
          <ul className="mb-2">
            <li>
              Please ensure that you <strong>update your profile</strong> before
              ordering products. An incomplete profile may cause errors during
              order placement.
            </li>
            <li>
              If you plan to{" "}
              <strong>book a service along with a product</strong>, it's
              recommended to book the service first to avoid any conflicts.
            </li>
          </ul>
          <p className="mb-0">Let's start customizing our car! 🚗</p>
        </section>

        <h2>Available Car Parts</h2>

        {loading && <div className="mx-3">Loading products...</div>}
        {error && <div className="mx-3 text-danger">{error}</div>}

        {!loading && !error && (
          <div className="parts-list" id="parts-list">
            {filtered.length === 0 ? (
              <p>No products available.</p>
            ) : (
              filtered.map((product) => (
                <div
                  key={productId(product)}
                  className="part"
                  data-name={product.name || ""}
                  data-category={product.category || ""}
                >
                  <div className="card mb-4 shadow-sm">
                    <img
                      src={product.image || "/images/placeholder.jpg"}
                      className="card-img-top"
                      alt={product.name || "Product"}
                    />
                    <div className="card-body">
                      <h5 className="card-title">
                        {product.name || "Unnamed Product"}
                      </h5>
                      <p className="card-text">₹{product.price || "0"}</p>
                      <a
                        href={`/customer/product/${productId(product)}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View Details
                      </a>
                      <div className="mt-3">
                        <button
                          className="btn btn-primary w-100"
                          onClick={(e) =>
                            addToCart(productId(product), e.currentTarget)
                          }
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
    </>
  );
}
