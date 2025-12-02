import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";

import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerUsers from "./pages/manager/Users";
import Profiles from "./pages/manager/Profiles";
import ManagerOrders from "./pages/manager/Orders";
import Payments from "./pages/manager/Payments";
import Support from "./pages/manager/Support";
import ManagerChat from "./pages/manager/Chat";

import AllIndex from "./pages/all/Index";
import FAQ from "./pages/all/FAQ";
import ContactUs from "./pages/all/ContactUs";

import CustomerIndex from "./pages/customer/Index";
import CustomerBooking from "./pages/customer/Booking";
import CustomerHistory from "./pages/customer/History";
import CustomerCart from "./pages/customer/Cart";
import CustomerProfile from "./pages/customer/Profile";
import CustomerChat from "./pages/customer/Chat";
import ProductDetails from "./pages/customer/ProductDetails";

import ServiceDashboard from "./pages/service/DashboardService";
import ServiceProfileSettings from "./pages/service/ProfileSettings";
import ServiceBookingManagement from "./pages/service/BookingManagement";
import ServiceReviews from "./pages/service/Reviews";

import SellerDashboard from "./pages/seller/Dashboard";
import SellerProfileSettings from "./pages/seller/ProfileSettings";
import SellerProductManagement from "./pages/seller/ProductManagement";
import SellerOrders from "./pages/seller/Orders";

import Logout from "./pages/Logout";

// ------------------------------------------

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

function RequireRole({ role, children }) {
  const { loading, user } = useSession();

  if (loading) return null; // optionally show spinner
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}

// ------------------------------------------

export default function App() {
  return (
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

      {/* Service Provider */}
      <Route path="/service/dashboard" element={<ServiceDashboard />} />
      <Route path="/service/dashboardService" element={<ServiceDashboard />} />
      <Route
        path="/service/profileSettings"
        element={<ServiceProfileSettings />}
      />
      <Route
        path="/service/profileSettings.html"
        element={<ServiceProfileSettings />}
      />
      <Route
        path="/service/bookingManagement"
        element={<ServiceBookingManagement />}
      />
      <Route
        path="/service/bookingManagement.html"
        element={<ServiceBookingManagement />}
      />
      <Route path="/service/reviews" element={<ServiceReviews />} />
      <Route path="/service/reviews.html" element={<ServiceReviews />} />

      {/* Manager (protected) */}
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

      {/* Seller */}
      <Route
        path="/seller/dashboard"
        element={
          <RequireRole role="seller">
            <SellerDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/seller/dashboard.html"
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
        path="/seller/profileSettings.html"
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
        path="/seller/productManagement.html"
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
      <Route
        path="/seller/orders.html"
        element={
          <RequireRole role="seller">
            <SellerOrders />
          </RequireRole>
        }
      />

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
  );
}
