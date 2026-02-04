const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Import centralized middleware
const {
  isAuthenticated,
  isServiceProvider,
  serviceOnly,
} = require("../middleware");

router.post("/profile/update", serviceOnly, async (req, res) => {
  try {
    console.log("Request body received:", req.body);

    const {
      name,
      phone,
      district,
      servicesOffered = [],
      paintColors = [],
    } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Ensure servicesOffered is in the format: [{ name: "", cost: 0 }]
    const servicesArray = Array.isArray(servicesOffered)
      ? servicesOffered
          .map((s) => {
            if (typeof s === "object" && s.name && !isNaN(parseFloat(s.cost))) {
              return {
                name: s.name.trim(),
                cost: parseFloat(s.cost),
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    console.log("Processed servicesOffered:", servicesArray);

    // Normalize paint colors to a safe list of unique hex strings
    const hexColorRe = /^#[0-9a-fA-F]{6}$/;
    const incomingColors = Array.isArray(paintColors) ? paintColors : [];
    const normalizedColors = Array.from(
      new Set(
        incomingColors
          .map((c) =>
            String(c || "")
              .trim()
              .toLowerCase(),
          )
          .filter((c) => hexColorRe.test(c)),
      ),
    ).slice(0, 24);

    const hasCarPainting = servicesArray.some((s) => {
      const name = String(s?.name || "").toLowerCase();
      return (
        name.includes("car") &&
        (name.includes("paint") || name.includes("painting"))
      );
    });

    await User.findByIdAndUpdate(userId, {
      name,
      phone,
      district,
      servicesOffered: servicesArray,
      paintColors: hasCarPainting ? normalizedColors : [],
    });

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

module.exports = router;
