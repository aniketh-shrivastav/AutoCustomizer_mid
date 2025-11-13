const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");

// Auth helpers similar to other routes
const isAuthenticated = (req, res, next) => {
  if (req.session?.user) return next();
  return res.status(401).json({ success: false, message: "Unauthorized" });
};

const isManager = (req, res, next) => {
  if (req.session?.user?.role === "manager") return next();
  return res.status(403).json({ success: false, message: "Managers only" });
};

// A customer can only see their own thread; a manager can see any
function canAccessCustomer(req, res, next) {
  const cid = String(req.params.customerId);
  const user = req.session.user;
  if (user.role === "manager") return next();
  if (user.role === "customer" && String(user.id) === cid) return next();
  return res.status(403).json({ success: false, message: "Forbidden" });
}

// List customers with latest message preview (manager only)
router.get("/chat/customers", isAuthenticated, isManager, async (req, res) => {
  try {
    const latest = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$customerId",
          lastMessage: { $first: "$text" },
          lastAt: { $first: "$createdAt" },
        },
      },
      { $sort: { lastAt: -1 } },
      { $limit: 100 },
    ]);

    const ids = latest.map((x) => x._id);
    const users = await User.find({ _id: { $in: ids } }, "name email").lean();
    const byId = Object.fromEntries(users.map((u) => [String(u._id), u]));
    const results = latest.map((x) => ({
      customerId: x._id,
      customer: byId[String(x._id)] || { name: "Unknown" },
      lastMessage: x.lastMessage,
      lastAt: x.lastAt,
    }));
    res.json({ success: true, customers: results });
  } catch (e) {
    console.error("chat/customers", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get messages for a customer thread
router.get(
  "/chat/customer/:customerId/messages",
  isAuthenticated,
  canAccessCustomer,
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const { limit = 100 } = req.query;
      const messages = await Message.find({ customerId })
        .sort({ createdAt: 1 })
        .limit(Math.min(Number(limit) || 100, 200))
        .lean();
      res.json({ success: true, messages });
    } catch (e) {
      console.error("chat messages", e);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Post a message to a customer thread
router.post(
  "/chat/customer/:customerId/messages",
  isAuthenticated,
  canAccessCustomer,
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const { text } = req.body || {};
      const trimmed = String(text || "").trim();
      if (!trimmed) {
        return res
          .status(400)
          .json({ success: false, message: "Message cannot be empty" });
      }
      const msg = await Message.create({
        customerId,
        senderId: req.session.user.id,
        senderRole:
          req.session.user.role === "manager" ? "manager" : "customer",
        text: trimmed,
      });

      // Socket broadcast (if io is set on app)
      try {
        const io = req.app.get("io");
        if (io)
          io.to(`customer_${customerId}`).emit("chat:new", msg.toObject());
      } catch {}

      res.json({ success: true, message: msg });
    } catch (e) {
      console.error("chat post", e);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;
