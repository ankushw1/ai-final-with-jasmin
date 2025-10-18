const fs = require("fs")
const path = require("path")
const csvParser = require("csv-parser")
const xlsx = require("xlsx")
const axios = require("axios")
const multer = require("multer")
const mongoose = require("mongoose")
const Sms = require("../models/smsModal")
const Customer = require("../models/Customer")
const CustomerUser = require("../models/CustomerUser")
const qs = require("qs")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".csv", ".xlsx", ".xls"]
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error("Only CSV and Excel files are allowed"))
    }
  },
})

// SMS Statistics endpoint
exports.getSmsStats = async (req, res) => {
  try {
    const customerId = req.user._id

    // Get today's date range
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    // Fetch today's SMS records
    const todaySmsRecords = await Sms.find({
      customer: customerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).select("providerResponse")

    // Fetch all SMS records for overall stats
    const allSmsRecords = await Sms.find({
      customer: customerId,
    }).select("providerResponse")

    // Extract provider response IDs for DLR lookup
    const todayProviderIds = todaySmsRecords.map((sms) => sms.providerResponse?.id).filter(Boolean)
    const allProviderIds = allSmsRecords.map((sms) => sms.providerResponse?.id).filter(Boolean)

    // Access the dlrlevel2 collection for delivery status
    const dlrCollection = mongoose.connection.collection("dlrlevel2")

    // Fetch DLR records for today
    const todayDlrRecords = todayProviderIds.length
      ? await dlrCollection.find({ "data.id": { $in: todayProviderIds }, "data.level": "2" }).toArray()
      : []

    // Fetch DLR records for all time
    const allDlrRecords = allProviderIds.length
      ? await dlrCollection.find({ "data.id": { $in: allProviderIds }, "data.level": "2" }).toArray()
      : []

    // Create DLR maps for quick lookup
    const todayDlrMap = todayDlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    const allDlrMap = allDlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    // Calculate today's stats
    const todayStats = {
      delivered: 0,
      rejected: 0,
      undelivered: 0,
      pending: 0,
      total: todaySmsRecords.length,
    }

    todaySmsRecords.forEach((sms) => {
      const providerId = sms.providerResponse?.id
      const dlr = providerId ? todayDlrMap[providerId] : null

      if (dlr) {
        switch (dlr.message_status) {
          case "DELIVRD":
            todayStats.delivered++
            break
          case "REJECTD":
            todayStats.rejected++
            break
          case "UNDELIV":
            todayStats.undelivered++
            break
          default:
            todayStats.pending++
            break
        }
      } else {
        todayStats.pending++
      }
    })

    // Calculate overall stats
    const overallStats = {
      delivered: 0,
      rejected: 0,
      undelivered: 0,
      pending: 0,
      total: allSmsRecords.length,
    }

    allSmsRecords.forEach((sms) => {
      const providerId = sms.providerResponse?.id
      const dlr = providerId ? allDlrMap[providerId] : null

      if (dlr) {
        switch (dlr.message_status) {
          case "DELIVRD":
            overallStats.delivered++
            break
          case "REJECTD":
            overallStats.rejected++
            break
          case "UNDELIV":
            overallStats.undelivered++
            break
          default:
            overallStats.pending++
            break
        }
      } else {
        overallStats.pending++
      }
    })

    return res.status(200).json({
      success: true,
      message: "SMS statistics fetched successfully",
      data: {
        today: todayStats,
        overall: overallStats,
      },
    })
  } catch (error) {
    console.error("Error fetching SMS statistics:", error)
    return res.status(500).json({
      success: false,
      message: "Error fetching SMS statistics",
      error: error.message,
    })
  }
}

// Single SMS (existing - working)
exports.sendSingleSms = async (req, res) => {
  try {
    const { sender, mobileNumbers, messageType, message } = req.body
    const username = req.user.username
    const userId = req.user._id

    console.log("Single SMS request:", { sender, mobileNumbers: mobileNumbers?.length, messageType })

    const userRecord = await CustomerUser.findOne({ username }).select("+password")
    if (!userRecord || !userRecord.password) {
      return res.status(404).json({ message: "User not found or password missing." })
    }

    const jasminPassword = userRecord.password
    const jasminUsername = userRecord.username

    const customer = await Customer.findById(userId)
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." })
    }

    if (!mobileNumbers || mobileNumbers.length === 0) {
      return res.status(400).json({ message: "Mobile numbers are required." })
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required." })
    }

    const numbersToProcess = Array.isArray(mobileNumbers) ? mobileNumbers : [mobileNumbers]
    const messagesToProcess = numbersToProcess.map((number) => ({
      mobile: number,
      message,
    }))

    const results = await processSmsSending(
      messagesToProcess,
      sender,
      messageType || "TEXT",
      userId,
      jasminUsername,
      jasminPassword,
    )

    return res.status(200).json({
      message: "SMS processing completed!",
      details: results,
    })
  } catch (error) {
    console.error("Error in single SMS controller:", error)
    return res.status(500).json({ message: "Error sending SMS.", error: error.message })
  }
}

