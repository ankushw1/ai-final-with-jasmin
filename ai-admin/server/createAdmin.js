const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const dotenv = require("dotenv");
const Admin = require("./models/Admin");

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully!");

    // Check existing admins
    const existingAdmins = await Admin.find();
    console.log("\n=== Existing Admins ===");
    if (existingAdmins.length > 0) {
      existingAdmins.forEach((admin) => {
        console.log(`Name: ${admin.name}, Email: ${admin.email}, Created: ${admin.createdAt}`);
      });
    } else {
      console.log("No admins found in database");
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: "ankushwaghmare050@gmail.com" });
    if (existingAdmin) {
      console.log("\n❌ Admin with email ankushwaghmare050@gmail.com already exists!");
      process.exit(0);
    }

    // Create new admin
    const name = "Ankush";
    const email = "ankushwaghmare050@gmail.com";
    const password = "ankush";
    const mobile = "9876543210"; // Default mobile number

    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: `AI_Admin (${email})` });

    // Generate a QR Code for the user to scan
    const otpAuthUrl = secret.otpauth_url;
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      mobile,
      googleAuthSecret: secret.base32,
    });

    await newAdmin.save();

    console.log("\n✅ Admin created successfully!");
    console.log("=== Admin Details ===");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Mobile: ${mobile}`);
    console.log(`Google Auth Secret: ${secret.base32}`);
    console.log("\nNote: OTP verification has been commented out, so you can login with just email and password.");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();

