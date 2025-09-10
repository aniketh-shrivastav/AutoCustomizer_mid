// routes/sellerRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const os = require("os");
const AdmZip = require("adm-zip");
const csvParser = require("csv-parser");
const xlsx = require("xlsx");

const User = require("../models/User");
const SellerProfile = require("../models/sellerProfile");
const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig"); // plain cloudinary
const Product = require("../models/Product");
const Order = require("../models/Orders");
const Cart = require("../models/Cart");

// Ensure tmp upload dir exists
const UPLOAD_DIR = path.join(__dirname, "..", "tmp", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Use diskStorage so req.file.path exists (we'll upload that to Cloudinary)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${cleanName}`);
  },
});
const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// --- Middleware to ensure seller access only ---
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

const isSeller = (req, res, next) => {
  if (req.session.user?.role === "seller") return next();
  res.status(403).send("Access Denied: Sellers Only");
};

// --- Dashboard JSON API (for static HTML hydration) ---
router.get("/api/dashboard", isAuthenticated, isSeller, async (req, res) => {
  try {
    // Placeholder static data (can be replaced with real DB queries)
    const dashboardData = {
      totalSales: 150,
      totalEarnings: 12000,
      totalOrders: 80,
      stockAlerts: [
        { product: "Car Spoiler", stock: 2 },
        { product: "LED Headlights", stock: 1 },
      ],
      recentOrders: [
        { orderId: "ORD001", customer: "Alice", status: "Shipped" },
        { orderId: "ORD002", customer: "Bob", status: "Processing" },
        { orderId: "ORD003", customer: "Charlie", status: "Delivered" },
      ],
    };

    // Derive status distribution counts
    const statusDistribution = dashboardData.recentOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, ...dashboardData, statusDistribution });
  } catch (err) {
    console.error("Seller dashboard API error", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load dashboard" });
  }
});

// --- Dashboard static file route (replaces EJS) ---
router.get("/dashboard", isAuthenticated, isSeller, (req, res) => {
  const filePath = path.join(__dirname, "../public/seller/dashboard.html");
  return res.sendFile(filePath);
});

// --- Profile Settings (unchanged) ---
router.get("/profileSettings", isAuthenticated, isSeller, async (req, res) => {
  const filePath = path.join(
    __dirname,
    "../public/seller/profileSettings.html"
  );
  return res.sendFile(filePath);
});

router.post("/profileSettings", isAuthenticated, isSeller, async (req, res) => {
  try {
    const { storeName, contactEmail, phone, ownerName, address } = req.body;

    await User.findByIdAndUpdate(req.session.user.id, {
      name: storeName,
      email: contactEmail,
      phone: phone,
    });

    await SellerProfile.findOneAndUpdate(
      { sellerId: req.session.user.id },
      {
        ownerName,
        address,
        sellerId: req.session.user.id,
      },
      { new: true, upsert: true }
    );

    console.log("Updated Profile Data:", {
      storeName,
      contactEmail,
      phone,
      ownerName,
      address,
    });
    res.redirect("/seller/profileSettings");
  } catch (error) {
    console.error("Error updating seller profile:", error);
    res.status(500).send("Error updating profile settings.");
  }
});