// Bulk SMS with file upload
exports.sendBulkSms = [
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("Received bulk SMS request")
      console.log("Body:", req.body)
      console.log("File:", req.file)

      const { sender, messageType, message, fileContainsMessages, mobileNumbers } = req.body
      const username = req.user.username
      const userId = req.user._id

      const userRecord = await CustomerUser.findOne({ username }).select("+password")
      if (!userRecord || !userRecord.password) {
        return res.status(404).json({ message: "User not found or password missing." })
      }

      const jasminPassword = userRecord.password
      const jasminUsername = userRecord.username

      const customer = await Customer.findById(userId)
      if (!customer) {
        return res.status(404).json({ message: "Customer not found." })
      }

      let messagesToProcess = []

      // Handle direct mobile numbers input (for single SMS functionality in bulk)
      if (mobileNumbers && mobileNumbers.length > 0) {
        console.log("Processing direct input mobile numbers")
        const numbersToProcess = Array.isArray(mobileNumbers) ? mobileNumbers : [mobileNumbers]
        messagesToProcess = numbersToProcess.map((number) => ({
          mobile: number,
          message,
        }))
      }
      // Handle file upload
      else if (req.file) {
        console.log(`Processing file: ${req.file.filename}`)

        const fileContainsMsg = fileContainsMessages === "true"
        const fileData = await parseFileForSms(req.file.path, fileContainsMsg ? "messages" : "contacts")

        if (!fileContainsMsg) {
          if (!message) {
            return res.status(400).json({ message: "Message is required for contact-only files." })
          }
          messagesToProcess = fileData.map((item) => ({
            mobile: item.mobile,
            message,
          }))
        } else {
          messagesToProcess = fileData
        }

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err)
        })
      } else {
        return res.status(400).json({ message: "No mobile numbers or file provided." })
      }

      if (messagesToProcess.length === 0) {
        return res.status(400).json({ message: "No valid data to process." })
      }

      console.log(`Processing ${messagesToProcess.length} messages`)

      const results = await processSmsSending(
        messagesToProcess,
        sender,
        messageType || "TEXT",
        userId,
        jasminUsername,
        jasminPassword,
      )

      return res.status(200).json({
        message: "Bulk SMS processing completed!",
        details: results,
      })
    } catch (error) {
      console.error("Error in bulk SMS controller:", error)
      return res.status(500).json({ message: "Error sending bulk SMS.", error: error.message })
    }
  },
]

