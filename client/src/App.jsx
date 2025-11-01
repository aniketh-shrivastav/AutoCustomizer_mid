import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerUsers from "./pages/manager/Users";
import Profiles from "./pages/manager/Profiles";
import Orders from "./pages/manager/Orders";
import Payments from "./pages/manager/Payments";
import Support from "./pages/manager/Support";
import AllIndex from "./pages/all/Index";
import FAQ from "./pages/all/FAQ";
import ContactUs from "./pages/all/ContactUs";
import CustomerIndex from "./pages/customer/Index";
import CustomerBooking from "./pages/customer/Booking";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AllIndex />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* Public site (All) */}
      <Route path="/all" element={<AllIndex />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contactus" element={<ContactUs />} />
      {/* Customer */}
      <Route path="/customer/index" element={<CustomerIndex />} />
      <Route path="/customer/booking" element={<CustomerBooking />} />
      {/* Manager (React) */}
      <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      <Route path="/manager/users" element={<ManagerUsers />} />
      <Route path="/manager/profiles" element={<Profiles />} />
      <Route path="/manager/orders" element={<Orders />} />
      <Route path="/manager/payments" element={<Payments />} />
      <Route path="/manager/support" element={<Support />} />
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
  );
}