// JSON API: Get seller profile settings
router.get(
  "/api/profileSettings",
  isAuthenticated,
  isSeller,
  async (req, res) => {
    try {
      const sellerProfile = await SellerProfile.findOne({
        sellerId: req.session.user.id,
      }).populate("sellerId", "name email phone");

      if (!sellerProfile) {
        return res.json({
          success: true,
          profile: {
            storeName: req.session.user.name,
            ownerName: "",
            contactEmail: req.session.user.email,
            phone: req.session.user.phone || "",
            address: "",
          },
        });
      }
      res.json({
        success: true,
        profile: {
          storeName: sellerProfile.sellerId.name,
          ownerName: sellerProfile.ownerName || "",
          contactEmail: sellerProfile.sellerId.email,
          phone: sellerProfile.sellerId.phone || "",
          address: sellerProfile.address || "",
        },
      });
    } catch (err) {
      console.error("Profile settings GET API error", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// JSON API: Update seller profile settings
router.post(
  "/api/profileSettings",
  isAuthenticated,
  isSeller,
  async (req, res) => {
    try {
      const { storeName, contactEmail, phone, ownerName, address } = req.body;

      if (!storeName?.trim() || !ownerName?.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Store and Owner name required" });
      }
      const phoneRegex = /^\d{10}$/;
      if (phone && !phoneRegex.test(phone)) {
        return res
          .status(400)
          .json({ success: false, message: "Phone must be 10 digits" });
      }

      await User.findByIdAndUpdate(req.session.user.id, {
        name: storeName,
        email: contactEmail,
        phone: phone,
      });

      await SellerProfile.findOneAndUpdate(
        { sellerId: req.session.user.id },
        { ownerName, address, sellerId: req.session.user.id },
        { new: true, upsert: true }
      );

      res.json({ success: true, message: "Profile updated" });
    } catch (err) {
      console.error("Profile settings POST API error", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// --- Orders (unchanged) ---
const ordersFilePath = path.join(__dirname, "../data", "orders.json");
const getOrders = () => JSON.parse(fs.readFileSync(ordersFilePath, "utf8"));
const saveOrders = (orders) =>
  fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), "utf8");

router.get("/orders", isAuthenticated, isSeller, async (req, res) => {
  const filePath = path.join(__dirname, "../public/seller/orders.html");
  return res.sendFile(filePath);
});

// JSON API for seller orders (static HTML hydration)
router.get("/api/orders", isAuthenticated, isSeller, async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const orders = await Order.find({ "items.seller": sellerId })
      .populate("userId", "name email")
      .sort({ placedAt: -1 })
      .lean();
    const shaped = [];
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (String(item.seller) === String(sellerId)) {
          shaped.push({
            orderId: order._id,
            customerName: order.userId?.name || "Unknown",
            customerEmail: order.userId?.email || "",
            productName: item.name,
            quantity: item.quantity,
            deliveryAddress: order.deliveryAddress,
            district: order.district,
            status: order.orderStatus,
            placedAt: order.placedAt,
          });
        }
      });
    });
    res.json({ success: true, orders: shaped });
  } catch (err) {
    console.error("Seller orders API error", err);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
});

// --- Earnings & Payouts (unchanged) ---
const payoutData = {
  totalEarnings: 15000,
  pendingPayouts: 2000,
  availableBalance: 5000,
  transactions: [
    { date: "2024-03-01", amount: 500, status: "Completed" },
    { date: "2024-03-10", amount: 1000, status: "Pending" },
    { date: "2024-03-15", amount: 700, status: "Completed" },
  ],
};

router.get("/earnings-payouts", isAuthenticated, isSeller, (req, res) => {
  res.render("Seller/earningsPayouts", { payoutData });
});

router.post("/request-payout", isAuthenticated, isSeller, (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid payout amount");
  }
  res.redirect("/seller/earnings-payouts");
});

// --- Reviews (unchanged) ---
const reviews = JSON.parse(fs.readFileSync("./data/reviews.json", "utf8"));
const products = JSON.parse(fs.readFileSync("./data/products.json", "utf8"));

router.get("/reviews", isAuthenticated, isSeller, (req, res) => {
  res.render("Seller/reviewsRatings", {
    products,
    filteredReviews: [],
    averageRating: 0,
  });
});

router.get("/reviews/filter", isAuthenticated, isSeller, (req, res) => {
  const { product, rating } = req.query;
  let filteredReviews = reviews;

  if (product) {
    filteredReviews = filteredReviews.filter(
      (review) => review.product === product
    );
  }

  if (rating && rating !== "all") {
    filteredReviews = filteredReviews.filter(
      (review) => String(review.rating) === rating
    );
  }

  const averageRating = calculateAverageRating(filteredReviews);

  res.render("Seller/reviewsRatings", {
    reviews,
    products,
    filteredReviews,
    averageRating,
  });
});

function calculateAverageRating(reviews) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