// Personalized SMS with file upload
exports.sendPersonalizedSms = [
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("Received personalized SMS request")
      console.log("Body:", req.body)
      console.log("File:", req.file)

      const { sender, messageType, messageTemplate } = req.body
      const username = req.user.username
      const userId = req.user._id

      if (!req.file) {
        return res.status(400).json({ message: "File is required for personalized SMS." })
      }

      if (!messageTemplate) {
        return res.status(400).json({ message: "Message template is required." })
      }

      const userRecord = await CustomerUser.findOne({ username }).select("+password")
      if (!userRecord || !userRecord.password) {
        return res.status(404).json({ message: "User not found or password missing." })
      }

      const jasminPassword = userRecord.password
      const jasminUsername = userRecord.username

      const customer = await Customer.findById(userId)
      if (!customer) {
        return res.status(404).json({ message: "Customer not found." })
      }

      console.log(`Processing personalized file: ${req.file.filename}`)

      const fileData = await parseFileForPersonalizedSms(req.file.path, messageTemplate)

      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err)
      })

      if (fileData.length === 0) {
        return res.status(400).json({ message: "No valid data to process from file." })
      }

      console.log(`Processing ${fileData.length} personalized messages`)

      const results = await processSmsSending(
        fileData,
        sender,
        messageType || "TEXT",
        userId,
        jasminUsername,
        jasminPassword,
      )

      return res.status(200).json({
        message: "Personalized SMS processing completed!",
        details: results,
      })
    } catch (error) {
      console.error("Error in personalized SMS controller:", error)
      return res.status(500).json({ message: "Error sending personalized SMS.", error: error.message })
    }
  },
]

// Parse file for regular bulk SMS
const parseFileForSms = async (filePath, fileType) => {
  const fileExt = path.extname(filePath).toLowerCase()
  let records = []

  try {
    if (fileExt === ".csv") {
      records = await parseCSV(filePath)
    } else {
      records = await parseExcel(filePath)
    }

    if (records.length === 0) {
      throw new Error("File is empty or could not be parsed")
    }

    const firstRecord = records[0]
    const headers = Object.keys(firstRecord)

    // Find mobile column
    const mobileColumn = headers.find(
      (header) =>
        header.toLowerCase().includes("mobile") ||
        header.toLowerCase().includes("phone") ||
        header.toLowerCase().includes("number") ||
        header.toLowerCase() === "mobile_no",
    )

    if (!mobileColumn) {
      throw new Error(
        "Mobile column not found. Please ensure your file has a column with 'mobile', 'phone', or 'number' in the header.",
      )
    }

    let messageColumn = null
    if (fileType === "messages") {
      messageColumn = headers.find(
        (header) =>
          header.toLowerCase().includes("message") ||
          header.toLowerCase().includes("text") ||
          header.toLowerCase().includes("content") ||
          header.toLowerCase().includes("sms"),
      )

      if (!messageColumn) {
        throw new Error(
          "Message column not found. Please ensure your file has a column with 'message', 'text', or 'content' in the header.",
        )
      }
    }

    // Extract and validate data
    const processedData = records
      .map((record, index) => {
        const mobile = record[mobileColumn] ? record[mobileColumn].toString().trim() : ""

        // Basic mobile number validation
        if (!mobile || !/^\d{10,15}$/.test(mobile)) {
          console.warn(`Invalid mobile number at row ${index + 1}: ${mobile}`)
          return null
        }

        const result = { mobile }

        if (messageColumn) {
          const message = record[messageColumn] ? record[messageColumn].toString().trim() : ""
          if (!message) {
            console.warn(`Empty message at row ${index + 1}`)
            return null
          }
          result.message = message
        }

        return result
      })
      .filter((item) => item !== null) // Remove invalid entries

    console.log(`Parsed ${processedData.length} valid records from ${records.length} total records`)
    return processedData
  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`)
  }
}

// Parse file for personalized SMS
const parseFileForPersonalizedSms = async (filePath, messageTemplate) => {
  const fileExt = path.extname(filePath).toLowerCase()
  let records = []

  try {
    if (fileExt === ".csv") {
      records = await parseCSV(filePath)
    } else {
      records = await parseExcel(filePath)
    }

    if (records.length === 0) {
      throw new Error("File is empty or could not be parsed")
    }

    const firstRecord = records[0]
    const headers = Object.keys(firstRecord)

    // Find mobile column (should be first column or contain mobile/phone)
    const mobileColumn =
      headers.find(
        (header) =>
          header.toLowerCase().includes("mobile") ||
          header.toLowerCase().includes("phone") ||
          header.toLowerCase().includes("number"),
      ) || headers[0] // Default to first column if no mobile column found

    // Process each record and personalize message
    const processedData = records
      .map((record, index) => {
        const mobile = record[mobileColumn] ? record[mobileColumn].toString().trim() : ""

        // Basic mobile number validation
        if (!mobile || !/^\d{10,15}$/.test(mobile)) {
          console.warn(`Invalid mobile number at row ${index + 1}: ${mobile}`)
          return null
        }

        // Replace placeholders in message template
        let personalizedMessage = messageTemplate

        // Replace #1, #2, #3, etc. with corresponding column values
        headers.forEach((header, headerIndex) => {
          const placeholder = `#${headerIndex + 1}`
          const value = record[header] ? record[header].toString().trim() : ""
          personalizedMessage = personalizedMessage.replace(new RegExp(placeholder, "g"), value)
        })

        return {
          mobile,
          message: personalizedMessage,
        }
      })
      .filter((item) => item !== null) // Remove invalid entries

    console.log(`Processed ${processedData.length} personalized messages from ${records.length} total records`)
    return processedData
  } catch (error) {
    throw new Error(`Error processing personalized file: ${error.message}`)
  }
}

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}

