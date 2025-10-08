const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db"); // instead of creating a new sqlite3.Database
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ─────────────────────────────────────────────
// GET Signup
// ─────────────────────────────────────────────
router.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// ─────────────────────────────────────────────
// POST Signup
// ─────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  const { name, email, password, role, businessName, workshopName, phone } =
    req.body;
  const finalName = name || businessName || workshopName;

  if (!phone || !/^\d{10}$/.test(phone.trim())) {
    error = "Phone number must be 10 digits.";
  }

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z\s.-]+$/;

  let error = null;
  if (!finalName || !email || !password || !role) {
    error = "All fields are required";
  } else if (!emailRegex.test(email) || !email.endsWith(".com")) {
    error = "Please enter a valid email ending in .com";
  } else if (!nameRegex.test(finalName)) {
    error = "Name should not contain numbers or special characters";
  }

  if (error) {
    if (req.headers.accept.includes("application/json")) {
      return res.status(400).json({ success: false, message: error });
    } else {
      return res.render("signup", { error });
    }
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      error = "Email already exists";
      if (req.headers.accept.includes("application/json")) {
        return res.status(400).json({ success: false, message: error });
      } else {
        return res.render("signup", { error });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in MongoDB
    const newUser = new User({
      name: finalName,
      email,
      phone, // <-- Added phone here
      password: hashedPassword,
      role,
    });

    await newUser.save();
    console.log("MongoDB user inserted:", newUser);

    if (req.headers.accept.includes("application/json")) {
      return res.json({
        success: true,
        message: "Signup successful. Redirecting to login...",
      });
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("MongoDB error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET Login
// ─────────────────────────────────────────────
router.get("/login", (req, res) => {
  res.render("login");
});

// ─────────────────────────────────────────────
// POST Login
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the user is suspended
    if (user.suspended) {
      return res.status(403).json({
        message: "Your account is suspended. Contact support for assistance.",
      });
    }

    // Compare entered password with hashed password in MongoDB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store user session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    // Role-based redirection
    switch (user.role) {
      case "manager":
        return res.redirect("/manager/dashboard.html");
      case "customer":
        return res.redirect("/customer/index.html");
      case "seller":
        return res.redirect("/Seller/dashboard");
      case "service-provider":
        return res.redirect("/service/dashboardService");
      default:
        return res.status(403).send("Unknown role");
    }
  } catch (error) {
    console.error("MongoDB error:", error.message);
    res.status(500).send("Internal server error");
  }
});

// ─────────────────────────────────────────────
// Static Page Routes
// ─────────────────────────────────────────────
router.get("/", (req, res) => {
  const staticPath = path.join(__dirname, "../public/all/index.html");
  return res.sendFile(staticPath);
});

router.get("/contactus", (req, res) => {
  const staticPath = path.join(__dirname, "../public/all/contactus.html");
  return res.sendFile(staticPath);
});

router.get("/feedback", (req, res) => {
  const staticPath = path.join(__dirname, "../public/all/feedback.html");
  return res.sendFile(staticPath);
});

router.get("/faq", (req, res) => {
  const staticPath = path.join(__dirname, "../public/all/faq.html");
  return res.sendFile(staticPath);
});

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// API endpoint to expose authentication status
router.get("/api/session", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  res.json({ authenticated: false });
});

module.exports = router;
