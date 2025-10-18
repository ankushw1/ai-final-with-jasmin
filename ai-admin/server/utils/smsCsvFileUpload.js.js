const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage engine with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract the userId from req.user._id (this is set by the authMiddleware)
    const userId = req.user._id; 

    if (!userId) {
      return cb(new Error("User ID is required to determine upload path"), null);
    }

    // Construct the dynamic upload path
    const uploadPath = path.join('./files', userId.toString());

    // Check if the directory exists, if not create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); // Set the dynamic destination folder
  },
  filename: (req, file, cb) => {
    // Create a unique filename with the original extension
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Create upload instance with limits and storage
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const fileTypes = /csv|txt|xls|xlsx/; // Adjust file types based on your requirements
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Error: File type not allowed!"));
    }
  },
}).single('file'); // Single file upload with field name 'file'

// Middleware to handle file upload
const handleFileUpload = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Return the uploaded file path
    res.status(200).json({
      success: true,
      filePath: path.join('/files', req.user._id, req.file.filename), // Use req.user._id
    });
  });
};

module.exports = { upload, handleFileUpload };
