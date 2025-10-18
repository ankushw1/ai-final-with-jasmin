
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const resellerRoutes = require("./routes/resellerRoutes");
const accountRoutes = require("./routes/accountRoutes");
const supportRoutes = require("./routes/supportRoutes");
const billingRoutes = require("./routes/billingRoutes");
const managementRoutes = require("./routes/managementRoutes");
const accountManagerRoutes = require("./routes/accountManagerRoutes");
const salesRoutes = require("./routes/salesRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRouter = require('./routes/authRoutes'); 
const activationRoutes = require('./routes/activationRoutes'); 
const httpCarrierRoutes = require('./routes/httpCarrierRoutes'); 
const httpClientRoutes = require("./routes/httpClientRoutes");
const smppCarrierRoutes = require('./routes/smppCarrierRoutes'); 
const smppClientRoutes = require("./routes/smppClientRoutes");
const bulkSmsRoutes = require('./routes/bulkSmsRoutes'); 
const smsReportRoutes = require('./routes/smsReportRoutes')
const otpRoutes = require('./routes/otpRoutes')
const overAllReport = require('./routes/overAllReportRoutes')
const managementReporting = require('./routes/managementReportRoutes')
const prefixRoutes = require('./routes/prefixRoutes')
const groupRoutes = require('./routes/groupRoutes')
const userRoutes = require('./routes/userRoutes')
const smpppRoutes = require('./routes/smppRoutes')
const filterRoutes = require('./routes/filterRoutes')
const routingRoutes = require('./routes/routingRoutes')
const creditRoutes = require("./routes/creditRoutes")
const userHistoryRoutes = require("./routes/userHistoryRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")

const path = require("path");

// Load environment variables
dotenv.config();

// Initialize the Express app
const app = express();
// Trust proxy to detect whether the request is via HTTPS
app.set('trust proxy', true);

// Middleware to redirect HTTP requests to HTTPS
// app.use((req, res, next) => {
//   if (req.protocol === 'http') {
//     return res.redirect(301, `https://${req.headers.host}${req.url}`);
//   }
//   next();
// });
// CORS Configuration: Allow only requests from a specific domain
const corsOptions = {
  origin: ['https://smsc.aimobile.in', 'https://besmsc.aimobile.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};


app.use(cors());

// Middleware
app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: true }));


// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit process if connection fails
  }
};

// Routes

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/api/auth', authRouter);
app.use("/api/admin", adminRoutes); // Admin routes
app.use("/api/resellers", resellerRoutes); // Reseller routes
app.use("/api/rates", accountRoutes); // Reseller routes
app.use("/api/billing", billingRoutes); // Reseller routes
app.use("/api/management", managementRoutes); // Reseller routes
app.use("/api/routing", accountManagerRoutes); // Reseller routes
app.use("/api/support", supportRoutes); // Reseller routes
app.use("/api/sales", salesRoutes); // Reseller routes
app.use("/api/customers", customerRoutes); // Customer routes
app.use('/api/activation', activationRoutes);
app.use("/api/httpCarriers", httpCarrierRoutes);
app.use("/api/httpClients", httpClientRoutes);
app.use("/api/smppCarriers", smppCarrierRoutes);
app.use("/api/smppClients", smppClientRoutes);
app.use('/api/bulk-sms', bulkSmsRoutes);
app.use('/api/summary', smsReportRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/reporting', overAllReport);
app.use('/api/reporting', managementReporting);
app.use('/api', prefixRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/smpp', smpppRoutes);
app.use('/api/filter', filterRoutes);
app.use('/api/routing', routingRoutes);
app.use("/api/credit", creditRoutes)
app.use("/api/user-history", userHistoryRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Default Route
app.get("/", (req, res) => {
  res.send("Welcome to Backend !!!");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

const PORT = 4445;

const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await connectDB(); // Ensure DB connection on server start
});

// 🔥 Increase default timeout to allow big uploads or long processes
server.setTimeout(600000); // 10 minutes