const parseExcel = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = xlsx.utils.sheet_to_json(worksheet)
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

const processSmsSending = async (messagesData, sender, messageType, userId, jasminUsername, jasminPassword) => {
  const failedNumbers = []
  const successfulNumbers = []
  const results = []

  const extractProviderId = (responseDetails) => {
    if (!responseDetails) return null
    const match = responseDetails.trim().match(/^Success\s+"?([^"]+)"?$/)
    return match ? match[1] : null
  }

  // Helper function to convert string to UCS-2 hex
  const stringToUcs2Hex = (str) => {
    let hex = ""
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      hex += code.toString(16).padStart(4, "0")
    }
    return hex.toUpperCase()
  }

  for (const item of messagesData) {
    const { mobile, message } = item

    try {
      console.log(`Sending SMS to ${mobile} | Type: ${messageType}`)

      let postData = {}

      if (messageType === "UNICODE" || messageType === "UNI_FLASH") {
        // Convert message to UCS-2 hex (UTF-16BE)
        const hexContent = stringToUcs2Hex(message)

        postData = {
          username: jasminUsername,
          password: jasminPassword,
          to: mobile,
          from: sender,
          coding: "8", // Unicode
          "hex-content": hexContent,
          dlr: "yes",
          "dlr-url": process.env.DLR_URL,
          "dlr-level": "3",
          "dlr-method": "POST",
        }
      } else {
        postData = {
          username: jasminUsername,
          password: jasminPassword,
          to: mobile,
          from: sender,
          content: message,
          dlr: "yes",
          "dlr-url": process.env.DLR_URL,
          "dlr-level": "3",
          "dlr-method": "POST",
        }
      }

      const encodedData = qs.stringify(postData)

      const response = await axios.post(`${process.env.JASMIN_URL}/send`, encodedData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      })

      console.log(`Jasmin Response for ${mobile}:`, response.data)

      const extractedId = extractProviderId(response.data.trim())
      const status = extractedId ? "Sent" : "Failed"

      if (status === "Sent") {
        successfulNumbers.push(mobile)
      } else {
        failedNumbers.push(mobile)
      }

      await new Sms({
        sender,
        mobileNumbers: [mobile],
        messageType,
        message,
        customer: userId,
        username: jasminUsername, 
        providerResponse: { id: extractedId },
        status,
      }).save()

      results.push({ mobile, status, messageId: extractedId })
    } catch (apiError) {
      console.error(`Failed to send SMS to ${mobile}:`, apiError.message)

      failedNumbers.push(mobile)

      await new Sms({
        sender,
        mobileNumbers: [mobile],
        messageType,
        message,
        customer: userId,
        username: jasminUsername, 
        providerResponse: {
          id: null,
          error: apiError.message,
        },
        status: "Failed",
      }).save()

      results.push({ mobile, status: "Failed", error: apiError.message })
    }
  }

  return {
    total: messagesData.length,
    successful: successfulNumbers.length,
    failed: failedNumbers.length,
    successfulNumbers,
    failedNumbers,
    details: results,
  }
}
