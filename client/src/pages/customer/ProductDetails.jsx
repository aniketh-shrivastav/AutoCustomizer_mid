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
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  );

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({
    avgRating: 0,
    totalReviews: 0,
  });
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "" });
  const [reviewStatus, setReviewStatus] = useState("");
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
          credentials: "include",
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Failed to load product details");
        const j = await res.json();
        if (!cancelled) {
          setProduct(j.product || null);
          setReviews(j.reviews || []);
          setRatingSummary(
            j.ratingSummary || { avgRating: 0, totalReviews: 0 },
          );
          setCanReview(Boolean(j.canReview));
          setUserReview(j.userReview || null);
          if (j.userReview) {
            setReviewForm({
              rating: j.userReview.rating || 5,
              review: j.userReview.review || "",
            });
          }
        }
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

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewStatus("");
    try {
      const res = await fetch(`/customer/product/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rating: reviewForm.rating,
          review: reviewForm.review,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) {
        throw new Error(j.message || "Failed to submit review");
      }

      // Refresh product details to show updated review list
      const refresh = await fetch(`/customer/product/${id}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const refreshed = await refresh.json();
      setProduct(refreshed.product || null);
      setReviews(refreshed.reviews || []);
      setRatingSummary(
        refreshed.ratingSummary || { avgRating: 0, totalReviews: 0 },
      );
      setCanReview(Boolean(refreshed.canReview));
      setUserReview(refreshed.userReview || null);
      setReviewStatus("Review saved successfully.");
    } catch (err) {
      setReviewStatus(err.message || "Failed to submit review");
    }
  };

  return (
    <>
      <CustomerNav />

      <div
        style={{
          background: "#f3f4f6",
          minHeight: "100vh",
          padding: "24px 0 40px",
        }}
      >
        <div className="container">
          {loading && <div>Loading product...</div>}
          {error && <div className="text-danger mb-3">{error}</div>}

          {!loading && !error && product && (
            <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
              <div className="col-lg-5" style={{ flex: 1 }}>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <img
                    src={product.image || "/images/placeholder.jpg"}
                    alt={product.name || "Product"}
                    style={{
                      width: "100%",
                      height: 380,
                      objectFit: "contain",
                      borderRadius: 10,
                      background: "#f9fafb",
                    }}
                  />
                </div>
              </div>

              <div className="col-lg-4" style={{ flex: 1 }}>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <h2 style={{ fontSize: 26, fontWeight: 700 }}>
                    {product.name}
                  </h2>
                  <div style={{ marginTop: 8, color: "#6b7280" }}>
                    ⭐ {ratingSummary.avgRating} / 5
                    <span style={{ marginLeft: 8 }}>
                      ({ratingSummary.totalReviews} review(s))
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#b12704",
                    }}
                  >
                    ₹{product.price}
                  </div>
                  <hr />
                  <p>
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p>
                    <strong>Brand:</strong> {product.brand}
                  </p>
                  <p>
                    <strong>SKU:</strong> {product.sku}
                  </p>
                  <p>
                    <strong>Compatibility:</strong> {product.compatibility}
                  </p>
                  {product.seller && (
                    <p>
                      <strong>Seller:</strong> {product.seller.name}
                    </p>
                  )}
                  <p style={{ color: "#374151" }}>{product.description}</p>

                  <button
                    type="button"
                    className="btn btn-secondary mt-2"
                    onClick={() => navigate("/customer/index")}
                  >
                    Back to Products
                  </button>
                </div>
              </div>

              <div className="col-lg-3" style={{ flex: 0.9 }}>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                    position: "sticky",
                    top: 20,
                  }}
                >
                  <h4 style={{ fontWeight: 700 }}>Customer Reviews</h4>
                  <div style={{ marginBottom: 10, color: "#6b7280" }}>
                    ⭐ {ratingSummary.avgRating} / 5
                  </div>

                  {reviews.length === 0 ? (
                    <p style={{ color: "#6b7280" }}>No reviews yet.</p>
                  ) : (
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                      {reviews.slice(0, 3).map((r) => (
                        <div
                          key={r._id}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            paddingBottom: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {r.userId?.name || "Customer"}
                          </div>
                          <div style={{ fontSize: 13 }}>⭐ {r.rating} / 5</div>
                          {r.review ? (
                            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                              {r.review}
                            </p>
                          ) : (
                            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                              No review text.
                            </p>
                          )}
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Showing latest 3 reviews
                        </div>
                      )}
                    </div>
                  )}

                  {canReview && (
                    <div style={{ marginTop: 16 }}>
                      <h5 style={{ fontWeight: 700 }}>
                        {userReview ? "Update Your Review" : "Write a Review"}
                      </h5>
                      <form onSubmit={submitReview}>
                        <div className="mb-2">
                          <label className="form-label">Rating</label>
                          <select
                            className="form-select"
                            value={reviewForm.rating}
                            onChange={(e) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                rating: Number(e.target.value),
                              }))
                            }
                          >
                            {[5, 4, 3, 2, 1].map((v) => (
                              <option key={v} value={v}>
                                {v} Star{v > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="form-label">Review</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={reviewForm.review}
                            onChange={(e) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                review: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">
                          {userReview ? "Update Review" : "Submit Review"}
                        </button>
                        {reviewStatus && (
                          <div style={{ marginTop: 8, fontSize: 13 }}>
                            {reviewStatus}
                          </div>
                        )}
                      </form>
                    </div>
                  )}

                  {!canReview && userReview && (
                    <div style={{ marginTop: 16 }}>
                      <h5 style={{ fontWeight: 700 }}>Your Review</h5>
                      <div style={{ fontSize: 13 }}>
                        ⭐ {userReview.rating} / 5
                      </div>
                      <p style={{ marginTop: 6, fontSize: 13 }}>
                        {userReview.review}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
