// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const ServiceBooking = require("../models/serviceBooking");
const User = require("../models/User");

router.post("/create-booking", async (req, res) => {
  try {
    const {
      providerId,
      selectedServices,
      date,
      phone,
      name,
      carModel,
      address,
      description,
      district
    } = req.body;

    const customerId = req.session.user.id;

    // Fetch provider to access service cost
    const provider = await User.findById(providerId);
    if (!provider || !provider.servicesOffered) {
      return res.status(400).json({ error: "Invalid service provider" });
    }

    // Calculate totalCost from selected services
    let totalCost = 0;
    selectedServices.forEach(serviceName => {
      const matchedService = provider.servicesOffered.find(s => s.name === serviceName);
      if (matchedService) {
        totalCost += matchedService.cost;
      }
    });

    const booking = new ServiceBooking({
      customerId,
      providerId,
      selectedServices,
      date,
      phone,
      name,
      carModel,
      address,
      description,
      district,
      totalCost // ✅ Save the calculated cost
    });

    await booking.save();
    res.status(200).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error("Booking creation failed:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

module.exports = router;
