import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function useExternalCss(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

export default function AllIndex() {
  const navigate = useNavigate();
  const [session, setSession] = useState({ authenticated: false });

  // Load CSS exactly like index.html
  useExternalCss("/styles/index.css");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/session", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed session");
        const j = await res.json();
        if (!cancelled) setSession(j);
      } catch {
        if (!cancelled) setSession({ authenticated: false });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const authed = !!session.authenticated;

  const handleBrowseProducts = (event) => {
    event.preventDefault();
    navigate("/customer/index");
  };

  return (
    <>
      {/* ---------------- NAV ---------------- */}
      <nav>
        <div className="logo">AutoCustomizer</div>
        <ul className="nav-links" id="globalNav">
          <li>
            <a href="/">Home</a>
          </li>

          <li id="loginLink">
            <a href="/login">Login</a>
          </li>
          <li id="signupLink">
            <a href="/signup">Signup</a>
          </li>

          <li>
            <a href="/contactus">Contact Us</a>
          </li>
          <li>
            <a href="/faq">FAQ</a>
          </li>
        </ul>
      </nav>

      {/* ---------------- HEADER (MISSING IN YOUR BUILD BEFORE) ---------------- */}
      <header>
        <h1>Welcome to AutoCustomizer</h1>
        <p>
          The ultimate marketplace connecting car enthusiasts, quality parts
          sellers, and expert service providers.
        </p>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <img
          src="/public/images2/car-customization.png"
          alt="Car Customization"
        />

        <div className="hero-content">
          <h2>Your Car, Your Style!</h2>
          <p>
            Whether you're looking to customize your car, sell premium parts, or
            offer your expert services – AutoCustomizer is your platform.
          </p>

          <div className="cta-buttons">
            {authed ? (
              <>
                <a
                  href="/customer/index"
                  className="btn"
                  onClick={handleBrowseProducts}
                >
                  Browse Products
                </a>
                <a href="/customer/booking.html" className="btn">
                  Book a Service
                </a>
              </>
            ) : (
              <>
                <a href="/login" className="btn">
                  Browse Products
                </a>
                <a href="/login" className="btn">
                  Book a Service
                </a>
              </>
            )}

            <a href="/signup" className="btn seller-btn">
              Sell Products
            </a>
            <a href="/signup" className="btn provider-btn">
              Offer Services
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- USER TYPES ---------------- */}
      <section className="user-types">
        <h2>AutoCustomizer For Everyone</h2>

        <div className="user-type-container">
          <div className="user-type">
            <h3>Car Owners</h3>
            <p>
              Find premium parts and expert services to customize your vehicle
              exactly how you want it.
            </p>
            <a href="/signup" className="btn small">
              Get Started
            </a>
          </div>

          <div className="user-type">
            <h3>Parts Sellers</h3>
            <p>
              Reach thousands of car enthusiasts looking for quality parts.
              Manage inventory, sales, and grow your business.
            </p>
            <a href="/signup" className="btn small">
              Start Selling
            </a>
          </div>

          <div className="user-type">
            <h3>Service Providers</h3>
            <p>
              Showcase your expertise, get booked online, and expand your
              customer base through our platform.
            </p>
            <a href="/signup" className="btn small">
              Offer Services
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="features">
        <div className="feature">
          <img src="/public/images2/products.png" alt="Car Parts" />
          <h3>Wide Range of Car Parts</h3>
          <p>
            Find or sell the best quality car parts & accessories for all
            customization needs.
          </p>
        </div>

        <div className="feature">
          <img src="/public/images2/service.png" alt="Car Service" />
          <h3>Top Service Providers</h3>
          <p>
            Choose from or join our network of expert service providers for car
            wrapping, tuning, and more.
          </p>
        </div>

        <div className="feature">
          <img src="/public/images2/easy-booking.png" alt="Easy Booking" />
          <h3>Easy Platform for All</h3>
          <p>
            Shop with ease, book services instantly, or manage your
            seller/provider business through our intuitive dashboard.
          </p>
        </div>
      </section>

      {/* ---------------- BENEFITS ---------------- */}
      <section className="benefits">
        <h2>Why Join AutoCustomizer as a Business Partner?</h2>

        <div className="benefits-container">
          <div className="benefit">
            <h3>Targeted Audience</h3>
            <p>
              Connect directly with car enthusiasts actively looking for your
              products and services.
            </p>
          </div>

          <div className="benefit">
            <h3>Business Tools</h3>
            <p>
              Access inventory management, scheduling, analytics, and payment
              processing tools.
            </p>
          </div>

          <div className="benefit">
            <h3>Growth Opportunity</h3>
            <p>
              Expand your reach and grow your business through our marketplace
              platform.
            </p>
          </div>

          <div className="benefit">
            <h3>Seamless Experience</h3>
            <p>
              Our platform handles the technical details so you can focus on
              your core business.
            </p>
          </div>
        </div>

        <a href="/faq" className="btn large">
          Learn More About Our Business Solutions
        </a>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer>
        <p>© 2025 AutoCustomizer. All rights reserved.</p>
      </footer>
    </>
  );
}
