import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BulkUpload.css';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/Seller/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setSuccess('File uploaded successfully!');
      setFile(null);
      // Redirect to bulk upload result after a short delay
      setTimeout(() => {
        navigate('/seller/bulk-upload-result');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    window.location.href = '/Seller/bulk-upload/sample-csv';
  };

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
        <h1>Bulk Upload Products</h1>
      </header>

      {/* Main Content */}
      <main className="seller-main container">
          <p className="intro-text">Choose one of these upload options:</p>
          <ol className="upload-options">
            <li>
              <strong>ZIP</strong>: upload a ZIP containing
              <code>products.csv</code> (or .xlsx) and an
              <code>images/</code> folder. Rows should reference images by
              filename (e.g. <code>rim1.jpg</code>).
            </li>
            <li>
              <strong>CSV/XLSX</strong>: upload a CSV or Excel where the
              <code>image</code> column contains public image URLs (https://...)
            </li>
          </ol>

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label htmlFor="file">Select ZIP / CSV / XLSX</label>
              <input
                type="file"
                id="file"
                name="file"
                accept=".zip,.csv,.xlsx"
                onChange={handleFileChange}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-add"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {/* Messages */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Sample CSV Download */}
          <p className="sample-download">
            Download sample CSV:
            <button
              type="button"
              onClick={downloadSample}
              className="link-button"
            >
              product_upload_sample.csv
            </button>
          </p>

          {/* Sample CSV Format */}
          <h3>Sample products.csv (for ZIP)</h3>
          <pre className="code-block">
{`name,price,description,category,brand,quantity,sku,compatibility,image
Alloy Rims,12000,16-inch alloy rims,WHEELS,OZ,20,RIM123,Civic,rim1.jpg
Car Spoiler,8000,Rear spoiler,BODYKIT,Mugen,15,SPOILR,Accord,spoiler.jpg`}
          </pre>
      </main>

      {/* Footer */}
      <footer className="seller-footer">
        <p>&copy; 2025 AutoCustomizer | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default BulkUpload;
