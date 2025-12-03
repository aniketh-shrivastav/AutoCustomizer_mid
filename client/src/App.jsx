import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

// Redux
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";

// Manager
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerUsers from "./pages/manager/Users";
import Profiles from "./pages/manager/Profiles";
import ManagerOrders from "./pages/manager/Orders";
import Payments from "./pages/manager/Payments";
import Support from "./pages/manager/Support";
import ManagerChat from "./pages/manager/Chat";

// All Users (public)
import AllIndex from "./pages/all/Index";
import FAQ from "./pages/all/FAQ";
import ContactUs from "./pages/all/ContactUs";

// Customer
import CustomerIndex from "./pages/customer/Index";
import CustomerBooking from "./pages/customer/Booking";
import CustomerHistory from "./pages/customer/History";
import CustomerCart from "./pages/customer/Cart";
import CustomerProfile from "./pages/customer/Profile";
import CustomerChat from "./pages/customer/Chat";
import ProductDetails from "./pages/customer/ProductDetails";

// Service Provider
import ServiceDashboard from "./pages/service/DashboardService";
import ServiceProfileSettings from "./pages/service/ProfileSettings";
import ServiceBookingManagement from "./pages/service/BookingManagement";
import ServiceReviews from "./pages/service/Reviews";

// Seller
import SellerDashboard from "./pages/seller/Dashboard";
import SellerProfileSettings from "./pages/seller/ProfileSettings";
import SellerProductManagement from "./pages/seller/ProductManagement";
import SellerOrders from "./pages/seller/Orders";
import BulkUpload from "./pages/seller/BulkUpload";
import BulkUploadResult from "./pages/seller/BulkUploadResult";

// Logout
import Logout from "./pages/Logout";

// ------------------ SESSION HOOK ---------------------

function useSession() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/session", {
          headers: { Accept: "application/json" },
        });
        const j = await res.json().catch(() => ({}));
        if (!cancelled) setState({ loading: false, user: j?.user || null });
      } catch {
        if (!cancelled) setState({ loading: false, user: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// ------------------ ROLE PROTECTION ---------------------

function RequireRole({ role, children }) {
  const { loading, user } = useSession();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}

// ------------------ MAIN APP ---------------------

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>}
        persistor={persistor}
      >
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<AllIndex />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contactus" element={<ContactUs />} />

          {/* Customer */}
          <Route path="/customer/index" element={<CustomerIndex />} />
          <Route path="/customer/booking" element={<CustomerBooking />} />
          <Route path="/customer/history" element={<CustomerHistory />} />
          <Route path="/customer/cart" element={<CustomerCart />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/chat" element={<CustomerChat />} />
          <Route path="/customer/product/:id" element={<ProductDetails />} />

          {/* Service Provider Protected */}
          <Route
            path="/service/dashboard"
            element={
              <RequireRole role="service-provider">
                <ServiceDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/service/profileSettings"
            element={
              <RequireRole role="service-provider">
                <ServiceProfileSettings />
              </RequireRole>
            }
          />
          <Route
            path="/service/bookingManagement"
            element={
              <RequireRole role="service-provider">
                <ServiceBookingManagement />
              </RequireRole>
            }
          />
          <Route
            path="/service/reviews"
            element={
              <RequireRole role="service-provider">
                <ServiceReviews />
              </RequireRole>
            }
          />

          {/* Manager Protected */}
          <Route
            path="/manager/dashboard"
            element={
              <RequireRole role="manager">
                <ManagerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/manager/users"
            element={
              <RequireRole role="manager">
                <ManagerUsers />
              </RequireRole>
            }
          />
          <Route
            path="/manager/profiles"
            element={
              <RequireRole role="manager">
                <Profiles />
              </RequireRole>
            }
          />
          <Route
            path="/manager/orders"
            element={
              <RequireRole role="manager">
                <ManagerOrders />
              </RequireRole>
            }
          />
          <Route
            path="/manager/payments"
            element={
              <RequireRole role="manager">
                <Payments />
              </RequireRole>
            }
          />
          <Route
            path="/manager/support"
            element={
              <RequireRole role="manager">
                <Support />
              </RequireRole>
            }
          />
          <Route
            path="/manager/chat"
            element={
              <RequireRole role="manager">
                <ManagerChat />
              </RequireRole>
            }
          />

          {/* Seller Protected */}
          <Route
            path="/seller/dashboard"
            element={
              <RequireRole role="seller">
                <SellerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/seller/profileSettings"
            element={
              <RequireRole role="seller">
                <SellerProfileSettings />
              </RequireRole>
            }
          />
          <Route
            path="/seller/productmanagement"
            element={
              <RequireRole role="seller">
                <SellerProductManagement />
              </RequireRole>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <RequireRole role="seller">
                <SellerOrders />
              </RequireRole>
            }
          />
          <Route path="/seller/bulk-upload" element={<BulkUpload />} />
          <Route path="/seller/bulk-upload-result" element={<BulkUploadResult />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ padding: 24 }}>
                <h2>Page not found</h2>
                <p>
                  Quick links: <Link to="/">Home</Link>,{" "}
                  <Link to="/login">Login</Link>, <Link to="/signup">Signup</Link>
                </p>
              </div>
            }
          />
        </Routes>
      </PersistGate>
    </Provider>
  );
}
