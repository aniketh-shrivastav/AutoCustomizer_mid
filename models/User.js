const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true },
  },
  { _id: false }
); // No _id needed for subdocuments

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: {
    type: String,
    enum: ["customer", "seller", "service-provider", "manager"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  suspended: { type: Boolean, default: false },
  businessName: String,
  workshopName: String,
  profilePicture: String,
  address: String,
  district: String,
  servicesOffered: [ServiceSchema], // array of { name, cost }
  // Password reset flow
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
