const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },  // Snapshot at time of order
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } // populated at order time
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Same as Cart userId
  items: { type: [OrderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: String, required: true }, // Get from CustomerProfile or User
  district: { type: String, required: true },
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  previousStatus: { type: String },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "paid"
  },
  placedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", OrderSchema);