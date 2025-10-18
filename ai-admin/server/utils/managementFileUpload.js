const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get the user's email from the request body
    const userEmail = req.body.email;

    if (!userEmail) {
      return cb(new Error("User email is required to determine upload path"), null);
    }

    // Construct the dynamic upload path
    const uploadPath = path.join('./uploads/management', userEmail, 'kyc');

    // Check if the directory exists, if not create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); // Set the dynamic destination folder
  },
  filename: (req, file, cb) => {
    // Create a unique filename with the original extension
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Create upload instance with limits and storage
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const fileTypes = /jpg|jpeg|png|pdf/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Error: File type not allowed!"));
    }
  }
}).single('kyc'); // Single file upload with field name 'kyc'

module.exports = upload;
