import React, { useEffect, useMemo, useState } from "react";
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

export default function CustomerBooking() {
  // Match legacy CSS
  useLink("/styles/styles.css");
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

  const [uniqueDistricts, setUniqueDistricts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [serviceCostMap, setServiceCostMap] = useState({});
  const [ratingsMap, setRatingsMap] = useState({});
  const [providerReviews, setProviderReviews] = useState([]);
  const [providerReviewsLoading, setProviderReviewsLoading] = useState(false);
  const [providerReviewsError, setProviderReviewsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [district, setDistrict] = useState("");
  const [providerId, setProviderId] = useState("");
  const [services, setServices] = useState([]); // selected
  const [date, setDate] = useState("");
  const [carModel, setCarModel] = useState("");
  const [phone, setPhone] = useState("");
  const [carYear, setCarYear] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // Car Painting selection
  const [paintColor, setPaintColor] = useState("");

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
          (j.uniqueDistricts || []).sort((a, b) => a.localeCompare(b)),
        );
        setServiceCostMap(j.serviceCostMap || {});
        setRatingsMap(j.ratingsMap || {});
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
    [providers, providerId],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadProviderReviews() {
      if (!providerId) {
        setProviderReviews([]);
        setProviderReviewsError("");
        return;
      }
      try {
        setProviderReviewsLoading(true);
        setProviderReviewsError("");
        const res = await fetch(
          `/customer/api/provider/${providerId}/reviews`,
          {
            headers: { Accept: "application/json" },
            credentials: "include",
          },
        );
        if (!res.ok) throw new Error("Failed to load provider reviews");
        const j = await res.json();
        if (!j.success) throw new Error(j.message || "Failed to load reviews");
        if (!cancelled) setProviderReviews(j.reviews || []);
      } catch (e) {
        if (!cancelled)
          setProviderReviewsError(e.message || "Failed to load reviews");
      } finally {
        if (!cancelled) setProviderReviewsLoading(false);
      }
    }
    loadProviderReviews();
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const offeredServices = useMemo(() => {
    return provider?.servicesOffered?.map((s) => s.name) || [];
  }, [provider]);

  const isCarPaintingSelected = useMemo(() => {
    return (services || []).some((s) => {
      const name = String(s || "").toLowerCase();
      return (
        name.includes("car") &&
        (name.includes("paint") || name.includes("painting"))
      );
    });
  }, [services]);

  const providerPaintColors = useMemo(() => {
    const list = Array.isArray(provider?.paintColors)
      ? provider.paintColors
      : [];
    return list
      .map((c) =>
        String(c || "")
          .trim()
          .toLowerCase(),
      )
      .filter((c) => /^#[0-9a-f]{6}$/.test(c))
      .slice(0, 24);
  }, [provider]);

  useEffect(() => {
    if (!isCarPaintingSelected) return;
    if (providerPaintColors.length === 0) return;
    const requested = String(paintColor || "")
      .trim()
      .toLowerCase();
    if (!requested || !providerPaintColors.includes(requested)) {
      setPaintColor(providerPaintColors[0]);
      setFieldError("paintColor", "");
    }
  }, [isCarPaintingSelected, providerPaintColors]);

  function validatePaintColor() {
    if (!isCarPaintingSelected) {
      setFieldError("paintColor", "");
      return true;
    }

    if (providerPaintColors.length === 0) {
      return (
        setFieldError(
          "paintColor",
          "This provider hasn’t configured paint colors. Please choose a different provider for Car Painting.",
        ),
        false
      );
    }
    const requested = String(paintColor || "")
      .trim()
      .toLowerCase();
    if (!requested)
      return (
        setFieldError("paintColor", "Please select a paint color"),
        false
      );
    if (!/^#[0-9a-f]{6}$/.test(requested))
      return (setFieldError("paintColor", "Please pick a valid color"), false);
    if (!providerPaintColors.includes(requested))
      return (
        setFieldError("paintColor", "Select one of the offered colors"),
        false
      );
    setFieldError("paintColor", "");
    return true;
  }

  const startingCost = useMemo(() => {
    if (!provider?.servicesOffered?.length) return null;
    const costs = provider.servicesOffered
      .map((s) => Number(s.cost || 0))
      .filter((n) => !isNaN(n) && n > 0);
    if (costs.length === 0) return null;
    return Math.min(...costs);
  }, [provider]);

  function setFieldError(name, msg) {
    setErrors((e) => ({ ...e, [name]: msg || undefined }));
  }

  // Validators mirroring legacy logic
  function validateDistrict() {
    if (!district)
      return (setFieldError("district", "Please select your district"), false);
    setFieldError("district", "");
    return true;
  }
  function validateProvider() {
    if (!providerId)
      return (
        setFieldError("provider", "Please select a service provider"),
        false
      );
    setFieldError("provider", "");
    return true;
  }
  function validateServices() {
    if (!services.length)
      return (setFieldError("services", "Select at least one service"), false);
    setFieldError("services", "");
    return true;
  }
  function validateDate() {
    if (!date) return (setFieldError("date", "Please select a date"), false);
    if (new Date(date) < new Date(minDate))
      return (
        setFieldError("date", "Date must be at least 7 days from today"),
        false
      );
    setFieldError("date", "");
    return true;
  }
  function validatePhone() {
    const val = phone.trim();
    if (!val)
      return (setFieldError("phone", "Phone number is required"), false);
    if (/\s/.test(val))
      return (setFieldError("phone", "Phone cannot contain spaces"), false);
    if (!/^\d+$/.test(val))
      return (setFieldError("phone", "Phone can only contain digits"), false);
    if (val.length !== 10)
      return (
        setFieldError("phone", "Phone number must be exactly 10 digits"),
        false
      );
    setFieldError("phone", "");
    return true;
  }
  function validateCarYear() {
    const val = String(carYear).trim();
    const yearNum = Number(val);
    const currentYear = new Date().getFullYear();
    if (!val)
      return (setFieldError("carYear", "Year purchased is required"), false);
    if (!/^[0-9]{4}$/.test(val))
      return (setFieldError("carYear", "Enter a valid 4-digit year"), false);
    if (yearNum < 1980 || yearNum > currentYear)
      return (
        setFieldError(
          "carYear",
          `Year must be between 1980 and ${currentYear}`,
        ),
        false
      );
    setFieldError("carYear", "");
    return true;
  }
  function validateCarModel() {
    const val = carModel.trim();
    if (!val)
      return (setFieldError("carModel", "Car Model is required"), false);
    if (val.length < 2)
      return (setFieldError("carModel", "Car Model seems too short"), false);
    setFieldError("carModel", "");
    return true;
  }
  function validateAddress() {
    const val = address.trim();
    if (!val) return (setFieldError("address", "Address is required"), false);
    if (val.length < 10)
      return (
        setFieldError(
          "address",
          "Please provide a more detailed address (min 10 chars)",
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
    const validations = [
      { ok: validateDistrict(), elementId: "district" },
      { ok: validateProvider(), elementId: "service-provider" },
      { ok: validateServices(), elementId: "services-section" },
      { ok: validatePaintColor(), elementId: "paint-color-section" },
      { ok: validateDate(), elementId: "date" },
      { ok: validatePhone(), elementId: "phone" },
      { ok: validateCarYear(), elementId: "car-year" },
      { ok: validateCarModel(), elementId: "car-model" },
      { ok: validateAddress(), elementId: "address" },
      { ok: validateDescription(), elementId: "description" },
    ];
    const firstBad = validations.find((v) => !v.ok);
    if (firstBad?.elementId) {
      const el = document.getElementById(firstBad.elementId);
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    return !firstBad;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validateAll()) {
      setShowSummary(false);
      return;
    }
    setShowSummary(true);
  }

  useEffect(() => {
    if (!showSummary) return;
    const el = document.getElementById("summary-box");
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showSummary]);

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
          carYear: Number(carYear),
          address: address.trim(),
          description: description.trim(),
          district,
          paintColor: paintColor
            ? String(paintColor).trim().toLowerCase()
            : undefined,
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
    setPaintColor("");
    setFieldError("provider", "");
    setFieldError("services", "");
    setFieldError("paintColor", "");
  }, [district]);
  useEffect(() => {
    // Changing provider clears selected services
    setServices([]);
    setPaintColor("");
    setFieldError("services", "");
    setFieldError("paintColor", "");
  }, [providerId]);

  useEffect(() => {
    // If Car Painting is deselected, clear paint color
    if (!isCarPaintingSelected && paintColor) {
      setPaintColor("");
      setFieldError("paintColor", "");
    }
  }, [isCarPaintingSelected]);

  return (
    <>
      <CustomerNav />

      <main>
        <h1>Service Booking</h1>
        <h2>Choose a Service Provider</h2>

        {/* District filter (top-left below heading) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "8px 0 16px",
          }}
        >
          <label htmlFor="district" style={{ fontWeight: 600 }}>
            District
          </label>
          <select
            id="district"
            required
            className={cls("district")}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            onBlur={validateDistrict}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
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
        </div>

        {/* Provider Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {!district && (
            <p style={{ gridColumn: "1/-1" }}>
              Select a district to see available service providers.
            </p>
          )}
          {providersForDistrict.length === 0 && district && (
            <p style={{ gridColumn: "1/-1" }}>No providers in this district.</p>
          )}
          {district &&
            providersForDistrict.map((p) => {
              const rating = ratingsMap[String(p._id)]?.avgRating || 0;
              const reviews = ratingsMap[String(p._id)]?.totalReviews || 0;
              const minCost = (p.servicesOffered || []).reduce((m, s) => {
                const c = Number(s.cost || 0);
                return !isNaN(c) && c > 0
                  ? m === null
                    ? c
                    : Math.min(m, c)
                  : m;
              }, null);
              const selected = String(providerId) === String(p._id);
              return (
                <button
                  key={p._id}
                  onClick={() => setProviderId(String(p._id))}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 12,
                    border: selected
                      ? "2px solid #2563eb"
                      : "1px solid #e5e7eb",
                    background: selected ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>{p.name}</strong>
                    <span style={{ fontSize: 12, color: "#555" }}>
                      {p.district || ""}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                    {(p.servicesOffered || []).slice(0, 4).map((s, i) => (
                      <span key={s.name + i} style={{ marginRight: 8 }}>
                        {s.name}
                      </span>
                    ))}
                    {(p.servicesOffered || []).length > 4 && <span>…</span>}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <span
                      title={reviews > 0 ? `${rating} / 5` : "No reviews yet"}
                    >
                      ⭐ {reviews > 0 ? rating : "New"}
                    </span>
                    <span style={{ marginLeft: 8, color: "#666" }}>
                      ({reviews} reviews)
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#0b6" }}>
                    {minCost != null
                      ? `Starting at ₹${minCost} (Subject to change)`
                      : "Contact for pricing"}
                  </div>
                </button>
              );
            })}
        </div>

        {providerId && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <h3 style={{ marginBottom: 12 }}>
              Reviews for {provider?.name || "Service Provider"}
            </h3>
            {providerReviewsLoading && <p>Loading reviews...</p>}
            {providerReviewsError && (
              <p style={{ color: "crimson" }}>{providerReviewsError}</p>
            )}
            {!providerReviewsLoading &&
              !providerReviewsError &&
              providerReviews.length === 0 && <p>No reviews yet.</p>}
            {!providerReviewsLoading &&
              !providerReviewsError &&
              providerReviews.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  {providerReviews.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 12,
                        background: "#f9fafb",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                      <div style={{ fontSize: 13 }}>⭐ {r.rating} / 5</div>
                      {r.review ? (
                        <p style={{ marginTop: 6 }}>{r.review}</p>
                      ) : (
                        <p style={{ marginTop: 6, color: "#6b7280" }}>
                          No review text.
                        </p>
                      )}
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        <h2>Fill Your Booking Details</h2>

        <form id="booking-form" onSubmit={onSubmit}>
          {/* District selection moved above provider cards */}

          <label htmlFor="service-provider">Selected Service Provider</label>
          <select
            id="service-provider"
            required
            className={cls("provider")}
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            onBlur={validateProvider}
            disabled={!district}
          >
            <option value="">
              {district ? "Select from cards above" : "Select district first"}
            </option>
            {district &&
              providersForDistrict.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.district ? `(${p.district})` : ""}
                </option>
              ))}
          </select>
          <span className="error-msg" data-for="service-provider">
            {errors.provider || ""}
          </span>

          <label>Select Services:</label>
          <div
            id="services-section"
            className={cls("services")}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {offeredServices.map((name) => (
              <label
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={services.includes(name)}
                  onChange={(e) => {
                    setServices((prev) =>
                      e.target.checked
                        ? [...prev, name]
                        : prev.filter((s) => s !== name),
                    );
                  }}
                />
                <span>{name}</span>
                <span
                  style={{ marginLeft: "auto", fontSize: 12, color: "#0b6" }}
                >
                  ₹{serviceCostMap[name] || "N/A"} starting
                </span>
              </label>
            ))}
          </div>
          <span className="error-msg" data-for="service">
            {errors.services || ""}
          </span>

          {/* Car Painting Color Selection */}
          {isCarPaintingSelected && (
            <div
              id="paint-color-section"
              style={{
                marginTop: 14,
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
              }}
            >
              <label
                style={{ fontWeight: 600, display: "block", marginBottom: 8 }}
              >
                Choose Paint Color
              </label>

              {providerPaintColors.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {providerPaintColors.map((c) => {
                    const selected =
                      String(paintColor || "").toLowerCase() === c;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => {
                          setPaintColor(c);
                          setFieldError("paintColor", "");
                        }}
                        title={c}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          border: selected
                            ? "2px solid #2563eb"
                            : "1px solid #cbd5e1",
                          background: c,
                          cursor: "pointer",
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#666" }}>
                  This provider hasn’t configured paint colors for Car Painting.
                  Please choose a different provider.
                </div>
              )}

              <span className="error-msg" data-for="paint-color">
                {errors.paintColor || ""}
              </span>
            </div>
          )}

          <p
            id="serviceCostDisplay"
            style={{ margin: "10px 0", fontWeight: "bold" }}
          >
            {services.length > 0
              ? `Starting Cost(s) (Subject to change): ${services
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
          <label htmlFor="car-year">Year Car Was Bought:</label>
          <input
            type="number"
            id="car-year"
            required
            placeholder="e.g., 2020"
            value={carYear}
            min="1980"
            max={new Date().getFullYear()}
            onChange={(e) => setCarYear(e.target.value)}
            onBlur={validateCarYear}
            className={cls("carYear")}
          />
          <span className="error-msg" data-for="car-year">
            {errors.carYear || ""}
          </span>
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
          <div id="summary-box" style={{ marginTop: 20, display: "block" }}>
            <div>
              <h3>Booking Summary</h3>
              <p>
                <strong>Car Model:</strong> {carModel.trim()}
              </p>
              <p>
                <strong>Services:</strong> {services.join(", ")}
              </p>
              {isCarPaintingSelected && paintColor ? (
                <p>
                  <strong>Paint Color:</strong>{" "}
                  {String(paintColor).trim().toLowerCase()}
                </p>
              ) : null}
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
              <p style={{ fontSize: 12, color: "#666" }}>
                Costs shown are starting estimates and subject to change.
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
              <p>
                <strong>Car Year:</strong> {carYear}
              </p>
              <button
                type="button"
                id="confirm-booking"
                onClick={confirmBooking}
              >
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
