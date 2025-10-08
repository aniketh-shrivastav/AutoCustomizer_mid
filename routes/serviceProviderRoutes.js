const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ServiceBooking = require("../models/serviceBooking");
const mongoose = require("mongoose");
const path = require("path");

// Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

const isService = (req, res, next) => {
  if (req.session.user?.role === "service-provider") return next();
  res.status(403).send("Access Denied: Service Providers Only");
};

// Combined middleware
const serviceOnly = [isAuthenticated, isService];

// Routes

// Dashboard
router.get("/dashboardService", serviceOnly, async (req, res) => {
  const filePath = path.join(
    __dirname,
    "../public/service/dashboardService.html"
  );
  return res.sendFile(filePath);
});

// JSON API for dashboard (static HTML hydration)
router.get("/api/dashboard", serviceOnly, async (req, res) => {
  try {
    const providerId = new mongoose.Types.ObjectId(req.session.user.id);

    const bookings = await ServiceBooking.aggregate([
      { $match: { providerId } },
      { $unwind: "$selectedServices" },
      { $group: { _id: "$selectedServices", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const serviceLabels = bookings.map((b) => b._id);
    const serviceCounts = bookings.map((b) => b.count);

    const totalEarningsResult = await ServiceBooking.aggregate([
      { $match: { providerId, totalCost: { $exists: true } } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } },
    ]);
    const grossEarnings = totalEarningsResult[0]?.total || 0;
    const netEarnings = Math.round(grossEarnings * 0.8);

    const ongoingCount = await ServiceBooking.countDocuments({
      providerId,
      status: "Confirmed",
    });
    const completedCount = await ServiceBooking.countDocuments({
      providerId,
      status: "Ready",
    });

    const ratingData = await ServiceBooking.aggregate([
      { $match: { providerId, rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgRating = ratingData[0]?.avgRating?.toFixed(1) || "N/A";
    const totalReviews = ratingData[0]?.count || 0;

    res.json({
      serviceLabels,
      serviceCounts,
      totals: {
        earnings: netEarnings,
        ongoing: ongoingCount,
        completed: completedCount,
        avgRating,
        totalReviews,
      },
    });
  } catch (err) {
    console.error("Dashboard API error", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// Profile Settings
router.get("/profileSettings", serviceOnly, async (req, res) => {
  const filePath = require("path").join(
    __dirname,
    "../public/service/profileSettings.html"
  );
  return res.sendFile(filePath);
});

// Booking Management
// This route handles rendering booking data for the service provider
router.get("/bookingManagement", serviceOnly, async (req, res) => {
  const filePath = require("path").join(
    __dirname,
    "../public/service/bookingManagement.html"
  );
  return res.sendFile(filePath);
});

router.post("/updateBookingStatus", serviceOnly, async (req, res) => {
  const { orderId, newStatus } = req.body;

  try {
    const booking = await ServiceBooking.findById(orderId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    const validTransitions = {
      Open: ["Confirmed", "Rejected"],
      Confirmed: ["Completed", "Rejected"],
      Completed: [], // Can't change from completed
      Rejected: [], // Can't change from rejected
    };
    if (!validTransitions[booking.status].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${booking.status} to ${newStatus}`,
      });
    }
    booking.status = newStatus;
    await booking.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/updateMultipleBookingStatus", serviceOnly, async (req, res) => {
  const { orderIds, newStatus } = req.body;

  try {
    await ServiceBooking.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status: newStatus } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// Earnings
router.get("/earnings", serviceOnly, async (req, res) => {
  try {
    const providerId = req.session.user.id;

    // Get all bookings for this provider with status "Ready"
    const completedBookings = await ServiceBooking.find({
      providerId: providerId,
      status: "Ready",
      totalCost: { $exists: true },
    });

    const totalEarnings = completedBookings.reduce(
      (sum, booking) => sum + booking.totalCost,
      0
    );

    // Assuming all Ready bookings are considered for payout
    const pendingPayouts = totalEarnings; // You can change this if there's a status or flag to indicate if it's paid or not

    // Available balance is 80% after 20% commission deduction
    const availableBalance = Math.round(pendingPayouts * 0.8);

    const transactions = completedBookings.map((booking) => ({
      date: booking.date.toLocaleDateString(),
      amount: Math.round(booking.totalCost * 0.8),
      status: "Ready", // You can expand this logic later
    }));

    const payoutData = {
      totalEarnings,
      pendingPayouts,
      availableBalance,
      transactions,
    };

    res.render("service/earnings", { payoutData });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Customer Communication
router.get("/customerCommunication", serviceOnly, (req, res) => {
  res.render("service/customerCommunication");
});
router.get("/reviews", serviceOnly, async (req, res) => {
  try {
    // Get reviews for the currently logged-in service provider
    const reviews = await ServiceBooking.find({
      providerId: req.session.user.id,
      rating: { $exists: true },
      review: { $exists: true },
    })
      .populate("customerId", "name profileImage") // populate name and optional image
      .sort({ createdAt: -1 }); // optional: show latest first

    res.render("service/reviews", { reviews });
  } catch (error) {
    console.error("Failed to load reviews:", error);
    res.status(500).send("Error loading reviews");
  }
});

// DELETE /service/profile/delete/:id
router.delete("/profile/delete/:id", async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/updateBooking", serviceOnly, async (req, res) => {
  const { orderId, status, totalCost } = req.body;

  try {
    const booking = await ServiceBooking.findById(orderId);
    if (!booking) return res.status(404).send("Booking not found");

    if (status) booking.status = status;
    if (typeof totalCost !== "undefined") booking.totalCost = Number(totalCost);

    await booking.save();
    res.status(200).send("Booking updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating booking");
  }
});

// Add this in your service routes
router.post("/updateCost/:id", serviceOnly, async (req, res) => {
  const { id } = req.params;
  const { totalCost } = req.body;

  try {
    const booking = await ServiceBooking.findById(id);
    if (!booking) return res.status(404).send("Booking not found");

    booking.totalCost = Number(totalCost);
    await booking.save();

    res.redirect("/service/bookingManagement");
  } catch (error) {
    console.error("Cost update failed:", error);
    res.status(500).send("Failed to update cost");
  }
});

// Updated rating submission route
router.post("/submit-rating/:id", async (req, res) => {
  try {
    const { rating, review } = req.body;
    const bookingId = req.params.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "Please provide a valid rating (1-5)" });
    }

    const updatedBooking = await ServiceBooking.findByIdAndUpdate(
      bookingId,
      {
        rating: parseInt(rating),
        review: review || "",
        status: "Completed", // Ensure status is marked as completed
      },
      { new: true }
    ).populate("customerId", "name");

    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update provider's average rating
    await updateProviderRating(updatedBooking.providerId);

    res.json({
      success: true,
      message: "Rating submitted successfully!",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Rating submission error:", error);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

// Helper function to update provider's average rating
async function updateProviderRating(providerId) {
  const stats = await ServiceBooking.aggregate([
    { $match: { providerId: providerId, rating: { $exists: true } } },
    {
      $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } },
    },
  ]);

  await User.findByIdAndUpdate(providerId, {
    averageRating: stats[0]?.avgRating || 0,
    ratingCount: stats[0]?.count || 0,
  });
}

// New API endpoint to get service provider profile data
router.get("/api/profile", serviceOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const {
      _id: id,
      name,
      email,
      phone,
      district = "",
      servicesOffered = [],
    } = user;
    res.json({
      success: true,
      user: { id, name, email, phone: phone || "", district, servicesOffered },
    });
  } catch (err) {
    console.error("Profile API error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Static JSON API for booking management (service provider)
router.get("/api/bookings", serviceOnly, async (req, res) => {
  try {
    const providerId = req.session.user.id;
    let bookings = await ServiceBooking.find({ providerId })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Build map for cost calculation if needed
    const provider = await User.findById(providerId).lean();
    const serviceMap = {};
    (provider.servicesOffered || []).forEach((s) => {
      serviceMap[s.name] = s.cost;
    });

    bookings.forEach((b) => {
      if (!b.totalCost || b.totalCost === 0) {
        let total = 0;
        (b.selectedServices || []).forEach((s) => {
          total += serviceMap[s] || 0;
        });
        b.totalCost = total;
      }
    });

    const shaped = bookings.map((b) => ({
      id: b._id,
      selectedServices: b.selectedServices || [],
      description: b.description || "",
      carModel: b.carModel || "",
      customerName: b.customerId?.name || "Unknown",
      customerEmail: b.customerId?.email || "",
      phone: b.phone || "",
      address: b.address || "",
      district: b.district || "",
      status: b.status,
      createdAt: b.createdAt,
      totalCost: b.totalCost || 0,
    }));

    res.json({ success: true, bookings: shaped });
  } catch (err) {
    console.error("Bookings API error", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load bookings" });
  }
});

module.exports = router;
