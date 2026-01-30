import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BulkUploadResult.css';

const BulkUploadResult = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await fetch('/seller/api/bulk-upload-result', {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (!data.success || !data.results) {
        setError('No summary available.');
        setLoading(false);
        return;
      }

      setResults(data.results);
      setLoading(false);
    } catch (err) {
      setError('Failed to load summary.');
      setLoading(false);
    }
  };

  const goBackToProducts = () => {
    navigate('/seller/product-management');
  };

  if (loading) {
    return (
      <div className="seller-page">
        <nav className="navbar">
          <div className="brand">
            <img
              src="/images3/logo2.jpg"
              alt="AutoCustomizer Logo"
              className="navbar-logo"
            />
          </div>
          <ul>
            <li>
              <a href="/seller/dashboard">Dashboard</a>
            </li>
            <li>
              <a href="/seller/profile-settings">Profile Settings</a>
            </li>
            <li>
              <a href="/seller/product-management">Products</a>
            </li>
            <li>
              <a href="/seller/orders">Orders</a>
            </li>
            <li>
              <a href="/logout">Logout</a>
            </li>
          </ul>
        </nav>
        <header className="page-header">
          <h1>Bulk Upload Result</h1>
        </header>
        <main className="seller-main">
          <div className="container">
            <div className="summary">
              <p>Loading summary...</p>
            </div>
          </div>
        </main>
        <footer className="seller-footer">
          <p>&copy; 2025 AutoCustomizer | All Rights Reserved</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="seller-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="brand">
          <img
            src="/images3/logo2.jpg"
            alt="AutoCustomizer Logo"
            className="navbar-logo"
          />
        </div>
        <ul>
          <li>
            <a href="/seller/dashboard">Dashboard</a>
          </li>
          <li>
            <a href="/seller/profileSettings">Profile Settings</a>
          </li>
          <li>
            <a href="/seller/productmanagement">Products</a>
          </li>
          <li>
            <a href="/seller/orders">Orders</a>
          </li>
          <li>
            <a href="/logout">Logout</a>
          </li>
        </ul>
      </nav>

      {/* Header */}
      <header className="page-header">
        <h1>Bulk Upload Result</h1>
      </header>

      {/* Main Content */}
      <main className="seller-main container">
          <h2>Bulk Upload Summary</h2>

          {error && <div className="alert alert-error">{error}</div>}

          {results && (
            <div className="summary">
              <ul>
                <li>
                  <strong>Total rows:</strong> {results.total}
                </li>
                <li>
                  <strong>Inserted:</strong> {results.inserted}
                </li>
                <li>
                  <strong>Skipped:</strong> {results.skipped}
                </li>
                <li>
                  <strong>Failed:</strong> {results.failed}
                </li>
              </ul>

              {Array.isArray(results.errors) && results.errors.length > 0 && (
                <div className="errors">
                  <h3>Details</h3>
                  <ul>
                    {results.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={goBackToProducts}
              className="link-button"
            >
              Back to Product Management
            </button>
          </p>
      </main>

      {/* Footer */}
      <footer className="seller-footer">
        <p>&copy; 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default BulkUploadResult;
