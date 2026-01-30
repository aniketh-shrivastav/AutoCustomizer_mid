require("dotenv").config(); // Load environment variables first
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const connectDB = require("./db");
const User = require("./models/User");
//Import the User model

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});
app.set("io", io);
connectDB();

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Middleware Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Enable CORS for dev + allow credentials for session-based APIs
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protect manager static HTML pages before exposing public assets
app.use("/manager", (req, res, next) => {
  if (req.path.endsWith(".html")) {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "manager")
      return res.status(403).send("Access Denied");
  }
  next();
});

// Protect customer static HTML pages (converted from EJS) BEFORE static middleware serves them
app.use("/customer", (req, res, next) => {
  if (req.path.endsWith(".html")) {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "customer")
      return res.status(403).send("Access Denied: Customers Only");
  }
  next();
});

// Protect service provider static HTML pages
app.use("/service", (req, res, next) => {
  if (req.path.endsWith(".html")) {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "service-provider")
      return res.status(403).send("Access Denied: Service Providers Only");
  }
  next();
});

// Protect seller static HTML pages (converted from EJS)
app.use(["/seller", "/Seller"], (req, res, next) => {
  if (req.path.endsWith(".html")) {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "seller")
      return res.status(403).send("Access Denied: Sellers Only");
  }
  next();
});

// Expose only the public directory (avoid exposing entire project root for security)
// Removed: app.use(express.static(__dirname));
app.use(express.static("public"));
// Restored to serve legacy asset folders (e.g., /styles) relied on by existing EJS pages like login
app.use(express.static(__dirname));

// Routes
const authRoutes = require("./routes/authRoutes");
const managerRoutes = require("./routes/managerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const serviceProviderRoutes = require("./routes/serviceProviderRoutes");
const { router: contactRoutes } = require("./routes/contactRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const profileSettingsRoutes = require("./routes/profileSettingsRoutes");
const cartRoutes = require("./routes/cartRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

app.use("/", profileSettingsRoutes);
app.use("/", authRoutes);
app.use("/manager", managerRoutes);
app.use("/customer", customerRoutes);
app.use("/service", serviceProviderRoutes);
app.use("/", contactRoutes);
app.use("/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/bookings", bookingRoutes);
app.use("/", chatRoutes);

// 404 + global error handler (must be after routes)
app.use(notFound);
app.use(errorHandler);

// Socket.IO basic rooms per customer
io.on("connection", (socket) => {
  socket.on("chat:join", ({ customerId }) => {
    if (customerId) socket.join(`customer_${customerId}`);
  });

  // Service provider joins earnings room
  socket.on("earnings:join", ({ providerId }) => {
    if (providerId) {
      socket.join(`provider_earnings_${providerId}`);
      console.log(`Provider ${providerId} joined earnings room`);
    }
  });

  socket.on("disconnect", () => {});
});

// Make io accessible globally for routes
global.io = io;

// Start Server
httpServer.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
