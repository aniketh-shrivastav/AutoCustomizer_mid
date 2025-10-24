import React from "react";

export default function Login() {
  return (
    <div className="container">
      <div className="auth-container">
        <div className="brand-section">
          <div className="brand-content">
            <h1>AutoCustomizer</h1>
            <p>Your one-stop platform for all car customization needs</p>
            <img
              src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80"
              alt="Car customization"
              className="brand-image"
            />
          </div>
        </div>
        <div className="auth-section">
          <h2>Welcome Back</h2>
          {/* Use a regular HTML form so the server can do role-based redirects */}
          <form action="/login" method="POST" className="auth-form">
            <div className="form-group">
              <label htmlFor="loginEmail">Email Address</label>
              <input
                type="email"
                name="email"
                id="loginEmail"
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                type="password"
                name="password"
                id="loginPassword"
                required
                placeholder="Enter your password"
              />
            </div>
            <div className="form-options"></div>
            <button type="submit" className="submit-btn">
              Sign In
            </button>
          </form>
          <p>
            Don't have an account? <a href="/signup">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
