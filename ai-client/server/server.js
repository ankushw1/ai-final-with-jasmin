const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables from .env
dotenv.config();

const smsRoutes = require('./routes/smsRoutes');
const customerRoutes = require("./routes/customerRoutes");
const reportRoutes = require("./routes/reportRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes")

const app = express();

// CORS Configuration: load allowed origins from env
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors()); // Apply CORS

// Middleware
app.use(express.json());

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
    process.exit(1);
  }
};

// API Routes
app.use("/api/", customerRoutes);
app.use('/sms', smsRoutes);
app.use('/api/summary', reportRoutes);
app.use('/api/', balanceRoutes);
app.use("/api/dashboard", dashboardRoutes)

// Default Route
app.get("/", (req, res) => {
  res.send("Welcome to Backend External !!!");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await connectDB();
});
