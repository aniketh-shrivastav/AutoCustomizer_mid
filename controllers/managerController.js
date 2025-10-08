const ServiceBooking = require("../models/serviceBooking");
const User = require("../models/User");
const CustomerProfile = require('../models/CustomerProfile');
const SellerProfile = require('../models/sellerProfile');
const Order = require("../models/Orders");

exports.getProfileData = async (req, res) => {
  try {
    const id = req.params.id;
    let user = null;
    let role = null;
    let details = '';
    let profilePicture = '';
    let name = '', email = '', phone = '';

    // Check CustomerProfile
    let customer = await CustomerProfile.findById(id).populate('userId');
    if (customer) {
      user = customer.userId;
      role = 'Customer';
      profilePicture = customer.profilePicture || user.profilePicture || 'https://via.placeholder.com/80';
      name = user.name;
      email = user.email;
      phone = user.phone;

      details = `
        <p><strong>Address:</strong> ${customer.address || 'N/A'}</p>
        <p><strong>District:</strong> ${customer.district || 'N/A'}</p>
        <p><strong>Car Model:</strong> ${customer.carModel || 'N/A'}</p>
      `;
    }

    // Check SellerProfile
    if (!user) {
      let seller = await SellerProfile.findById(id).populate('sellerId');
      if (seller) {
        user = seller.sellerId;
        role = 'Seller';
        profilePicture = user.profilePicture || 'https://via.placeholder.com/80';
        name = user.name;
        email = user.email;
        phone = user.phone;

        details = `
          <p><strong>Owner:</strong> ${seller.ownerName || 'N/A'}</p>
          <p><strong>Store Address:</strong> ${seller.address || 'N/A'}</p>
        `;
      }
    }

    // Check if it's a service provider directly in User
    if (!user) {
      let serviceProvider = await User.findById(id);
      if (serviceProvider && serviceProvider.role === 'service-provider') {
        user = serviceProvider;
        role = 'Service Provider';
        profilePicture = user.profilePicture || 'https://via.placeholder.com/80';
        name = user.workshopName || user.name;
        email = user.email;
        phone = user.phone;

        const services = user.servicesOffered?.map(s => `<li>${s.name} - ₹${s.cost}</li>`).join('') || '';
        details = `
          <p><strong>District:</strong> ${user.district || 'N/A'}</p>
          <h4>Services:</h4><ul>${services}</ul>
        `;
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      profilePicture,
      name,
      email,
      phone,
      role,
      extraDetails: details
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getPayments = async (req, res) => {
  try {
    // Load only 'Ready' service bookings, excluding suspended users
    const serviceOrders = (await ServiceBooking.find({ status: "Ready" })
      .populate("customerId", "name suspended")
      .populate("providerId", "name suspended")
    ).filter(order =>
      order.customerId && !order.customerId.suspended &&
      order.providerId && !order.providerId.suspended
    );

    // Load product orders
    const orders = (await Order.find()
      .populate("userId", "name suspended") // Customer
      .populate("items.seller", "name suspended") // Sellers
      .sort({ placedAt: -1 })
    ).filter(order =>
      order.userId && !order.userId.suspended &&
      order.items.every(item => item.seller && !item.seller.suspended)
    );

    res.render("manager/payments", {
      serviceOrders,
      orders
    });

  } catch (err) {
    console.error("Error fetching payments data:", err);
    res.status(500).send("Internal Server Error");
  }
};