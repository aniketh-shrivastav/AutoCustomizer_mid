import React, { useEffect, useState } from "react";
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

export default function CustomerProfile() {
  useLink("/styles/styles.css");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    district: "",
    carModel: "",
    payments: "",
  });
  const [status, setStatus] = useState("");
  const [statusColor, setStatusColor] = useState("#333");
  const [userId, setUserId] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/customer/api/profile", {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to load profile");
        const { user, profile } = await res.json();
        setUserId(user.id);
        setForm({
          name: user.name || "",
          phone: user.phone || "",
          address: profile.address || "",
          district: profile.district || "",
          carModel: profile.carModel || "",
          payments: profile.payments || "",
        });
      } catch (e) {
        setStatus(e.message);
        setStatusColor("red");
      }
    })();
  }, []);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function showError(name, message) {
    setErrors((e) => ({ ...e, [name]: message }));
  }

  function validateName() {
    const v = form.name.trim();
    const re = /^[A-Za-z\s]{3,}$/;
    if (!re.test(v)) {
      showError(
        "name",
        "Name should contain only letters and spaces (min 3 chars)."
      );
      return false;
    }
    return true;
  }
  function validatePhone() {
    const raw = form.phone.trim();
    const digits = raw.replace(/\D/g, "");
    if (
      digits.length === 10 ||
      (digits.length === 12 && digits.startsWith("91"))
    ) {
      return true;
    }
    showError(
      "phone",
      "Enter a valid 10-digit phone number. You may include +91 or spaces."
    );
    return false;
  }
  function validateAddress() {
    const v = form.address.trim();
    if (v.length < 5) {
      showError("address", "Address is too short (min 5 characters).");
      return false;
    }
    return true;
  }
  function validateDistrict() {
    const v = form.district.trim();
    const re = /^[A-Za-z\s]{2,}$/;
    if (!re.test(v)) {
      showError(
        "district",
        "District should contain only letters and spaces (no special characters)."
      );
      return false;
    }
    return true;
  }
  function validateCarModel() {
    const v = form.carModel.trim();
    const re = /^[A-Za-z0-9\s\-\/\.]{1,}$/;
    if (v.length === 0) {
      showError("carModel", "Car model cannot be empty.");
      return false;
    }
    if (!re.test(v)) {
      showError("carModel", "Car model contains invalid characters.");
      return false;
    }
    return true;
  }
  function validatePayments() {
    const v = form.payments.trim();
    if (v.length === 0) {
      showError("payments", "Payment method cannot be empty.");
      return false;
    }
    const re = /^[A-Za-z0-9\s\-\&\,\.]{1,}$/;
    if (!re.test(v)) {
      showError("payments", "Payment method contains invalid characters.");
      return false;
    }
    return true;
  }

  function validateAll() {
    setErrors({});
    const ok = [
      validateName(),
      validatePhone(),
      validateAddress(),
      validateDistrict(),
      validateCarModel(),
      validatePayments(),
    ].every(Boolean);
    return ok;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("");
    setStatusColor("#333");
    if (!validateAll()) {
      // focus first error
      const first = document.querySelector(".error-text");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStatus("Saving...");
    try {
      const res = await fetch("/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ...form }),
      });
      if (res.status === 401) {
        setStatus("Session expired. Redirecting to login...");
        setStatusColor("red");
        setTimeout(() => (window.location.href = "/login"), 800);
        return;
      }
      if (!res.ok) {
        const maybe = await res.json().catch(() => ({}));
        throw new Error(maybe.message || "Save failed");
      }
      setStatus("Profile saved successfully!");
      setStatusColor("green");
    } catch (err) {
      setStatus(err.message || "Unexpected error");
      setStatusColor("red");
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete your account?"
      )
    )
      return;
    setStatus("Deleting...");
    setStatusColor("#333");
    try {
      const res = await fetch("/customer/delete-profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("Profile deleted.");
      window.location.href = "/logout";
    } catch (e) {
      setStatus(e.message);
      setStatusColor("red");
    }
  }

  return (
    <>
      <CustomerNav />
      <div
        className="profile-wrapper"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e2eafc, #cfd9df)",
          margin: 0,
          paddingTop: 90,
        }}
      >
        <div
          className="profile-container"
          style={{
            background: "#fff",
            padding: "35px 30px",
            borderRadius: 20,
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            width: "100%",
            maxWidth: 420,
            animation: "fadeIn 0.6s ease",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <a
            className="back-link"
            href="/customer/index"
            style={{
              display: "inline-block",
              marginBottom: 15,
              textDecoration: "none",
              color: "#3498db",
              fontWeight: 600,
            }}
          >
            ← Back to Dashboard
          </a>
          <div
            className="header"
            style={{ textAlign: "center", marginBottom: 25 }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 600,
                color: "#333",
              }}
            >
              My Profile
            </h2>
          </div>
          <form onSubmit={onSubmit} id="profileForm">
            {[
              {
                name: "name",
                label: "Full Name",
                placeholder: "Enter your name",
              },
              {
                name: "phone",
                label: "Phone Number",
                placeholder: "Enter your phone number",
              },
              {
                name: "address",
                label: "Address",
                placeholder: "Enter your address",
              },
              {
                name: "district",
                label: "District",
                placeholder: "Enter your district",
              },
              {
                name: "carModel",
                label: "Car Model",
                placeholder: "Enter your car model",
              },
              {
                name: "payments",
                label: "Payments (COD or e-payments)",
                placeholder: "Enter payment details",
              },
            ].map((f) => (
              <div
                className="form-group"
                key={f.name}
                style={{ width: "100%", marginBottom: 18 }}
              >
                <label
                  htmlFor={f.name}
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#2d3436",
                  }}
                >
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  placeholder={f.placeholder}
                  value={form[f.name] || ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  onBlur={() => {
                    // live validate per field
                    const map = {
                      name: validateName,
                      phone: validatePhone,
                      address: validateAddress,
                      district: validateDistrict,
                      carModel: validateCarModel,
                      payments: validatePayments,
                    };
                    map[f.name]?.();
                  }}
                  className={errors[f.name] ? "invalid" : undefined}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontSize: 15,
                  }}
                />
                {errors[f.name] ? (
                  <div
                    className="error error-text"
                    style={{
                      color: "#e63946",
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      marginTop: 4,
                    }}
                  >
                    {errors[f.name]}
                  </div>
                ) : null}
              </div>
            ))}
            <div
              className="buttons"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 25,
              }}
            >
              <button
                type="button"
                className="btn-logout"
                style={{
                  background: "#e74c3c",
                  color: "#fff",
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  const next = encodeURIComponent(`${window.location.origin}/`);
                  const base =
                    window.location.port === "5173"
                      ? `${window.location.protocol}//${window.location.hostname}:3000`
                      : "";
                  window.location.href = `${base}/logout?next=${next}`;
                }}
              >
                Logout
              </button>
              <button
                type="submit"
                className="btn-save"
                style={{
                  background: "#2ecc71",
                  color: "#fff",
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="btn-delete"
                style={{
                  background: "#bd2130",
                  color: "#fff",
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
                onClick={onDelete}
              >
                Delete Profile
              </button>
            </div>
            <div
              className="status"
              id="statusMsg"
              style={{
                textAlign: "center",
                fontSize: 14,
                marginTop: 10,
                color: statusColor,
              }}
            >
              {status}
            </div>
          </form>
        </div>
      </div>

      {/* page styles matching legacy profile */}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } } input.invalid { border: 2px solid #e63946; box-shadow: 0 0 4px rgba(230,57,70,0.3); }`}</style>
    </>
  );
}
