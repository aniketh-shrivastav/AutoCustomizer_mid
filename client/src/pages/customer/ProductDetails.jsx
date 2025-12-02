import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  useLink("/styles/styles.css");
  useLink(
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
  );

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/customer/product/${id}`, {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Failed to load product details");
        const j = await res.json();
        if (!cancelled) setProduct(j.product || null);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load product");
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

      <div className="container mt-5">
        {loading && <div>Loading product...</div>}
        {error && <div className="text-danger mb-3">{error}</div>}

                {!loading && !error && product && (
          <div className="product-details-card card border-0 shadow-lg p-4">
            <div className="row g-4 align-items-start">
              <div className="col-md-6">
                <img
                  src={product.image || "/images/placeholder.jpg"}
                  alt={product.name || "Product"}
                  className="img-fluid product-details-image"
                />
              </div>

              <div className="col-md-6">
                <h2 className="mb-3">{product.name}</h2>
                <p className="text-primary fs-4 fw-semibold mb-3">
                  ₹{product.price}
                </p>

                <div className="product-details-meta mb-3">
                  <p className="mb-1">
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p className="mb-1">
                    <strong>Brand:</strong> {product.brand}
                  </p>
                  <p className="mb-1">
                    <strong>SKU:</strong> {product.sku}
                  </p>
                  <p className="mb-1">
                    <strong>Compatibility:</strong> {product.compatibility}
                  </p>
                  {product.seller && (
                    <p className="mb-1">
                      <strong>Seller:</strong> {product.seller.name}
                    </p>
                  )}
                </div>

                <div className="product-details-description">
                  <p className="mb-0">
                    <strong>Description:</strong> {product.description}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary mt-4"
                  style={{
                    borderRadius: "999px",
                    paddingInline: "20px",
                    boxShadow: "0 6px 16px rgba(108, 117, 125, 0.25)",
                  }}
                  onClick={() => navigate("/customer/index")}
                >
                  ← Back to Products
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

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
