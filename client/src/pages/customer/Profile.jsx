import React, { useEffect, useState, useRef } from "react";
import CustomerNav from "../../components/CustomerNav";
import "../../Css/profile.css";

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
    profilePicture: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);
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
          profilePicture: profile.profilePicture || "",
        });
        if (profile.profilePicture) {
          setImagePreview(profile.profilePicture);
        }
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

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        setStatus("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        setStatusColor("red");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setStatus("Image size should be less than 10MB");
        setStatusColor("red");
        return;
      }

      setProfileImage(file);
      setFileName(file.name);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setStatus("");
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
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
        "Name should contain only letters and spaces (min 3 chars).",
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
      "Enter a valid 10-digit phone number. You may include +91 or spaces.",
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
        "District should contain only letters and spaces (no special characters).",
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
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("district", form.district);
      formData.append("carModel", form.carModel);
      formData.append("payments", form.payments);

      if (profileImage) {
        formData.append("profilePicture", profileImage);
      }

      const res = await fetch("/customer/profile", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
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
      const data = await res.json();
      if (data.profilePicture) {
        setForm((f) => ({ ...f, profilePicture: data.profilePicture }));
        setImagePreview(data.profilePicture);
      }
      setStatus("Profile saved successfully!");
      setStatusColor("green");
      setProfileImage(null);
      setFileName("");
    } catch (err) {
      setStatus(err.message || "Unexpected error");
      setStatusColor("red");
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete your account?",
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
      <div className="profile-wrapper">
        <div className="profile-container">
          <a className="back-link" href="/customer/index">
            ← Back to Dashboard
          </a>

          <div className="profile-header">
            <h2>My Profile</h2>
            <p>Manage your account information</p>
          </div>

          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-picture-wrapper">
              <img
                src={
                  imagePreview ||
                  "https://via.placeholder.com/140?text=No+Image"
                }
                alt="Profile"
                className="profile-picture-preview"
              />
              <div className="camera-icon-overlay" onClick={triggerFileInput}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm0-5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z" />
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm11 15H4V6h4.05l1.83-2h4.24l1.83 2H20v11z" />
                </svg>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="file-input-hidden"
            />
            <label className="upload-label" onClick={triggerFileInput}>
              Choose Profile Picture
            </label>
            {fileName && <div className="file-name-display">{fileName}</div>}
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
              <div className="form-group" key={f.name}>
                <label htmlFor={f.name}>{f.label}</label>
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
                />
                {errors[f.name] ? (
                  <div className="error error-text">{errors[f.name]}</div>
                ) : null}
              </div>
            ))}
            <div className="buttons">
              <button type="submit" className="btn btn-save">
                Save Changes
              </button>
              <button
                type="button"
                className="btn btn-logout"
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
                type="button"
                className="btn btn-delete"
                onClick={onDelete}
              >
                Delete Profile
              </button>
            </div>
            <div
              className={`status ${statusColor === "green" ? "success" : statusColor === "red" ? "error" : ""}`}
              id="statusMsg"
              style={{ color: statusColor }}
            >
              {status}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
