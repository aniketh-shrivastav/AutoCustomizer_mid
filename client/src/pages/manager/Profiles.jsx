import React, { useEffect, useMemo, useState } from "react";
import ManagerNav from "../../components/ManagerNav";

const ROLE_TABS = [
  { key: "all", label: "All Profiles" },
  { key: "customer", label: "Customer" },
  { key: "seller", label: "Seller" },
  { key: "service-provider", label: "Service Provider" },
];

function Card({ type, data, onView }) {
  const isEmpty = (v) => v === undefined || v === null || v === "";
  const text = (v) => (isEmpty(v) ? "" : v);

  if (type === "service-provider") {
    const servicesArr = Array.isArray(data.servicesOffered)
      ? data.servicesOffered
      : [];
    const services = servicesArr.length ? (
      <ul>
        {servicesArr.map((s, idx) => (
          <li key={idx}>
            <strong>{text(s.name)}</strong>
            {!isEmpty(s.cost) ? ` - ₹${s.cost}` : ""}
          </li>
        ))}
      </ul>
    ) : (
      <ul>
        <li>No services listed</li>
      </ul>
    );
    const needsUpdate = servicesArr.length === 0 || isEmpty(data.district);
    return (
      <div
        className={`profile-card service-provider`}
        data-role="service-provider"
        data-name={text(data.name).toLowerCase()}
        data-email={text(data.email).toLowerCase()}
      >
        <div className="profile-header"></div>
        <div className="profile-body">
          <h3 className="profile-name">{text(data.name)}</h3>
          <div className="service-provider-badge">Service Provider</div>
          <div className="profile-info">
            <p>
              <strong>Email:</strong> <span>{text(data.email)}</span>
            </p>
            <p>
              <strong>Phone:</strong> <span>{text(data.phone)}</span>
            </p>
          </div>
          <h3>Services Offered:</h3>
          {services}
          <p>
            <strong>District:</strong> {text(data.district)}
          </p>
          {needsUpdate && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#b45309",
                fontWeight: 600,
              }}
            >
              Profile not updated
            </div>
          )}
          <div className="profile-actions">
            <button className="btn-view" onClick={() => onView(data._id)}>
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "seller") {
    const user = data.sellerId || {};
    const needsUpdate = isEmpty(data.ownerName) || isEmpty(data.address);
    return (
      <div
        className="profile-card seller"
        data-role="seller"
        data-name={text(user.name).toLowerCase()}
        data-email={text(user.email).toLowerCase()}
      >
        <div className="profile-header"></div>
        <div className="profile-body">
          <h3 className="profile-name">{text(user.name)}</h3>
          <div className="seller-badge">Seller</div>
          <div className="profile-info">
            <p>
              <strong>Contact Email:</strong> <span>{text(user.email)}</span>
            </p>
            <p>
              <strong>Phone:</strong> <span>{text(user.phone)}</span>
            </p>
          </div>
          <h3>Store Details:</h3>
          <p>
            <strong>Owner Name:</strong> {text(data.ownerName)}
          </p>
          <p>
            <strong>Store Address:</strong> {text(data.address)}
          </p>
          {needsUpdate && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#b45309",
                fontWeight: 600,
              }}
            >
              Profile not updated
            </div>
          )}
          <div className="profile-actions">
            <button className="btn-view" onClick={() => onView(data._id)}>
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "customer") {
    const user = data.userId || {};
    const needsUpdate =
      isEmpty(data.address) || isEmpty(data.district) || isEmpty(data.carModel);
    return (
      <div
        className="profile-card customer"
        data-role="customer"
        data-name={text(user.name).toLowerCase()}
        data-email={text(user.email).toLowerCase()}
      >
        <div className="profile-header"></div>
        <div className="profile-body">
          <h3 className="profile-name">{text(user.name)}</h3>
          <div className="customer-badge">Customer</div>
          <div className="profile-info">
            <p>
              <strong>Email:</strong> <span>{text(user.email)}</span>
            </p>
            <p>
              <strong>Phone:</strong> <span>{text(user.phone)}</span>
            </p>
          </div>
          <h3>Customer Details:</h3>
          <p>
            <strong>Address:</strong> {text(data.address)}
          </p>
          <p>
            <strong>District:</strong> {text(data.district)}
          </p>
          <p>
            <strong>Car Model:</strong> {text(data.carModel)}
          </p>
          <p>
            <strong>Payments:</strong> {text(data.payments)}
          </p>
          {needsUpdate && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#b45309",
                fontWeight: 600,
              }}
            >
              Profile not updated
            </div>
          )}
          <div className="profile-actions">
            <button className="btn-view" onClick={() => onView(data._id)}>
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function Profiles() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    serviceProviders: [],
    sellers: [],
    customers: [],
  });
  const [active, setActive] = useState("all");
  const [term, setTerm] = useState("");

  useEffect(() => {
    document.body.classList.add("manager-theme");
    return () => document.body.classList.remove("manager-theme");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetch("/manager/api/services", {
          headers: { Accept: "application/json" },
        });
        if (resp.status === 401 || resp.status === 403) {
          window.location.href = "/login";
          return;
        }
        if (!resp.ok) throw new Error("Failed to load profiles");
        const json = await resp.json();
        if (!cancelled) {
          setData({
            serviceProviders: json.serviceProviders || [],
            sellers: json.sellers || [],
            customers: json.customers || [],
          });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load profiles");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    const all = [
      ...data.serviceProviders.map((sp) => ({
        type: "service-provider",
        data: sp,
        key: `sp-${sp._id}`,
      })),
      ...data.sellers.map((se) => ({
        type: "seller",
        data: se,
        key: `se-${se._id}`,
      })),
      ...data.customers.map((cu) => ({
        type: "customer",
        data: cu,
        key: `cu-${cu._id}`,
      })),
    ];
    const lower = term.toLowerCase();
    return all.filter(({ type, data }) => {
      const roleOk = active === "all" || type === active;
      const name = (
        data.name ||
        data.sellerId?.name ||
        data.userId?.name ||
        ""
      ).toLowerCase();
      const email = (
        data.email ||
        data.sellerId?.email ||
        data.userId?.email ||
        ""
      ).toLowerCase();
      const textMatch = !lower || name.includes(lower) || email.includes(lower);
      return roleOk && textMatch;
    });
  }, [active, term, data]);

  async function viewProfile(id) {
    try {
      const resp = await fetch(`/manager/profile-data/${id}`);
      if (resp.status === 401 || resp.status === 403) {
        window.location.href = "/login";
        return;
      }
      const j = await resp.json();
      const extra = j.extraDetails || "";
      alert(
        `\n${j.role} Profile\n\nName: ${j.name || ""}\nEmail: ${
          j.email || ""
        }\nPhone: ${j.phone || ""}\n\n${extra.replace(/<[^>]+>/g, "")}`
      );
    } catch (e) {
      alert("Error loading profile.");
    }
  }

  if (loading)
    return (
      <div className="main-content">
        <p>Loading profiles...</p>
      </div>
    );
  if (error)
    return (
      <div className="main-content">
        <p style={{ color: "#e74c3c" }}>{error}</p>
      </div>
    );

  return (
    <>
      <div className="navbar">
        <div className="logo">
          <h2>Manager's Panel</h2>
        </div>
        <ManagerNav />
      </div>

      <div className="main-content">
        <h1>User Profiles</h1>
        <div
          className="tab-bar"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 15,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-button ${active === t.key ? "active" : ""}`}
              onClick={() => setActive(t.key)}
              data-role={t.key}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ marginTop: 15 }}>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search profiles..."
          />
        </div>

        <div className="profiles-grid" style={{ display: "grid" }}>
          {cards.map(({ key, type, data }) => (
            <Card key={key} type={type} data={data} onView={viewProfile} />
          ))}
          {cards.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "#6b7280",
                padding: "20px",
              }}
            >
              No profiles match the current filters.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
