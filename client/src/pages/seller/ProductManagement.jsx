import React, { useEffect, useRef, useState, useMemo } from "react";
import "../../Css/productManagement.css";

// Utility hook to dynamically link CSS files (for compatibility with old CSS)
function useLink(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

export default function ProductManagement() {
  // Load external CSS
  useLink("/Css/CStyle.css");
  useLink("/newstyle.css");
  useLink("/Css/sellerBase.css");

  // Local states
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    brand: "",
    quantity: "",
    sku: "",
    compatibility: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const imageInputRef = useRef(null);

  // Validation rules (like your JS version)
  const validators = useMemo(
    () => ({
      name: (v) => (!v ? "Product Name required" : ""),
      category: (v) => (!v ? "Category required" : ""),
      brand: (v) => (!v ? "Brand required" : ""),
      description: (v) => (!v ? "Description required" : ""),
      sku: (v) =>
        v && v.length === 6 ? "" : "SKU must be exactly 6 characters",
      price: (v) => (/^\d+(\.\d{1,2})?$/.test(v) ? "" : "Invalid price format"),
      quantity: (v) =>
        String(parseInt(v, 10)) === String(v) ? "" : "Quantity must be integer",
      image: (v) => (v ? "" : "Product image required"),
    }),
    [],
  );

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const data = { ...form };

    data.name = data.name.trim().toUpperCase();
    data.category = data.category.trim().toUpperCase();

    for (const [key, fn] of Object.entries(validators)) {
      const msg = fn(data[key] ?? "");
      if (msg) newErrors[key] = msg;
    }
    setForm(data);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch products from backend
  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/seller/api/products", {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to load products");
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Add Product
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setStatus("Please correct highlighted errors.");
      return;
    }

    try {
      setStatus("Adding product...");
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "image" && v) formData.append("image", v);
        else formData.append(k, v ?? "");
      });

      const res = await fetch("/seller/add-product", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "Failed to add product");
        }
        throw new Error("Failed to add product");
      }
      setStatus("Product added successfully!");
      setForm({
        name: "",
        price: "",
        description: "",
        category: "",
        brand: "",
        quantity: "",
        sku: "",
        compatibility: "",
        image: null,
      });
      if (imageInputRef.current) imageInputRef.current.value = "";
      loadProducts();
    } catch (err) {
      console.error(err);
      setStatus("Failed to add product.");
    }
  }

  // Delete product
  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/seller/delete-product/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      // Server currently redirects after delete; handle both JSON and redirect/HTML responses
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Delete failed");
      } else if (!res.ok) {
        throw new Error("Delete failed");
      }
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete product.");
    }
  }

  return (
    <div className="seller-page">
      <nav className="navbar">
        <div className="brand">
          <img
            src="/images3/logo2.jpg"
            alt="AutoCustomizer"
            style={{ height: "40px", objectFit: "contain" }}
          />
        </div>
        <ul>
          <li>
            <a href="/seller/dashboard">Dashboard</a>
          </li>
          <li>
            <a href="/seller/profileSettings">Profile Settings</a>
          </li>
          <li>
            <a href="/seller/productmanagement" className="active">
              Products
            </a>
          </li>
          <li>
            <a href="/seller/orders">Orders</a>
          </li>
          <li>
            <a href="/seller/reviews">Reviews</a>
          </li>
          <li>
            <a href="/logout">Logout</a>
          </li>
        </ul>
      </nav>

      <header>
        <h1>Product Management</h1>
      </header>

      <div className="container">
        <a
          href="/Seller/bulk-upload"
          className="btn-add"
          style={{ marginBottom: 20 }}
        >
          Bulk Upload Products
        </a>

        {/* Product Form */}
        <form
          className="product-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          {[
            { label: "Product Name", key: "name", type: "text" },
            {
              label: "Product Price (₹)",
              key: "price",
              type: "number",
              step: "0.01",
            },
            {
              label: "Product Description",
              key: "description",
              type: "textarea",
            },
            { label: "Product Category", key: "category", type: "text" },
            { label: "Product Brand", key: "brand", type: "text" },
            { label: "Product Quantity", key: "quantity", type: "number" },
            { label: "Product SKU", key: "sku", type: "text", maxLength: 6 },
            { label: "Compatibility", key: "compatibility", type: "text" },
          ].map((f) => (
            <div className="form-group" key={f.key}>
              <label htmlFor={f.key}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  id={f.key}
                  rows={3}
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              ) : (
                <input
                  id={f.key}
                  type={f.type}
                  step={f.step}
                  maxLength={f.maxLength}
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
              {errors[f.key] && (
                <small style={{ color: "crimson" }}>{errors[f.key]}</small>
              )}
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="productImage">Product Image:</label>
            <input
              id="productImage"
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={(e) => setField("image", e.target.files?.[0] || null)}
            />
            {errors.image && (
              <small style={{ color: "crimson" }}>{errors.image}</small>
            )}
          </div>

          <button type="submit" className="btn-add">
            Add Product
          </button>
          {status && (
            <p style={{ color: "#6a11cb", marginTop: 10 }}>{status}</p>
          )}
        </form>

        {/* Product List */}
        <div className="product-list">
          <h2>Product List</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p className="no-products">No products found.</p>
          ) : (
            <div className="product-grid">
              {products.map((p) => (
                <div className="product-card" key={p._id}>
                  <div className="product-details">
                    <h3>{p.name}</h3>
                    <p>
                      <strong>Price:</strong> ₹{p.price}
                    </p>
                    <p>
                      <strong>Description:</strong> {p.description}
                    </p>
                    <p>
                      <strong>Category:</strong> {p.category}
                    </p>
                    <p>
                      <strong>Brand:</strong> {p.brand}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {p.quantity}
                    </p>
                    <p>
                      <strong>SKU:</strong> {p.sku}
                    </p>
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 8,
                          marginBottom: 12,
                        }}
                      />
                    )}
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(p._id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="seller-footer">
        <p>© 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>
    </div>
  );
}