// --- Product Management (SINGLE product upload adjusted to manual Cloudinary upload) ---
router.post(
  "/add-product",
  isAuthenticated,
  isSeller,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        price,
        description,
        category,
        brand,
        quantity,
        sku,
        compatibility,
      } = req.body;

      if (!req.file) {
        return res.status(400).send("Product image required.");
      }

      // Upload local file to Cloudinary
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "autocustomizer/products",
        fetch_format: "auto",
        quality: "auto",
      });

      // remove local file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        /* ignore */
      }

      const newProduct = new Product({
        name,
        price,
        description,
        category,
        brand,
        quantity,
        sku,
        compatibility,
        image: uploadRes.secure_url,
        imagePublicId: uploadRes.public_id,
        seller: req.session.user.id,
      });

      await newProduct.save();
      res.redirect("/Seller/productmanagement");
    } catch (error) {
      console.error("Error adding product:", error.message);
      console.error("Full Error Object:", JSON.stringify(error, null, 2));

      if (error.name === "ValidationError") {
        for (let field in error.errors) {
          console.error(
            `Validation error on field "${field}": ${error.errors[field].message}`
          );
        }
        return res
          .status(400)
          .send(
            Object.fromEntries(
              Object.entries(error.errors).map(([field, errObj]) => [
                field,
                errObj.message,
              ])
            )
          );
      }

      res.status(500).send("Internal Server Error");
    }
  }
);

// --- Show only products added by seller (unchanged) ---
// Serve static HTML page for product management
router.get(
  "/productmanagement",
  isAuthenticated,
  isSeller,
  async (req, res) => {
    const filePath = path.join(
      __dirname,
      "../public/seller/productManagement.html"
    );
    return res.sendFile(filePath);
  }
);

// JSON API to get seller products (for static HTML hydration)
router.get("/api/products", isAuthenticated, isSeller, async (req, res) => {
  try {
    const sellerId = req.session.user.id;
    const products = await Product.find({ seller: sellerId }).lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error("Error fetching products for seller:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load products" });
  }
});

// --- Delete product: remove cloudinary image as well if public id present ---
router.post(
  "/delete-product/:id",
  isAuthenticated,
  isSeller,
  async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId);

      if (product?.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(product.imagePublicId);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err.message);
        }
      }

      await Product.findByIdAndDelete(productId);
      await Cart.updateMany(
        { "items.productId": productId },
        { $pull: { items: { productId: productId } } }
      );

      res.redirect("/Seller/productmanagement");
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).send("Failed to delete product");
    }
  }
);

// --- Orders status update (unchanged) ---
router.post(
  "/orders/:orderId/status",
  isAuthenticated,
  isSeller,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { newStatus } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      if (
        order.orderStatus === "delivered" ||
        order.orderStatus === "cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status after it's marked as ${order.orderStatus}`,
        });
      }

      order.previousStatus = order.orderStatus;
      order.orderStatus = newStatus;
      await order.save();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/* ------------------------------
   BULK UPLOAD ROUTES (CSV / XLSX / ZIP)
   - GET /bulk-upload      -> shows upload form
   - GET /bulk-upload/sample-csv -> download sample csv
   - POST /bulk-upload     -> process upload (CSV/XLSX/ZIP)
   ------------------------------ */

// helper to parse CSV file path into rows
function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(
        csvParser({ mapHeaders: ({ header }) => header.trim().toLowerCase() })
      )
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

// GET page
router.get("/bulk-upload", isAuthenticated, isSeller, (req, res) => {
  const filePath = path.join(__dirname, "../public/seller/bulkUpload.html");
  return res.sendFile(filePath);
});

// Download sample CSV
router.get("/bulk-upload/sample-csv", isAuthenticated, isSeller, (req, res) => {
  const sample = `name,price,description,category,brand,quantity,sku,compatibility,image
Alloy Rims,12000,16-inch alloy rims,WHEELS,OZ,20,RIM123,Henry|Civic,rim1.jpg
Car Spoiler,8000,Rear spoiler,BodyKit,Mugen,15,SPOILR,Accord,spoiler.jpg
`;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=product_upload_sample.csv"
  );
  res.send(sample);
});

