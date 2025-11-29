import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.message || "Request failed");
      } else {
        setMessage(j.message || "If that email exists, a reset link was sent.");
        if (j.previewUrl) {
          setMessage(
            (prev) => prev + " You can preview the email using the link below."
          );
          // Store preview URL in state by appending to message or show separate section
          setPreviewUrl(j.previewUrl);
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const [previewUrl, setPreviewUrl] = useState(null);

  return (
    <div className="container">
      <div className="auth-container">
        <div className="auth-section" style={{ maxWidth: 420 }}>
          <h2>Forgot Password</h2>
          <p>Enter your account email to receive a reset link.</p>
          {message && <div className="alert alert-success">{message}</div>}
          {previewUrl && (
            <div className="alert alert-info">
              Test email preview:{" "}
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Open
              </a>
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fpEmail">Email Address</label>
              <input
                id="fpEmail"
                type="email"
                required
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="submit-btn" disabled={loading} type="submit">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <p style={{ marginTop: 16 }}>
            <a href="/login">Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
