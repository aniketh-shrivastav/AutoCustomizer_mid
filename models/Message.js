const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: { type: String, enum: ["customer", "manager"], required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    attachment: {
      url: String, // public URL to file
      type: String, // mime type
      name: String, // original filename
      size: Number, // bytes
      provider: {
        type: String,
        enum: ["local", "cloudinary"],
        default: "local",
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ customerId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
