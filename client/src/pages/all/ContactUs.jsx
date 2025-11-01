import React, { useEffect, useMemo, useRef, useState } from "react";

function useExternalCss(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

const nameRegex = /^[A-Za-z\s.-]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactUs() {
  useExternalCss("/styles/all.css");
  const [authed, setAuthed] = useState(false);
  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submittedFlag, setSubmittedFlag] = useState(false);
  const formRef = useRef(null);

  // Session to hide login/signup like legacy
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("session");
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

  // Detect ?submitted=true to show success alert (parity with legacy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("submitted") === "true") {
      setSubmittedFlag(true);
      // Clean URL
      if (window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, "", cleanUrl);
      }
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  function validateField(name, value) {
    if (name === "name") {
      if (!value.trim() || !nameRegex.test(value.trim()))
        return "Only letters and spaces allowed.";
    }
    if (name === "email") {
      if (!emailRegex.test(value.trim()))
        return "Enter a valid lowercase email.";
      if (/[A-Z]/.test(value))
        return "Email must not contain uppercase letters.";
    }
    if (name === "subject") {
      if (value.trim().length < 3)
        return "Subject must be at least 3 characters.";
    }
    if (name === "message") {
      if (value.trim().length < 10)
        return "Message must be at least 10 characters.";
    }
    return "";
  }

  function validateAll() {
    const next = {};
    Object.entries(values).forEach(([k, v]) => {
      const msg = validateField(k, v);
      if (msg) next[k] = msg;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const onBlur = (e) => {
    const { name, value } = e.target;
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  // Submit as a normal POST to preserve backend redirect behavior. Still a React form with validation.
  const onSubmit = (e) => {
    if (!validateAll()) {
      e.preventDefault();
      return;
    }
    // Let the native form POST to /contactus (proxied) so server redirect adds ?submitted=true
  };

  const styles = useMemo(
    () => ({
      page: {
        backgroundImage: "radial-gradient(#4b4a4a, #2d2b2b)",
        minHeight: "100vh",
        color: "white",
        paddingBottom: 40,
      },
      shell: {
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
      },
      card: {
        width: "100%",
        maxWidth: 700,
        backgroundColor: "rgba(51,49,49,0.95)",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        padding: 24,
      },
      heading: { margin: 0, fontSize: 28 },
      label: {
        display: "block",
        marginBottom: 6,
        color: "#e5e7eb",
        fontWeight: 600,
      },
      inputBase: {
        display: "block",
        width: "100%",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: "#fff",
        color: "#111827",
        outline: "none",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
      },
      error: { color: "#ef4444", fontSize: 12, marginTop: 6 },
      textarea: { minHeight: 140, resize: "vertical" },
      button: {
        backgroundColor: "#1e1e2d",
        color: "white",
        padding: "12px 16px",
        border: "none",
        cursor: "pointer",
        height: 44,
        borderRadius: 8,
        width: 200,
        marginTop: 12,
        fontWeight: 700,
      },
      buttonWrap: { display: "flex", justifyContent: "flex-end" },
      success: {
        background: "#064e3b",
        color: "#d1fae5",
        padding: 10,
        borderRadius: 8,
        margin: "12px 0",
      },
      fieldWrap: { marginBottom: 14 },
    }),
    []
  );

  const inputStyle = (key) => ({
    ...styles.inputBase,
    borderColor: errors[key] ? "#ef4444" : "#d1d5db",
  });

  return (
    <div className="bg-container" style={styles.page}>
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
            <a href="/contactus" className="active">
              Contact Us
            </a>
          </li>
          <li>
            <a href="/faq">FAQ</a>
          </li>
        </ul>
      </nav>

      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={{ textAlign: "left", marginBottom: 6 }}>
            <h2 style={styles.heading}>Contact Us</h2>
          </div>

          {submittedFlag && (
            <div style={styles.success}>
              Thank you! Your message has been submitted.
            </div>
          )}

          <form
            ref={formRef}
            method="POST"
            action="/contactus"
            onSubmit={onSubmit}
          >
            <div style={styles.fieldWrap}>
              <label htmlFor="name" style={styles.label}>
                Name
              </label>
              <input
                id="name"
                name="name"
                value={values.name}
                onChange={onChange}
                onBlur={onBlur}
                required
                style={inputStyle("name")}
              />
              {errors.name && <div style={styles.error}>{errors.name}</div>}
            </div>

            <div style={styles.fieldWrap}>
              <label htmlFor="email" style={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={values.email}
                onChange={onChange}
                onBlur={onBlur}
                required
                style={inputStyle("email")}
              />
              {errors.email && <div style={styles.error}>{errors.email}</div>}
            </div>

            <div style={styles.fieldWrap}>
              <label htmlFor="subject" style={styles.label}>
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                value={values.subject}
                onChange={onChange}
                onBlur={onBlur}
                required
                style={inputStyle("subject")}
              />
              {errors.subject && (
                <div style={styles.error}>{errors.subject}</div>
              )}
            </div>

            <div style={styles.fieldWrap}>
              <label htmlFor="message" style={styles.label}>
                Message (please include order Id or Booking Id if necessary)
              </label>
              <textarea
                id="message"
                name="message"
                value={values.message}
                onChange={onChange}
                onBlur={onBlur}
                required
                style={{ ...inputStyle("message"), ...styles.textarea }}
              />
              {errors.message && (
                <div style={styles.error}>{errors.message}</div>
              )}
            </div>

            <div style={styles.buttonWrap}>
              <button type="submit" className="mb-3" style={styles.button}>
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
