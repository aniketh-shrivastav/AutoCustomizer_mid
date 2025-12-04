import React, { useEffect, useState } from "react";
import AllNav from "../../components/AllNav";

function useExternalCss(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [href]);
}

export default function FAQ() {
  useExternalCss("/styles/index.css"); // your global page styling
  useExternalCss("/styles/faq-theme.css"); // theme-specific styling only

  const [authed, setAuthed] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("session fetch failed");
        const data = await res.json();
        if (!cancelled) setAuthed(!!data.authenticated);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`faq-page ${theme}`}>
      <AllNav
        authed={authed}
        active="faq"
        onToggleTheme={() =>
          setTheme((prev) => (prev === "light" ? "dark" : "light"))
        }
        themeLabel={theme === "light" ? "Dark Mode" : "Light Mode"}
      />

      <header>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about using AutoCustomizer.</p>
      </header>

      <section className="faq-content">
        <div className="feature">
          <h2>For Customers</h2>
          <p>
            <strong>Q:</strong> How do I book a service?
            <br />
            <strong>A:</strong> Go to the service section and click "Book Now".
          </p>

          <p>
            <strong>Q:</strong> Can I cancel a booking?
            <br />
            <strong>A:</strong> Yes, at least 24 hours before the appointment.
          </p>

          <p>
            <strong>Q:</strong> What payment options are available?
            <br />
            <strong>A:</strong> UPI, credit/debit cards & net banking.
          </p>
        </div>

        <div className="feature">
          <h2>For Sellers</h2>
          <p>
            <strong>Q:</strong> How do I list a product?
            <br />
            <strong>A:</strong> Create a seller account and add items.
          </p>

          <p>
            <strong>Q:</strong> Can I manage inventory?
            <br />
            <strong>A:</strong> Yes, you can update stock anytime.
          </p>

          <p>
            <strong>Q:</strong> How are payments handled?
            <br />
            <strong>A:</strong> Secure transfers to your linked account.
          </p>

          <p>
            <strong>Q:</strong> Is there a commission?
            <br />
            <strong>A:</strong> Yes, 20% per sale.
          </p>
        </div>

        <div className="feature">
          <h2>For Service Providers</h2>
          <p>
            <strong>Q:</strong> How do I register?
            <br />
            <strong>A:</strong> Choose "Service Provider" during signup.
          </p>

          <p>
            <strong>Q:</strong> Where can I manage bookings?
            <br />
            <strong>A:</strong> Your provider dashboard.
          </p>

          <p>
            <strong>Q:</strong> Can I update services?
            <br />
            <strong>A:</strong> Yes, anytime from dashboard.
          </p>

          <p>
            <strong>Q:</strong> Commission?
            <br />
            <strong>A:</strong> 20% per completed job.
          </p>
        </div>
      </section>

      <footer>
        <p>© 2025 AutoCustomizer. All rights reserved.</p>
      </footer>
    </div>
  );
}
