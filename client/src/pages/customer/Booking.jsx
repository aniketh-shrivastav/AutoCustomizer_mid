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

export default function CustomerBooking() {
  // Match legacy CSS
  useLink("/styles/styles.css");

  const [uniqueDistricts, setUniqueDistricts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [serviceCostMap, setServiceCostMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [district, setDistrict] = useState("");
  const [providerId, setProviderId] = useState("");
  const [services, setServices] = useState([]); // selected
  const [date, setDate] = useState("");
  const [carModel, setCarModel] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({});

  // Summary visibility
  const [showSummary, setShowSummary] = useState(false);

  // Min date = today + 7 days
  const minDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 7);
    return t.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/customer/api/booking", {
          headers: { Accept: "application/json" },
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to load booking data");
        const j = await res.json();
        if (cancelled) return;
        setProviders(j.serviceProviders || []);
        setUniqueDistricts(
          (j.uniqueDistricts || []).sort((a, b) => a.localeCompare(b))
        );
        setServiceCostMap(j.serviceCostMap || {});
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load booking data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const providersForDistrict = useMemo(() => {
    return providers.filter((p) => p.district === district);
  }, [providers, district]);

  const provider = useMemo(
    () => providers.find((p) => String(p._id) === String(providerId)),
    [providers, providerId]
  );

  const offeredServices = useMemo(() => {
    return provider?.servicesOffered?.map((s) => s.name) || [];
  }, [provider]);

  function setFieldError(name, msg) {
    setErrors((e) => ({ ...e, [name]: msg || undefined }));
  }

  // Validators mirroring legacy logic
  function validateDistrict() {
    if (!district)
      return setFieldError("district", "Please select your district"), false;
    setFieldError("district", "");
    return true;
  }
  function validateProvider() {
    if (!providerId)
      return (
        setFieldError("provider", "Please select a service provider"), false
      );
    setFieldError("provider", "");
    return true;
  }
  function validateServices() {
    if (!services.length)
      return setFieldError("services", "Select at least one service"), false;
    setFieldError("services", "");
    return true;
  }
  function validateDate() {
    if (!date) return setFieldError("date", "Please select a date"), false;
    if (new Date(date) < new Date(minDate))
      return (
        setFieldError("date", "Date must be at least 7 days from today"), false
      );
    setFieldError("date", "");
    return true;
  }
  function validatePhone() {
    const val = phone.trim();
    if (!val) return setFieldError("phone", "Phone number is required"), false;
    if (/\s/.test(val))
      return setFieldError("phone", "Phone cannot contain spaces"), false;
    if (!/^\d+$/.test(val))
      return setFieldError("phone", "Phone can only contain digits"), false;
    if (val.length !== 10)
      return (
        setFieldError("phone", "Phone number must be exactly 10 digits"), false
      );
    setFieldError("phone", "");
    return true;
  }
  function validateCarModel() {
    const val = carModel.trim();
    if (!val) return setFieldError("carModel", "Car Model is required"), false;
    if (val.length < 2)
      return setFieldError("carModel", "Car Model seems too short"), false;
    setFieldError("carModel", "");
    return true;
  }
  function validateAddress() {
    const val = address.trim();
    if (!val) return setFieldError("address", "Address is required"), false;
    if (val.length < 10)
      return (
        setFieldError(
          "address",
          "Please provide a more detailed address (min 10 chars)"
        ),
        false
      );
    setFieldError("address", "");
    return true;
  }
  function validateDescription() {
    const val = description.trim();
    if (!val)
      return (
        setFieldError("description", "Please describe your service needs"),
        false
      );
    if (val.length < 10)
      return (
        setFieldError("description", "Description is too short (min 10 chars)"),
        false
      );
    setFieldError("description", "");
    return true;
  }

  function validateAll() {
    const checks = [
      validateDistrict(),
      validateProvider(),
      validateServices(),
      validateDate(),
      validatePhone(),
      validateCarModel(),
      validateAddress(),
      validateDescription(),
    ];
    return checks.every(Boolean);
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validateAll()) {
      setShowSummary(false);
      return;
    }
    setShowSummary(true);
  }

  const estimatedTotal = useMemo(() => {
    return services.reduce((sum, s) => sum + (serviceCostMap[s] || 0), 0);
  }, [services, serviceCostMap]);

  async function confirmBooking() {
    try {
      const res = await fetch("/bookings/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          providerId,
          selectedServices: services,
          date,
          phone: phone.trim(),
          carModel: carModel.trim(),
          address: address.trim(),
          description: description.trim(),
          district,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        alert("Error: " + (j.error || "Unknown error"));
        return;
      }
      alert("Booking successfully submitted!");
      // reset form and summary, or navigate back to this route
      window.location.href = "/customer/booking";
    } catch (e) {
      alert("Failed to submit booking.");
    }
  }

  // Helpers for rendering error and invalid class
  function invalid(name) {
    return errors[name];
  }
  function cls(name) {
    return invalid(name) ? "invalid" : undefined;
  }

  // Reset dependent fields when selections change
  useEffect(() => {
    // Changing district resets provider and services
    setProviderId("");
    setServices([]);
    setFieldError("provider", "");
    setFieldError("services", "");
  }, [district]);
  useEffect(() => {
    // Changing provider clears selected services
    setServices([]);
    setFieldError("services", "");
  }, [providerId]);

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
              <a href="/customer/booking" className="active">
                Services
              </a>
            </li>
            <li>
              <a href="/customer/history">Order History</a>
            </li>
            <li>
              <a href="/customer/cart.html" className="cart-link">
                <img src="/images/cart-icon.png" alt="Cart" />
                <span>Cart</span>
              </a>
            </li>
            <li>
              <a href="/customer/profile.html">Profile</a>
            </li>
            <li>
              <a href="/logout">Logout</a>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <h1>Service Booking</h1>
        <h2>Select your preferred services</h2>

        <form id="booking-form" onSubmit={onSubmit}>
          <label htmlFor="district">
            Select District:(Services Available in which districts)
          </label>
          <select
            id="district"
            required
            className={cls("district")}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            onBlur={validateDistrict}
          >
            <option value="">
              {loading ? "Loading districts..." : "Select District"}
            </option>
            {uniqueDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="error-msg" data-for="district">
            {errors.district || ""}
          </span>

          <label htmlFor="service-provider">
            Service Provider:(Go through max service providers so that you get a
            range of services)
          </label>
          <select
            id="service-provider"
            required
            disabled={!district || providersForDistrict.length === 0}
            className={cls("provider")}
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            onBlur={validateProvider}
          >
            <option value="">Select Service Provider</option>
            {providersForDistrict.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="error-msg" data-for="service-provider">
            {errors.provider || ""}
          </span>

          <label htmlFor="service">Select Services:</label>
          <select
            id="service"
            multiple
            required
            size={5}
            disabled={!provider}
            className={cls("services")}
            value={services}
            onChange={(e) =>
              setServices(
                Array.from(e.target.selectedOptions).map((o) => o.value)
              )
            }
            onBlur={validateServices}
          >
            {offeredServices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <span className="error-msg" data-for="service">
            {errors.services || ""}
          </span>

          <p
            id="serviceCostDisplay"
            style={{ margin: "10px 0", fontWeight: "bold" }}
          >
            {services.length > 0
              ? `Estimated Starting Cost(s): ${services
                  .map((s) => `₹${serviceCostMap[s] || "N/A"}`)
                  .join(", ")}`
              : ""}
          </p>

          <label htmlFor="date">
            Select Date:(Preferred date when you want it to be done although not
            guaranteed)
          </label>
          <input
            type="date"
            id="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={validateDate}
            className={cls("date")}
          />
          <span className="error-msg" data-for="date">
            {errors.date || ""}
          </span>

          <label htmlFor="car-model">Car Model:(Company and Model)</label>
          <input
            type="text"
            id="car-model"
            required
            placeholder="Enter your car model"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            onBlur={validateCarModel}
            className={cls("carModel")}
          />
          <span className="error-msg" data-for="car-model">
            {errors.carModel || ""}
          </span>

          <label htmlFor="phone">Phone Number:</label>
          <input
            type="tel"
            id="phone"
            required
            placeholder="Enter 10-digit number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={validatePhone}
            className={cls("phone")}
          />
          <span className="error-msg" data-for="phone">
            {errors.phone || ""}
          </span>

          <label htmlFor="address">Address:</label>
          <textarea
            id="address"
            rows={4}
            placeholder="Enter your address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={validateAddress}
            className={cls("address")}
          />
          <span className="error-msg" data-for="address">
            {errors.address || ""}
          </span>

          <label htmlFor="description">
            Describe Your Service Needs:(Ensure you have Vehicle number else the
            service will be rejected)
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Tell us more about your requirements..."
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={validateDescription}
            className={cls("description")}
          />
          <span className="error-msg" data-for="description">
            {errors.description || ""}
          </span>

          <button type="submit">Book Now</button>
        </form>

        {showSummary && (
          <div id="summary-box" style={{ marginTop: 20 }}>
            <div>
              <h3>Booking Summary</h3>
              <p>
                <strong>Car Model:</strong> {carModel.trim()}
              </p>
              <p>
                <strong>Services:</strong> {services.join(", ")}
              </p>
              <p>
                <strong>Provider:</strong> {provider?.name || ""}
              </p>
              <p>
                <strong>District:</strong> {district}
              </p>
              <p>
                <strong>Date:</strong> {date}
              </p>
              <p>
                <strong>Estimated Cost:</strong> ₹{estimatedTotal}
              </p>
              <p>
                <strong>Phone:</strong> {phone.trim()}
              </p>
              <p>
                <strong>Address:</strong> {address.trim()}
              </p>
              <p>
                <strong>Description:</strong> {description.trim()}
              </p>
              <button id="confirm-booking" onClick={confirmBooking}>
                Confirm Booking
              </button>
            </div>
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

      {/* Inline error styles to match legacy page */}
      <style>{`
        .error-msg { display:block; font-size:0.8rem; color:#e53935; margin-top:4px; min-height:14px; }
        input.invalid, select.invalid, textarea.invalid { border-color:#e53935 !important; box-shadow:0 0 0 1px #e53935; }
      `}</style>
    </>
  );
}
