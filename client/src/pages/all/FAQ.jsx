import React, { useEffect, useState } from "react";

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
  useExternalCss("/styles/index.css");
  const [authed, setAuthed] = useState(false);

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
    <div>
      <nav>
        <div className="logo">AutoCustomizer</div>
        <ul className="nav-links" id="globalNav">
          <li>
            <a href="/">Home</a>
          </li>
          {!authed && (
            <>
              <li id="loginLink">
                <a href="/login">Login</a>
              </li>
              <li id="signupLink">
                <a href="/signup">Signup</a>
              </li>
            </>
          )}
          <li>
            <a href="/contactus">Contact Us</a>
          </li>
          <li>
            <a href="/faq" className="active">
              FAQ
            </a>
          </li>
        </ul>
      </nav>

      <header>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about using AutoCustomizer.</p>
      </header>

      <section
        className="features"
        style={{ flexDirection: "column", gap: 40 }}
      >
        <div className="feature">
          <h2>For Customers</h2>
          <p>
            <strong>Q:</strong> How do I book a service?
            <br />
            <strong>A:</strong> Go to the service section, choose a provider,
            and click "Book Now".
          </p>
          <p>
            <strong>Q:</strong> Can I cancel a booking?
            <br />
            <strong>A:</strong> Yes, from your dashboard. Cancellations must be
            made 24 hours in advance.
          </p>
          <p>
            <strong>Q:</strong> What payment options are available?
            <br />
            <strong>A:</strong> UPI, credit/debit cards, and net banking are
            accepted.
          </p>
        </div>

        <div className="feature">
          <h2>For Sellers</h2>
          <p>
            <strong>Q:</strong> How do I list a product?
            <br />
            <strong>A:</strong> Sign up as a seller, then go to your dashboard
            to add products.
          </p>
          <p>
            <strong>Q:</strong> Can I manage inventory?
            <br />
            <strong>A:</strong> Yes, sellers have access to inventory management
            tools.
          </p>
          <p>
            <strong>Q:</strong> How are payments handled?
            <br />
            <strong>A:</strong> Payments are securely processed and transferred
            to your linked account.
          </p>
          <p>
            <strong>Q:</strong> Is there any commission on sales?
            <br />
            <strong>A:</strong> Yes, a 20% commission is charged on every
            transaction made through the platform.
          </p>
        </div>

        <div className="feature">
          <h2>For Service Providers</h2>
          <p>
            <strong>Q:</strong> How do I register my workshop?
            <br />
            <strong>A:</strong> Choose "Service Provider" on signup and fill in
            your workshop details.
          </p>
          <p>
            <strong>Q:</strong> Where can I manage bookings?
            <br />
            <strong>A:</strong> You can view, accept, or reschedule bookings via
            your provider dashboard.
          </p>
          <p>
            <strong>Q:</strong> Can I update my service list?
            <br />
            <strong>A:</strong> Yes, your dashboard allows you to manage all
            listed services.
          </p>
          <p>
            <strong>Q:</strong> Is there any commission for services provided?
            <br />
            <strong>A:</strong> Yes, AutoCustomizer charges a 20% commission on
            all completed service transactions.
          </p>
        </div>
      </section>

      <footer>
        <p>© 2025 AutoCustomizer. All rights reserved.</p>
      </footer>
    </div>
  );
}
