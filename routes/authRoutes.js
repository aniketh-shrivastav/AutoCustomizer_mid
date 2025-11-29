const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db"); // instead of creating a new sqlite3.Database
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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

  // Helper to detect if client expects JSON (Fetch path)
  const wantsJson =
    (req.headers.accept || "").includes("application/json") ||
    (req.headers["content-type"] || "").includes("application/json");

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
  } else if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
    error = "Phone number must be 10 digits.";
  }

  if (error) {
    if (wantsJson) {
      return res.status(400).json({ success: false, message: error });
    } else {
      return res.render("signup", { error });
    }
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const errMsg = "Email already exists";
      if (wantsJson) {
        return res.status(400).json({ success: false, message: errMsg });
      } else {
        return res.render("signup", { error: errMsg });
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

    if (wantsJson) {
      return res.json({
        success: true,
        message: "Signup successful. Redirecting to login...",
        redirect: "/login",
      });
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("MongoDB error:", error.message);
    if (wantsJson) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
    return res.render("signup", { error: "Server error" });
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
  const wantsJson =
    (req.headers.accept || "").includes("application/json") ||
    (req.headers["content-type"] || "").includes("application/json");

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
        // Point managers to the React route instead of the legacy static HTML
        if (wantsJson) {
          return res.json({
            success: true,
            role: "manager",
            redirect: "/manager/dashboard",
          });
        }
        return res.redirect("/manager/dashboard");
      case "customer":
        // Send customers to the React customer index route
        if (wantsJson) {
          return res.json({
            success: true,
            role: "customer",
            redirect: "/customer/index",
          });
        }
        return res.redirect("/customer/index");
      case "seller":
        if (wantsJson) {
          return res.json({
            success: true,
            role: "seller",
            redirect: "/Seller/dashboard",
          });
        }
        return res.redirect("/Seller/dashboard");
      case "service-provider":
        if (wantsJson) {
          return res.json({
            success: true,
            role: "service-provider",
            redirect: "/service/dashboardService",
          });
        }
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
  const next = req.query.next;
  req.session.destroy(() => {
    // Clear session cookie explicitly
    try {
      res.clearCookie("connect.sid");
    } catch {}
    if (next && /^https?:\/\//.test(next)) {
      return res.redirect(next);
    }
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

// ─────────────────────────────────────────────
// POST Forgot Password - request reset link
// ─────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: "Email required" });
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal existence
      return res.json({
        success: true,
        message: "If that email exists, a reset link was sent.",
      });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${rawToken}`;

    // Attempt email send if SMTP env configured, otherwise log.
    let emailSent = false;
    let previewUrl = null;
    try {
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: "Password Reset",
          text: `Reset your password: ${resetLink}`,
          html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset</a></p>`,
        });
        emailSent = true;
      }
    } catch (e) {
      console.error("Email send failed", e.message);
    }
    // Development fallback using Ethereal test account
    if (!emailSent && process.env.NODE_ENV !== "production") {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await transporter.sendMail({
          from: "AutoCustomizer <no-reply@autocustomizer.test>",
          to: email,
          subject: "Password Reset (Test)",
          text: `Reset your password: ${resetLink}`,
          html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset</a></p>`,
        });
        previewUrl = nodemailer.getTestMessageUrl(info);
        emailSent = true;
      } catch (e) {
        console.log("Ethereal email send failed, logging link only.");
      }
    }
    if (!emailSent) {
      console.log("Password reset link (no SMTP configured):", resetLink);
    }
    return res.json({
      success: true,
      message: "If that email exists, a reset link was sent.",
      previewUrl,
    });
  } catch (err) {
    console.error("Forgot password error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET Validate Reset Token
// ─────────────────────────────────────────────
router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ valid: false });
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(404).json({ valid: false });
    return res.json({ valid: true });
  } catch (e) {
    return res.status(500).json({ valid: false });
  }
});

// ─────────────────────────────────────────────
// POST Reset Password
// ─────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password)
    return res
      .status(400)
      .json({ success: false, message: "Password required" });
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    const bcrypt = require("bcryptjs");
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({
      success: true,
      message: "Password updated. Please login.",
    });
  } catch (e) {
    console.error("Reset password error", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
