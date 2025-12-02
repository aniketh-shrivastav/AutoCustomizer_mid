import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerUsers from "./pages/manager/Users";
import Profiles from "./pages/manager/Profiles";
import Orders from "./pages/manager/Orders";
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
import ServiceDashboard from "./pages/service/DashboardService";
import ServiceProfileSettings from "./pages/service/ProfileSettings";
import ServiceBookingManagement from "./pages/service/BookingManagement";
import ServiceReviews from "./pages/service/Reviews";
import SellerDashboard from "./pages/seller/Dashboard";
import SellerProfileSettings from "./pages/seller/ProfileSettings";
import SellerProductManagement from "./pages/seller/ProductManagement";
import SellerOrders from "./pages/seller/Orders";
import Logout from "./pages/Logout";
import BulkUpload from './pages/seller/BulkUpload';
import BulkUploadResult from './pages/seller/BulkUploadResult';


export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<div style={{ padding: "50px", textAlign: "center" }}>Loading...</div>} persistor={persistor}>
        <Routes>
          <Route path="/" element={<AllIndex />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Logout (SPA route that calls server then redirects) */}
          <Route path="/logout" element={<Logout />} />
          {/* Public site (All) */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contactus" element={<ContactUs />} />
          {/* Customer */}
          <Route path="/customer/index" element={<CustomerIndex />} />
          <Route path="/customer/booking" element={<CustomerBooking />} />
          <Route path="/customer/history" element={<CustomerHistory />} />
          <Route path="/customer/cart" element={<CustomerCart />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/chat" element={<CustomerChat />} />
          {/* Service Provider */}
          <Route path="/service/dashboard" element={<ServiceDashboard />} />
          {/* Back-compat for legacy path used by server redirects/static HTML */}
          <Route path="/service/dashboardService" element={<ServiceDashboard />} />
          <Route
            path="/service/profileSettings"
            element={<ServiceProfileSettings />}
          />
          {/* Alias for legacy static html path */}
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
          {/* Manager (React) */}
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/users" element={<ManagerUsers />} />
          <Route path="/manager/profiles" element={<Profiles />} />
          <Route path="/manager/orders" element={<Orders />} />
          <Route path="/manager/payments" element={<Payments />} />
          <Route path="/manager/support" element={<Support />} />
          <Route path="/manager/chat" element={<ManagerChat />} />
          {/* Seller (React) */}
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/dashboard.html" element={<SellerDashboard />} />
          <Route
            path="/seller/profileSettings"
            element={<SellerProfileSettings />}
          />
          <Route
            path="/seller/profileSettings.html"
            element={<SellerProfileSettings />}
          />
          <Route
            path="/seller/productmanagement"
            element={<SellerProductManagement />}
          />
          <Route
            path="/seller/bulk-upload"
            element={<BulkUpload />}
          />
          <Route
            path="/seller/bulk-upload-result"
            element={<BulkUploadResult />}
          />
          <Route
            path="/seller/productManagement.html"
            element={<SellerProductManagement />}
          />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/orders.html" element={<SellerOrders />} />
          <Route
            path="*"
            element={
              <div style={{ padding: 24 }}>
                <h2>Page not found</h2>
                <p>
                  Quick links: <Link to="/all">Home</Link>,{" "}
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
