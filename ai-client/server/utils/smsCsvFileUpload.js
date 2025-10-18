const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Ensure upload directory exists
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads", req.user._id.toString())
    ensureUploadDir(uploadDir)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".csv", ".xlsx", ".xls"]
  const fileExt = path.extname(file.originalname).toLowerCase()

  if (allowedTypes.includes(fileExt)) {
    cb(null, true)
  } else {
    cb(new Error("Only CSV and Excel files are allowed"), false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
})

module.exports = { upload }