// POST process
router.post(
  "/bulk-upload",
  isAuthenticated,
  isSeller,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    const resultSummary = {
      total: 0,
      inserted: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    try {
      let rows = [];

      if (ext === ".zip") {
        // unzip into a temp folder
        const extractPath = path.join(UPLOAD_DIR, `ex-${Date.now()}`);
        fs.mkdirSync(extractPath, { recursive: true });

        const zip = new AdmZip(filePath);
        zip.extractAllTo(extractPath, true);

        // find CSV or XLSX inside extracted
        const files = fs.readdirSync(extractPath);
        const csvFile = files.find((f) => f.toLowerCase().endsWith(".csv"));
        const xlsxFile = files.find(
          (f) =>
            f.toLowerCase().endsWith(".xlsx") ||
            f.toLowerCase().endsWith(".xls")
        );

        if (csvFile) {
          rows = await parseCsvFile(path.join(extractPath, csvFile));
        } else if (xlsxFile) {
          const workbook = xlsx.readFile(path.join(extractPath, xlsxFile));
          const sheetName = workbook.SheetNames[0];
          rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
          throw new Error("No CSV or XLSX file found inside ZIP.");
        }

        // We'll assume any image filenames in CSV live under extracted folder (e.g., ./images/...)
        // process rows below, looking up images relative to extractPath
        for (let i = 0; i < rows.length; i++) {
          resultSummary.total++;
          const row = rows[i];
          try {
            // Normalize headers: name, price, description, category, brand, quantity, sku, compatibility, image
            const name = (row.name || "").trim();
            const price = Number(row.price);
            const description = (row.description || "").trim();
            const category = (row.category || "").trim().toUpperCase();
            const brand = (row.brand || "").trim();
            const quantity = Number(row.quantity);
            const sku = (row.sku || "").trim().toUpperCase();
            const compatibility = (row.compatibility || "").trim();
            const imageField = (row.image || "").trim(); // either filename or remote url

            // basic validation
            const missing = [];
            if (!name) missing.push("name");
            if (!price && price !== 0) missing.push("price");
            if (!description) missing.push("description");
            if (!category) missing.push("category");
            if (!brand) missing.push("brand");
            if (!Number.isInteger(quantity)) missing.push("quantity");
            if (!sku || sku.length !== 6) missing.push("sku");
            if (!imageField) missing.push("image");

            if (missing.length) {
              resultSummary.failed++;
              resultSummary.errors.push({
                row: i + 1,
                reason: `Missing/invalid fields: ${missing.join(", ")}`,
              });
              continue;
            }

            // prevent duplicate by seller+sku
            const existing = await Product.findOne({
              seller: req.session.user.id,
              sku,
            });
            if (existing) {
              resultSummary.skipped++;
              resultSummary.errors.push({
                row: i + 1,
                reason: `SKU ${sku} already exists`,
              });
              continue;
            }

            // find image: if it's URL (starts with http), upload directly; else find local file in extractPath
            let uploaded;
            if (/^https?:\/\//i.test(imageField)) {
              uploaded = await cloudinary.uploader.upload(imageField, {
                folder: "autocustomizer/products",
                fetch_format: "auto",
                quality: "auto",
              });
            } else {
              // search inside extractPath and extractPath/images
              const candidatePaths = [
                path.join(extractPath, imageField),
                path.join(extractPath, "images", imageField),
                path.join(extractPath, "Images", imageField),
              ];
              const found = candidatePaths.find((p) => fs.existsSync(p));
              if (!found) {
                resultSummary.failed++;
                resultSummary.errors.push({
                  row: i + 1,
                  reason: `Image file not found: ${imageField}`,
                });
                continue;
              }
              uploaded = await cloudinary.uploader.upload(found, {
                folder: "autocustomizer/products",
                fetch_format: "auto",
                quality: "auto",
              });
            }

            // create product
            const newProd = new Product({
              name,
              price,
              description,
              category,
              brand,
              quantity,
              sku,
              compatibility,
              image: uploaded.secure_url,
              imagePublicId: uploaded.public_id,
              seller: req.session.user.id,
            });
            await newProd.save();
            resultSummary.inserted++;
          } catch (errRow) {
            resultSummary.failed++;
            resultSummary.errors.push({ row: i + 1, reason: errRow.message });
          }
        }

        // cleanup extracted files
        try {
          fs.rmSync(extractPath, { recursive: true, force: true });
        } catch (e) {}
      } else if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") {
        // CSV or Excel uploaded directly (not zipped). For CSV, images must be remote URLs (image column).
        if (ext === ".csv") {
          rows = await parseCsvFile(filePath);
        } else {
          const workbook = xlsx.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        for (let i = 0; i < rows.length; i++) {
          resultSummary.total++;
          const row = rows[i];
          try {
            const name = (row.name || "").trim();
            const price = Number(row.price);
            const description = (row.description || "").trim();
            const category = (row.category || "").trim().toUpperCase();
            const brand = (row.brand || "").trim();
            const quantity = Number(row.quantity);
            const sku = (row.sku || "").trim().toUpperCase();
            const compatibility = (row.compatibility || "").trim();
            const imageField = (row.image || row.image_url || "").trim();

            const missing = [];
            if (!name) missing.push("name");
            if (!price && price !== 0) missing.push("price");
            if (!description) missing.push("description");
            if (!category) missing.push("category");
            if (!brand) missing.push("brand");
            if (!Number.isInteger(quantity)) missing.push("quantity");
            if (!sku || sku.length !== 6) missing.push("sku");
            if (!imageField) missing.push("image_url");

            if (missing.length) {
              resultSummary.failed++;
              resultSummary.errors.push({
                row: i + 1,
                reason: `Missing/invalid: ${missing.join(", ")}`,
              });
              continue;
            }

            const existing = await Product.findOne({
              seller: req.session.user.id,
              sku,
            });
            if (existing) {
              resultSummary.skipped++;
              resultSummary.errors.push({
                row: i + 1,
                reason: `SKU ${sku} already exists`,
              });
              continue;
            }

            // imageField must be an HTTP URL in this path
            if (!/^https?:\/\//i.test(imageField)) {
              resultSummary.failed++;
              resultSummary.errors.push({
                row: i + 1,
                reason: `image must be a public URL for standalone CSV/XLSX (or use ZIP with images)`,
              });
              continue;
            }

            const uploaded = await cloudinary.uploader.upload(imageField, {
              folder: "autocustomizer/products",
              fetch_format: "auto",
              quality: "auto",
            });

            const newProd = new Product({
              name,
              price,
              description,
              category,
              brand,
              quantity,
              sku,
              compatibility,
              image: uploaded.secure_url,
              imagePublicId: uploaded.public_id,
              seller: req.session.user.id,
            });
            await newProd.save();
            resultSummary.inserted++;
          } catch (errRow) {
            resultSummary.failed++;
            resultSummary.errors.push({ row: i + 1, reason: errRow.message });
          }
        }
      } else {
        throw new Error(
          "Unsupported file type. Upload .zip (csv + images) or .csv or .xlsx"
        );
      }

      // cleanup uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        /* ignore */
      }

      // store result in session and redirect to static result page
      req.session.bulkUploadResult = resultSummary;
      return res.redirect("/seller/bulk-upload/result");
    } catch (err) {
      console.error("Bulk upload error:", err);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
      res.status(500).send("Bulk upload failed: " + err.message);
    }
  }
);

// Static result page and JSON API to retrieve last summary
router.get("/bulk-upload/result", isAuthenticated, isSeller, (req, res) => {
  const filePath = path.join(
    __dirname,
    "../public/seller/bulkUploadResult.html"
  );
  return res.sendFile(filePath);
});

router.get("/api/bulk-upload-result", isAuthenticated, isSeller, (req, res) => {
  const results = req.session.bulkUploadResult;
  if (!results) return res.json({ success: false, message: "No results" });
  return res.json({ success: true, results });
});

module.exports = router;
