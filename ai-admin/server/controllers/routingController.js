const fs = require("fs")
const csvParser = require("csv-parser")
const XLSX = require("xlsx")
const Prefix = require("../models/Prefix")
const path = require("path")
const Rate = require("../models/RoutingRates")
const SMPP = require("../models/smpp")
const CustomerUser = require("../models/CustomerUser")
const DefinedRoute = require("../models/DefinedRoute")
const Routing = require("../models/Routing")
const qs = require("qs")
const axios = require("axios")
const crypto = require("crypto")

const JASMIN_BASE_URL = process.env.JASMIN_BASE_URL || "http://185.169.252.75:8000"

// Helper function to validate and ensure rate is always a valid number
const validateRate = (rate) => {
  if (rate === null || rate === undefined || rate === "") {
    console.warn("⚠️ Rate is null/undefined/empty, using default rate: 0.01")
    return 0.01
  }
  const numericRate = typeof rate === "string" ? Number.parseFloat(rate.trim()) : Number(rate)
  if (isNaN(numericRate) || numericRate <= 0 || !isFinite(numericRate)) {
    console.warn(`⚠️ Invalid rate detected: ${rate}, using default rate: 0.01`)
    return 0.01
  }
  const roundedRate = Math.round(numericRate * 10000) / 10000
  console.log(`✅ Rate validated: ${rate} -> ${roundedRate}`)
  return roundedRate
}

// Helper function to convert data to CSV
const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return ""
  const csvHeaders = headers.join(",")
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header] || ""
        return typeof value === "string" && (value.includes(",") || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      })
      .join(","),
  )
  return [csvHeaders, ...csvRows].join("\n")
}

// Helper function to ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, "../uploads")
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log("✅ Created uploads directory:", uploadsDir)
  }
  return uploadsDir
}

// Helper function to safely delete file
const safeDeleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log("🗑️ Cleaned up file:", filePath)
    }
  } catch (error) {
    console.warn("⚠️ Could not delete file:", filePath, error.message)
  }
}

// Import CSV
module.exports.ImportCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" })
  }

  const ext = path.extname(req.file.originalname).toLowerCase()
  const filePath = req.file.path

  try {
    if (!fs.existsSync(filePath)) {
      console.error("❌ File does not exist:", filePath)
      return res.status(400).json({ message: "Uploaded file not found" })
    }

    const results = []
    const cleanData = (rows) =>
      rows.map((row) => {
        const cleanedRow = {}
        for (const key in row) {
          const cleanKey = key.trim()
          const value = row[key]
          cleanedRow[cleanKey] = typeof value === "string" ? value.trim() : value
        }
        return cleanedRow
      })

    if (ext === ".csv") {
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (data) => results.push(data))
          .on("end", async () => {
            try {
              const cleaned = cleanData(results)
              await Prefix.insertMany(cleaned)
              safeDeleteFile(filePath)
              res.status(200).json({ message: "CSV data imported successfully" })
              resolve()
            } catch (error) {
              safeDeleteFile(filePath)
              res.status(500).json({ message: `Error processing CSV: ${error.message}` })
              reject(error)
            }
          })
          .on("error", (error) => {
            safeDeleteFile(filePath)
            res.status(500).json({ message: `Error reading CSV: ${error.message}` })
            reject(error)
          })
      })
    } else if (ext === ".xlsx") {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
      const cleaned = cleanData(data)
      await Prefix.insertMany(cleaned)
      safeDeleteFile(filePath)
      res.status(200).json({ message: "XLSX data imported successfully" })
    } else {
      safeDeleteFile(filePath)
      return res.status(400).json({ message: "Unsupported file type. Use CSV or XLSX." })
    }
  } catch (err) {
    safeDeleteFile(filePath)
    console.error("❌ Import error:", err)
    res.status(500).json({ message: `Error occurred: ${err.message}` })
  }
}

// Import rates - Fixed file handling
// FIXED: Import rates - Enhanced to properly handle wildcard operators
module.exports.ImportRatesCSV = async (req, res) => {
  const { smppId } = req.body
  if (!req.file || !smppId) {
    return res.status(400).json({ message: "File and SMPP ID required" })
  }

  const ext = path.extname(req.file.originalname).toLowerCase()
  const filePath = req.file.path

  try {
    if (!fs.existsSync(filePath)) {
      console.error("❌ File does not exist:", filePath)
      return res.status(400).json({ message: "Uploaded file not found" })
    }

    console.log("📁 Processing file:", filePath)
    const rows = []

    const cleanData = (data) =>
      data.map((row) => {
        const cleaned = {}
        for (const key in row) {
          const cleanKey = key.trim()
          const value = row[key]
          cleaned[cleanKey] = typeof value === "string" ? value.trim() : value
        }
        return cleaned
      })

    const importToDB = async (data) => {
      const cleaned = cleanData(data)
      const bulkOps = []
      const processedOperators = new Set()
      let skippedRows = 0
      let validRows = 0

      console.log(`📊 Processing ${cleaned.length} rows from file`)

      for (const item of cleaned) {
        console.log(`🔍 Processing row:`, item)

        // ✅ FIXED: Enhanced MCC/MNC parsing to handle wildcards
        const mcc = Number(item.MCC)
        let mnc = item.MNC

        // ✅ Handle wildcard MNC properly
        if (mnc === "*" || mnc === "star" || mnc === "wildcard") {
          mnc = "*" // Ensure consistent wildcard format
        } else {
          mnc = Number(mnc)
          if (isNaN(mnc)) {
            console.warn(`❌ Invalid MNC: ${item.MNC}, skipping row`)
            skippedRows++
            continue
          }
        }

        // ✅ FIXED: Enhanced rate parsing
        let rawRate = null
        if ("rates" in item) rawRate = item.rates
        else if ("rate" in item) rawRate = item.rate
        else if ("Rate" in item) rawRate = item.Rate
        else if ("RATE" in item) rawRate = item.RATE

        console.log(`📊 Raw rate value: "${rawRate}", type: ${typeof rawRate}`)

        // ✅ FIXED: Better rate validation for wildcards
        if (rawRate === undefined || rawRate === "" || rawRate === null) {
          console.warn(`⚠️ No rate provided for MCC=${mcc}, MNC=${mnc}, skipping`)
          skippedRows++
          continue
        }

        const rate = Number(rawRate)
        if (isNaN(rate) || rate <= 0 || !isFinite(rate)) {
          console.warn(`❌ Invalid rate: ${rawRate} for MCC=${mcc}, MNC=${mnc}, skipping`)
          skippedRows++
          continue
        }

        // Basic validation
        if (!smppId || isNaN(mcc)) {
          console.warn("❌ Missing smppId or invalid MCC, skipping row:", item)
          skippedRows++
          continue
        }

        // Create unique operator key
        const operatorKey = `${mcc}-${mnc}-${smppId}`
        if (!processedOperators.has(operatorKey)) {
          processedOperators.add(operatorKey)
          validRows++

          console.log(`🔄 Processing operator: MCC=${mcc}, MNC=${mnc}, Rate=${rate}, SMPP=${smppId}`)

          // ✅ FIXED: Enhanced bulk operation for wildcards
          const filterQuery = { smppId, MCC: mcc }

          // ✅ Handle wildcard vs specific MNC in filter
          if (mnc === "*") {
            filterQuery.MNC = "*" // Exact match for wildcard
          } else {
            filterQuery.MNC = mnc // Numeric match for specific operators
          }

          bulkOps.push({
            updateOne: {
              filter: filterQuery,
              update: {
                $set: {
                  rate: validateRate(rate),
                  label: item.price || item.label || "",
                  updatedAt: new Date(),
                },
                $setOnInsert: {
                  MCC: mcc,
                  MNC: mnc, // ✅ Store as-is (string "*" or number)
                  smppId,
                  createdAt: new Date(),
                },
              },
              upsert: true,
            },
          })

          console.log(`✅ Added to bulk operations: MCC=${mcc}, MNC=${mnc}, Rate=${validateRate(rate)}`)
        }
      }

      console.log(`📈 Summary: ${validRows} valid rows, ${skippedRows} skipped rows`)

      if (bulkOps.length > 0) {
        console.log(`📝 Executing ${bulkOps.length} targeted bulk operations`)

        // ✅ Enhanced error handling for bulk operations
        try {
          const result = await Rate.bulkWrite(bulkOps, { ordered: false })
          console.log(`✅ Bulk write result:`, {
            insertedCount: result.insertedCount,
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            matchedCount: result.matchedCount,
          })

          // ✅ Verify wildcard rates were actually saved
          const wildcardRates = await Rate.find({ smppId, MNC: "*" })
          console.log(
            `🌟 Wildcard rates in database:`,
            wildcardRates.map((r) => ({ MCC: r.MCC, MNC: r.MNC, rate: r.rate })),
          )

          safeDeleteFile(filePath)
          return res.status(200).json({
            message: `Rates updated successfully. ${result.upsertedCount} new, ${result.modifiedCount} updated.`,
            details: {
              newRates: result.upsertedCount,
              updatedRates: result.modifiedCount,
              totalProcessed: bulkOps.length,
              operatorsAffected: processedOperators.size,
              skippedRows,
              wildcardRatesCount: wildcardRates.length,
            },
          })
        } catch (bulkError) {
          console.error("❌ Bulk write error:", bulkError)
          safeDeleteFile(filePath)
          return res.status(500).json({
            message: "Error during bulk write operation",
            error: bulkError.message,
          })
        }
      } else {
        safeDeleteFile(filePath)
        return res.status(400).json({
          message: "No valid rate data found to import.",
          details: { skippedRows, totalRows: cleaned.length },
        })
      }
    }

    // Handle CSV and XLSX files
    if (ext === ".csv") {
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (data) => rows.push(data))
          .on("end", async () => {
            try {
              await importToDB(rows)
              resolve()
            } catch (error) {
              safeDeleteFile(filePath)
              res.status(500).json({ message: `Error processing rates: ${error.message}` })
              reject(error)
            }
          })
          .on("error", (err) => {
            console.error("❌ CSV Parse Error:", err)
            safeDeleteFile(filePath)
            res.status(500).json({ message: "CSV parsing failed" })
            reject(err)
          })
      })
    } else if (ext === ".xlsx") {
      const workbook = XLSX.readFile(filePath)
      const sheet = workbook.SheetNames[0]
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
      await importToDB(data)
    } else {
      safeDeleteFile(filePath)
      return res.status(400).json({ message: "Unsupported file type" })
    }
  } catch (err) {
    console.error("❌ Error importing rates:", err)
    safeDeleteFile(filePath)
    return res.status(500).json({ message: `Error: ${err.message}` })
  }
}


// Get rates by country and SMPP - Updated with proper pagination and updatedAt
exports.getRatesByCountry = async (req, res) => {
  try {
    const { country, smppId, page = 0, pageSize = 10, search = "" } = req.query
    const pageNum = Number.parseInt(page)
    const pageSizeNum = Number.parseInt(pageSize)

    // Handle "All" option for pageSize
    const isShowAll = pageSize === "all" || pageSizeNum === 999999
    const skip = isShowAll ? 0 : pageNum * pageSizeNum
    const limit = isShowAll ? 999999 : pageSizeNum

    if (!country || !smppId) {
      return res.status(400).json({ message: "Country and smppId are required" })
    }

    console.log(`🔍 Fetching rates for country: ${country}, SMPP: ${smppId}, page: ${pageNum}, pageSize: ${pageSize}`)

    // Build search query for prefixes
    const prefixQuery = {
      Country: { $regex: country, $options: "i" },
      "Operetor name": { $ne: null, $exists: true },
      MNC: { $ne: null, $exists: true },
    }

    if (search) {
      prefixQuery["Operetor name"] = { $regex: search, $options: "i" }
    }

    // Get total count for pagination
    const totalPipeline = [
      { $match: prefixQuery },
      {
        $group: {
          _id: {
            operator: "$Operetor name",
            mnc: "$MNC",
          },
        },
      },
      { $count: "total" },
    ]

    // Get unique operators (grouped by operator name and MNC)
    const operatorPipeline = [
      { $match: prefixQuery },
      {
        $group: {
          _id: {
            operator: "$Operetor name",
            mnc: "$MNC",
          },
          mcc: { $first: "$MCC" },
          operator: { $first: "$Operetor name" },
          mnc: { $first: "$MNC" },
        },
      },
      { $sort: { operator: 1, mnc: 1 } },
    ]

    // Add pagination only if not showing all
    if (!isShowAll) {
      operatorPipeline.push({ $skip: skip }, { $limit: limit })
    }

    const [operators, totalResult] = await Promise.all([
      Prefix.aggregate(operatorPipeline),
      Prefix.aggregate(totalPipeline),
    ])

    const total = totalResult.length > 0 ? totalResult[0].total : 0
    const totalPages = isShowAll ? 1 : Math.ceil(total / pageSizeNum)

    console.log(`📊 Found ${operators.length} operators out of ${total} total`)

    // Get rates for each unique operator
    const results = await Promise.all(
      operators.map(async (op) => {
        let rate = null
        if (op.mnc === "*") {
          const rateDoc = await Rate.findOne({
            MCC: op.mcc,
            smppId: smppId,
          })
          rate = rateDoc
        } else {
          const rateDoc = await Rate.findOne({
            MCC: op.mcc,
            MNC: op.mnc,
            smppId: smppId,
          })
          rate = rateDoc
        }

        return {
          operator: op.operator,
          mcc: op.mcc,
          mnc: op.mnc,
          rate: rate?.rate || null,
          label: rate?.label || "",
          smppId: rate?.smppId || null,
          updatedAt: rate?.updatedAt || null,
          hasRate: rate ? true : false,
        }
      }),
    )

    res.status(200).json({
      rates: results,
      total,
      page: pageNum,
      pageSize: isShowAll ? total : pageSizeNum,
      totalPages,
      isShowAll,
    })
  } catch (error) {
    console.error("Error fetching operator rates:", error)
    res.status(500).json({ message: "Error fetching rates", error: error.message })
  }
}

// UPDATED: Fix the getCountryDetailss function to match the logic used in getRatesByCountry
exports.getCountryDetailss = async (req, res) => {
  try {
    const { country, search = "", page = 1, limit = 10 } = req.body
    if (!country) {
      return res.status(400).json({ message: "Country required" })
    }

    const skip = (page - 1) * limit
    const isNumericSearch = /^\d+$/.test(search)

    // ✅ FIXED: Use the same aggregation logic as getRatesByCountry
    const matchQuery = {
      Country: { $regex: country, $options: "i" },
      "Operetor name": { $ne: null, $exists: true },
      MNC: { $ne: null, $exists: true }, // ✅ Allow both numbers and "*"
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": { $regex: search, $options: "i" } },
        ...(isNumericSearch
          ? [
              { MNC: Number(search) },
              { MNC: search }, // ✅ Also search for string MNC (like "*")
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$Prefix" },
                    regex: search,
                  },
                },
              },
            ]
          : []),
      ]
    }

    // ✅ FIXED: Use aggregation to get unique operators (same as getRatesByCountry)
    const totalPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            operator: "$Operetor name",
            mnc: "$MNC",
          },
        },
      },
      { $count: "total" },
    ]

    const operatorPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            operator: "$Operetor name",
            mnc: "$MNC",
          },
          country: { $first: "$Country" },
          cc: { $first: "$CC" },
          mcc: { $first: "$MCC" },
          mnc: { $first: "$MNC" },
          operator: { $first: "$Operetor name" },
        },
      },
      { $sort: { operator: 1, mnc: 1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ]

    const [operators, totalResult] = await Promise.all([
      Prefix.aggregate(operatorPipeline),
      Prefix.aggregate(totalPipeline),
    ])

    const total = totalResult.length > 0 ? totalResult[0].total : 0

    console.log(`📊 Found ${operators.length} unique operators out of ${total} total for country: ${country}`)

    return res.status(200).json({
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      results: operators, // ✅ Now returns the same unique operators as rates page
    })
  } catch (err) {
    console.error("getCountryDetails error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}


// FIXED: Get rates by SMPP - Updated to properly handle wildcard operators
exports.getRatesBySMPP = async (req, res) => {
  try {
    const { smppId } = req.query

    console.log(`🔍 Debug: Fetching rates for SMPP: ${smppId}`)

    // ✅ Step 1: Get all rates without aggregation
    const allRates = await Rate.find({ smppId }).lean()
    console.log(`📊 Found ${allRates.length} total rates in database`)

    // ✅ Step 2: Process each rate manually
    const processedRates = allRates.map((rate, index) => {
      console.log(`Processing rate ${index + 1}:`, {
        MCC: rate.MCC,
        MNC: rate.MNC,
        MNCType: typeof rate.MNC,
        rate: rate.rate,
        label: rate.label,
      })

      let operator = ""
      let country = ""

      // Handle wildcard operators
      if (rate.MNC === "*") {
        switch (rate.MCC) {
          case 404:
          case 405:
            country = "India"
            operator = "India (All Networks)"
            break
          case 454:
            country = "Hong Kong"
            operator = "Hong Kong (All Networks)"
            break
          default:
            country = "Unknown"
            operator = `MCC-${rate.MCC} (All Networks)`
        }
      } else {
        // Handle specific operators - you can enhance this with actual operator lookup
        operator = rate.label || `MCC-${rate.MCC}/MNC-${rate.MNC}`
        switch (rate.MCC) {
          case 404:
          case 405:
            country = "India"
            break
          case 454:
            country = "Hong Kong"
            break
          default:
            country = "Unknown"
        }
      }

      return {
        country,
        operator,
        mcc: rate.MCC,
        mnc: rate.MNC,
        rate: rate.rate,
        label: rate.label,
        updatedAt: rate.updatedAt,
      }
    })

    console.log("🔍 Processed rates:")
    processedRates.forEach((rate, index) => {
      console.log(`  ${index + 1}. ${rate.operator} - MCC=${rate.mcc}, MNC=${rate.mnc}, Rate=${rate.rate}`)
    })

    res.status(200).json({
      rates: processedRates,
      total: processedRates.length,
      page: 0,
      pageSize: processedRates.length,
      totalPages: 1,
      isShowAll: true,
    })
  } catch (error) {
    console.error("❌ Error fetching SMPP rates:", error)
    res.status(500).json({
      message: "Error fetching SMPP rates",
      error: error.message,
    })
  }
}


// Get operators by country and SMPP (grouped by operator) - Updated
exports.getOperatorsByCountryAndSMPP = async (req, res) => {
  try {
    const { country, smppId } = req.query
    if (!country || !smppId) {
      return res.status(400).json({ message: "Country and smppId are required" })
    }

    // Get unique operators using aggregation
    const operators = await Prefix.aggregate([
      {
        $match: {
          Country: { $regex: country, $options: "i" },
          "Operetor name": { $ne: null, $exists: true },
          MNC: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: {
            operator: "$Operetor name",
            mnc: "$MNC",
          },
          mcc: { $first: "$MCC" },
          operator: { $first: "$Operetor name" },
          mnc: { $first: "$MNC" },
        },
      },
      { $sort: { operator: 1, mnc: 1 } },
    ])

    // Get rates for each operator
    const operatorsWithRates = await Promise.all(
      operators.map(async (op) => {
        let rateDoc = null
        if (op.mnc === "*") {
          rateDoc = await Rate.findOne({
            MCC: op.mcc,
            smppId: smppId,
          })
        } else {
          rateDoc = await Rate.findOne({
            MCC: op.mcc,
            MNC: op.mnc,
            smppId: smppId,
          })
        }

        return {
          operator: op.operator,
          mcc: op.mcc,
          mnc: op.mnc,
          rate: rateDoc?.rate || null,
          updatedAt: rateDoc?.updatedAt || null,
          hasRate: rateDoc ? true : false,
        }
      }),
    )

    res.status(200).json({
      operators: operatorsWithRates,
      total: operatorsWithRates.length,
    })
  } catch (error) {
    console.error("Error fetching operators by country and SMPP:", error)
    res.status(500).json({ message: "Error fetching operators", error: error.message })
  }
}

// Get operator prefixes
exports.getOperatorPrefixes = async (req, res) => {
  try {
    const { country, operator, mnc } = req.body
    if (!country || !operator || !mnc) {
      return res.status(400).json({ message: "Country, operator, and MNC are required" })
    }

    const prefixes = await Prefix.find({
      Country: { $regex: country, $options: "i" },
      "Operetor name": { $regex: operator, $options: "i" },
      MNC: mnc,
      Prefix: { $ne: null },
    }).select("Prefix")

    const prefixList = prefixes.map((p) => p.Prefix).filter(Boolean)

    res.status(200).json({ prefixes: prefixList })
  } catch (error) {
    console.error("Error fetching operator prefixes:", error)
    res.status(500).json({ message: "Error fetching prefixes", error: error.message })
  }
}

// Get all SMPPs
exports.getAllSMPPs = async (req, res) => {
  try {
    const smpps = await SMPP.find().sort({ createdAt: -1 })
    res.status(200).json({ smpps })
  } catch (err) {
    console.error("Error fetching SMPP connectors:", err)
    res.status(500).json({ message: "Error fetching SMPP connectors", error: err.message })
  }
}

// Get all countries
exports.getAllCountries = async (_req, res) => {
  try {
    const countries = await Prefix.aggregate([
      {
        $group: {
          _id: "$Country",
          cc: { $first: "$CC" },
          mcc: { $first: "$MCC" },
        },
      },
      {
        $project: {
          _id: 0,
          country: "$_id",
          cc: 1,
          mcc: 1,
        },
      },
      { $sort: { country: 1 } },
    ])

    res.status(200).json({ countries })
  } catch (e) {
    console.error("getAllCountries:", e)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await CustomerUser.find({}, "-password")
    res.status(200).json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Failed to fetch users", error: error.message })
  }
}

// Get all routing configurations
exports.getAllRoutings = async (req, res) => {
  try {
    const routings = await Routing.find().sort({ createdAt: -1 })
    res.status(200).json({ routings })
  } catch (error) {
    console.error("Error fetching routing configurations:", error)
    res.status(500).json({ message: "Failed to fetch routing configurations", error: error.message })
  }
}

// Get routing by username
exports.getRoutingByUsername = async (req, res) => {
  try {
    const { username } = req.params
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }

    const routings = await Routing.find({ username }).sort({ createdAt: -1 })
    if (!routings || routings.length === 0) {
      return res.status(404).json({ message: "No routing configuration found for this username" })
    }

    res.status(200).json({ routings })
  } catch (error) {
    console.error("Error fetching routing by username:", error)
    res.status(500).json({ message: "Failed to fetch routing configuration", error: error.message })
  }
}

// Get all usernames that have routing configurations
exports.getUsernamesWithRouting = async (req, res) => {
  try {
    const usernames = await Routing.distinct("username")
    res.status(200).json({ usernames })
  } catch (error) {
    console.error("Error fetching usernames with routing:", error)
    res.status(500).json({ message: "Failed to fetch usernames", error: error.message })
  }
}

const generateOrder = (username, operatorName) => {
  const base = username.toLowerCase().charCodeAt(0) * 1000
  const opHash = crypto.createHash("md5").update(operatorName).digest("hex").substring(0, 4)
  const hashNum = Number.parseInt(opHash, 16) % 1000
  return base + hashNum
}

// Updated submitDefinedRoutes to handle multiple countries per username
exports.submitDefinedRoutes = async (req, res) => {
  const { username, smpp, country, countryCode, assignedRate, operators } = req.body
  console.log("Received Request:", { username, smpp, country, countryCode, assignedRate, operators })

  if (!username || !smpp || !country || !Array.isArray(operators) || operators.length === 0) {
    return res.status(400).json({ message: "Required fields missing or invalid" })
  }

  const defaultRate = validateRate(assignedRate)
  if (defaultRate === null) {
    return res.status(400).json({ message: "Invalid assigned rate. Must be a valid number greater than 0." })
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const createdFilterIds = []

  try {
    const group = `${username}_group`
    const groupfilter = `${username}_filter`
    let groupFilterExists = false

    try {
      const checkGroup = await axios.get(`${JASMIN_BASE_URL}/api/filters/${groupfilter}/`)
      if (checkGroup.status === 200 && checkGroup.data?.filter) {
        groupFilterExists = true
        console.log(`✅ GroupFilter ${groupfilter} already exists`)
      }
    } catch {
      console.log(`ℹ️ GroupFilter ${groupfilter} does not exist, will create`)
    }

    for (const operator of operators) {
      const { operator: operatorName, mnc, assignedRate: operatorAssignedRate } = operator
      const operatorRate = validateRate(operatorAssignedRate || assignedRate)

      console.log(`🔍 Processing operator: ${operatorName}, MNC: ${mnc}, Rate: ${operatorRate}`)

      if (mnc === "*") {
        console.log(`🌟 Wildcard operator detected: ${operatorName}`)
        console.log(`📞 Using country code as prefix: ${countryCode}`)

        const prefixString = countryCode.toString()
        console.log(`📋 Final prefix string for wildcard ${operatorName}: ${prefixString}`)

        const usernameInitial = username[0].toLowerCase()
        const countryInitial = country.substring(0, 2).toLowerCase()
        const hash = crypto.createHash("md5").update(`${operatorName}${country}`).digest("hex").substring(0, 4)
        const rawId = `${usernameInitial}${countryInitial}${hash}${mnc}`
        const filterId = rawId
          .replace(/[^a-z0-9]/gi, "")
          .toLowerCase()
          .substring(0, 20)

        const payload = {
          type: "DestinationAddrFilter",
          fid: filterId,
          parameter: prefixString,
        }

        console.log("Payload for Wildcard DestinationAddrFilter:", payload)

        try {
          await axios.post(`${JASMIN_BASE_URL}/api/filters/`, payload)
          console.log(`✅ Created Wildcard DestinationAddrFilter: ${filterId}`)
        } catch (err) {
          console.log(`⚠️ Wildcard Filter ${filterId} may already exist, continuing`)
        }

        createdFilterIds.push({ filterId, operatorName, operatorRate })
        await delay(500)
        continue
      }

      try {
        const prefixes = await Prefix.find({
          Country: { $regex: country, $options: "i" },
          "Operetor name": { $regex: operatorName.replace(/[()/]/g, "\\$&"), $options: "i" },
          MNC: mnc === "*" ? "*" : Number(mnc),
          Prefix: { $ne: null, $exists: true },
        }).select("Prefix")

        console.log(`🔍 Searching for prefixes with:`)
        console.log(`   Country: ${country}`)
        console.log(`   Operator: ${operatorName}`)
        console.log(`   MNC: ${mnc}`)
        console.log(`   Found ${prefixes.length} prefixes`)

        const prefixList = prefixes
          .map((p) => p.Prefix)
          .filter((prefix) => {
            const prefixStr = prefix.toString()
            return prefixStr.length >= 3 && !isNaN(prefixStr)
          })

        console.log(`📞 Valid prefixes: ${prefixList.join(", ")}`)

        if (prefixList.length === 0) {
          console.warn(`⚠️ No valid prefixes found for operator ${operatorName} with MNC ${mnc}`)

          const alternativePrefixes = await Prefix.find({
            Country: { $regex: country, $options: "i" },
            "Operetor name": { $regex: operatorName.split("(")[0].trim(), $options: "i" },
            Prefix: { $ne: null, $exists: true, $type: "string" },
          }).select("Prefix MNC")

          console.log(`🔄 Alternative search found ${alternativePrefixes.length} prefixes:`)
          alternativePrefixes.forEach((p) => console.log(`   Prefix: ${p.Prefix}, MNC: ${p.MNC}`))

          if (alternativePrefixes.length === 0) {
            continue
          }

          prefixList.push(
            ...alternativePrefixes
              .map((p) => p.Prefix)
              .filter((prefix) => {
                const prefixStr = prefix.toString()
                return prefixStr.length >= 3 && !isNaN(prefixStr)
              }),
          )
        }

        const prefixString = prefixList
          .map((prefix) => {
            const prefixStr = prefix.toString()
            const fullPrefix = prefixStr.startsWith(countryCode.toString()) ? prefixStr : `${countryCode}${prefixStr}`
            console.log(`📞 Prefix: ${prefixStr} -> Full: ${fullPrefix}`)
            return fullPrefix
          })
          .join("|")

        console.log(`📋 Final prefix string for ${operatorName}: ${prefixString}`)

        const usernameInitial = username[0].toLowerCase()
        const countryInitial = country.substring(0, 2).toLowerCase()
        const hash = crypto.createHash("md5").update(`${operatorName}${country}`).digest("hex").substring(0, 4)
        const rawId = `${usernameInitial}${countryInitial}${hash}${mnc}`
        const filterId = rawId
          .replace(/[^a-z0-9]/gi, "")
          .toLowerCase()
          .substring(0, 20)

        const payload = {
          type: "DestinationAddrFilter",
          fid: filterId,
          parameter: prefixString,
        }

        console.log("Payload for DestinationAddrFilter:", payload)

        try {
          await axios.post(`${JASMIN_BASE_URL}/api/filters/`, payload)
          console.log(`✅ Created DestinationAddrFilter: ${filterId}`)
        } catch (err) {
          console.log(`⚠️ Filter ${filterId} may already exist, continuing`)
        }

        createdFilterIds.push({ filterId, operatorName, operatorRate })
        await delay(500)
      } catch (prefixError) {
        console.log("❌ Error at: Prefix fetch", operator.operator)
        continue
      }
    }

    if (!groupFilterExists) {
      try {
        const groupPayload = {
          type: "GroupFilter",
          fid: groupfilter,
          parameter: group,
        }
        console.log("Payload for GroupFilter:", groupPayload)
        const groupResponse = await axios.post(`${JASMIN_BASE_URL}/api/filters/`, groupPayload)
        console.log(`✅ Created GroupFilter: ${groupResponse.status}`)
      } catch (err) {
        console.log("❌ Error at: GroupFilter creation", groupfilter)
        return res.status(500).json({ message: "Failed to create GroupFilter", filterId: groupfilter })
      }
    }

    for (const { filterId, operatorName, operatorRate } of createdFilterIds) {
      const order = generateOrder(username, operatorName)
      const mtRouterPayload = {
        type: "StaticMTRoute",
        order,
        rate: operatorRate,
        smppconnectors: smpp,
        filters: `${filterId},${groupfilter}`,
      }

      console.log("Payload for MTRoute:", mtRouterPayload)
      console.log(`🔍 Rate for ${operatorName} - Operator Rate: ${operatorRate}`)

      try {
        const mtResponse = await axios.post(`${JASMIN_BASE_URL}/api/mtrouters/`, qs.stringify(mtRouterPayload), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })

        if (mtResponse.status === 200) {
          console.log(`✅ Created MTRoute for ${operatorName} (${filterId}) with rate: ${operatorRate}`)
        } else {
          console.log("❌ Error at: MTRoute non-200 response", filterId)
          return res.status(500).json({ message: "Failed to create MTRoute", filterId })
        }
      } catch (err) {
        console.log("❌ Error at: MTRoute creation", filterId, err.response?.data || err.message)
        return res.status(500).json({ message: "Failed to create MTRoute", filterId })
      }

      await delay(500)
    }

    const existingRouting = await Routing.findOne({ username, country })
    let finalOperators = []

    if (existingRouting && existingRouting.operators) {
      finalOperators = [...existingRouting.operators]
      for (const newOp of operators) {
        const opRate = validateRate(newOp.assignedRate || assignedRate)
        const existingIndex = finalOperators.findIndex((op) => op.operator === newOp.operator && op.mnc == newOp.mnc)

        if (existingIndex !== -1) {
          finalOperators[existingIndex] = {
            operator: newOp.operator,
            mnc: newOp.mnc,
            rate: newOp.rate ?? null,
            mcc: newOp.mcc,
            assignedRate: opRate,
          }
        } else {
          finalOperators.push({
            operator: newOp.operator,
            mnc: newOp.mnc,
            rate: newOp.rate ?? null,
            mcc: newOp.mcc,
            assignedRate: opRate,
          })
        }
      }
    } else {
      finalOperators = operators.map((op) => ({
        operator: op.operator,
        mnc: op.mnc,
        rate: op.rate ?? null,
        mcc: op.mcc,
        assignedRate: validateRate(op.assignedRate || assignedRate),
      }))
    }

    const routingData = {
      username,
      smpp,
      country,
      countryCode: countryCode.toString(),
      groupname: group,
      assignedRate: defaultRate,
      operators: finalOperators,
    }

    await Routing.findOneAndUpdate({ username, country }, routingData, { upsert: true, new: true })

    console.log(`✅ Saved or updated routing configuration for ${username} - ${country}`)

    return res.status(200).json({
      message: "✅ Jasmin filters, MTRoutes, and DB entries created successfully",
      filtersCreated: createdFilterIds.length,
      operatorsProcessed: operators.length,
      operatorRates: createdFilterIds.map((item) => ({ operator: item.operatorName, rate: item.operatorRate })),
    })
  } catch (error) {
    console.log("❌ Error at: Final catch block", error)
    return res.status(500).json({ message: "Unexpected error" })
  }
}

// Helper function
const clean = (v) => (typeof v === "string" ? v.trim() : v)

// Add Country
exports.addCountry = async (req, res) => {
  try {
    const { Country, CC, MCC } = req.body
    if (!Country || !CC || !MCC) return res.status(400).json({ message: "Country, CC, MCC required" })

    const exists = await Prefix.findOne({
      Country: clean(Country),
      MCC: Number(MCC),
    })

    if (exists) return res.status(409).json({ message: "Country with this MCC already exists" })

    const doc = await Prefix.create({
      Country: clean(Country),
      CC: Number(CC),
      MCC: Number(MCC),
      MNC: null,
      "Operetor name": null,
      Prefix: null,
    })

    return res.status(201).json(doc)
  } catch (err) {
    console.error("addCountry:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Add Operator
exports.addOperator = async (req, res) => {
  try {
    const { Country, "Operetor name": operatorName, MNC, MCC, CC } = req.body

    if (!Country || !operatorName || !MNC || !MCC) {
      return res.status(400).json({ message: "Country, Operator name, MNC and MCC required" })
    }

    const duplicate = await Prefix.findOne({
      Country: clean(Country),
      "Operetor name": clean(operatorName),
      MNC: clean(MNC),
      Prefix: null,
    })

    if (duplicate) {
      return res.status(409).json({ message: "Operator already exists in this country with same MNC" })
    }

    const newOperator = await Prefix.create({
      Country: clean(Country),
      CC: clean(CC) || null,
      MCC: clean(MCC),
      "Operetor name": clean(operatorName),
      MNC: clean(MNC),
      Prefix: null,
    })

    return res.status(201).json({
      message: "✅ Operator added successfully",
      data: newOperator,
    })
  } catch (err) {
    console.error("addOperator error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Add Prefix
exports.addPrefix = async (req, res) => {
  try {
    const { Country, "Operetor name": operatorName, MNC, Prefix: prefixVal } = req.body
    console.log("🔍 Incoming request to add prefix:", req.body)

    if (!Country || !operatorName || !MNC || !prefixVal) {
      return res.status(400).json({ message: "Country, Operetor name, MNC, Prefix required" })
    }

    const cleanedCountry = clean(Country)
    const cleanedOperator = clean(operatorName)
    const cleanedMNC = clean(MNC)
    const cleanedPrefix = clean(prefixVal)

    const operatorExists = await Prefix.findOne({
      Country: cleanedCountry,
      "Operetor name": cleanedOperator,
      MNC: { $in: [cleanedMNC, Number.parseInt(cleanedMNC)] },
    })

    if (!operatorExists) {
      console.log("❌ Operator not found in DB:", { cleanedCountry, cleanedOperator, cleanedMNC })
      return res.status(404).json({ message: "Operator not found – add it first" })
    }

    const dup = await Prefix.findOne({
      Country: cleanedCountry,
      "Operetor name": cleanedOperator,
      MNC: { $in: [cleanedMNC, Number.parseInt(cleanedMNC)] },
      Prefix: cleanedPrefix,
    })

    if (dup) {
      console.log("⚠️ Prefix already exists:", cleanedPrefix)
      return res.status(409).json({ message: "Prefix already exists for that operator" })
    }

    const doc = await Prefix.create({
      Country: operatorExists.Country,
      CC: operatorExists.CC,
      MCC: operatorExists.MCC,
      "Operetor name": operatorExists["Operetor name"],
      MNC: operatorExists.MNC,
      Prefix: cleanedPrefix,
    })

    console.log("✅ Prefix added successfully:", doc)
    return res.status(201).json(doc)
  } catch (err) {
    console.error("❌ addPrefix error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Get country details (for prefixes)
exports.getCountryDetails = async (req, res) => {
  try {
    const { country, search = "", page = 1, limit = 10 } = req.body
    if (!country) return res.status(400).json({ message: "Country required" })

    const skip = (page - 1) * limit
    const isNumericSearch = /^\d+$/.test(search)

    const query = {
      Country: new RegExp(`^${country}$`, "i"),
      MNC: { $nin: [null, "*"] },
      $or: [
        { "Operetor name": new RegExp(search, "i") },
        ...(isNumericSearch
          ? [
              { MNC: Number(search) },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$Prefix" },
                    regex: search,
                  },
                },
              },
            ]
          : []),
      ],
    }

    const total = await Prefix.countDocuments(query)
    const rows = await Prefix.find(query)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        Prefix: 1,
        "Operetor name": 1,
      })
      .sort({ "Operetor name": 1, Prefix: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    if (!rows.length) {
      return res.status(200).json({
        page: Number(page),
        totalPages: 0,
        totalRecords: 0,
        results: [],
        message: "No records found",
      })
    }

    const result = rows.map((row) => ({
      country: row.Country,
      cc: row.CC,
      mcc: row.MCC,
      mnc: row.MNC,
      prefix: row.Prefix,
      operator: row["Operetor name"],
    }))

    return res.status(200).json({
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      results: result,
    })
  } catch (err) {
    console.error("getCountryDetails error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Get operators by country
exports.getOperatorsByCountry = async (req, res) => {
  try {
    const { country, search = "", page = 1, limit = 10 } = req.body
    if (!country) return res.status(400).json({ message: "Country required" })

    const skip = (page - 1) * limit

    const query = {
      Country: new RegExp(`^${country}$`, "i"),
      MNC: { $ne: null },
      Prefix: null,
      $or: [{ "Operetor name": new RegExp(search, "i") }, { MNC: new RegExp(search, "i") }],
    }

    const total = await Prefix.countDocuments(query)
    const operators = await Prefix.find(query)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        "Operetor name": 1,
      })
      .sort({ "Operetor name": 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    if (!operators.length && page === 1) {
      return res.status(404).json({ message: "No operators found" })
    }

    const result = operators.map((op) => ({
      country: op.Country,
      cc: op.CC,
      mcc: op.MCC,
      mnc: op.MNC,
      operator: op["Operetor name"],
    }))

    return res.status(200).json({
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      results: result,
    })
  } catch (err) {
    console.error("getOperatorsByCountry error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Get all operators (for "All" option)
exports.getAllOperators = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.body
    const skip = (page - 1) * limit
    const isNumericSearch = /^\d+$/.test(search)

    const matchQuery = {
      MNC: { $ne: null },
      Prefix: null,
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        { Country: new RegExp(search, "i") },
        ...(isNumericSearch ? [{ MNC: Number(search) }, { MCC: Number(search) }] : []),
      ]
    }

    const total = await Prefix.countDocuments(matchQuery)
    const operators = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        "Operetor name": 1,
      })
      .sort({ Country: 1, "Operetor name": 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const result = operators.map((op) => ({
      country: op.Country,
      cc: op.CC,
      mcc: op.MCC,
      mnc: op.MNC,
      operator: op["Operetor name"],
    }))

    return res.status(200).json({
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      results: result,
    })
  } catch (err) {
    console.error("getAllOperators error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Get all prefixes (for "All" option)
exports.getAllPrefixes = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.body
    const skip = (page - 1) * limit
    const isNumericSearch = /^\d+$/.test(search)

    const matchQuery = {
      MNC: { $ne: null },
      Prefix: { $ne: null },
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        { Country: new RegExp(search, "i") },
        ...(isNumericSearch
          ? [
              { MNC: Number(search) },
              { MCC: Number(search) },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$Prefix" },
                    regex: search,
                  },
                },
              },
            ]
          : []),
      ]
    }

    const total = await Prefix.countDocuments(matchQuery)
    const prefixes = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        Prefix: 1,
        "Operetor name": 1,
      })
      .sort({ Country: 1, "Operetor name": 1, Prefix: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const result = prefixes.map((prefix) => ({
      country: prefix.Country,
      cc: prefix.CC,
      mcc: prefix.MCC,
      mnc: prefix.MNC,
      prefix: prefix.Prefix,
      operator: prefix["Operetor name"],
    }))

    return res.status(200).json({
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      results: result,
    })
  } catch (err) {
    console.error("getAllPrefixes error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export Countries CSV
exports.exportCountriesCSV = async (req, res) => {
  try {
    const { search = "" } = req.body
    const matchQuery = {}

    if (search) {
      matchQuery.$or = [{ country: new RegExp(search, "i") }]
    }

    const countries = await Prefix.aggregate([
      {
        $group: {
          _id: "$Country",
          cc: { $first: "$CC" },
          mcc: { $first: "$MCC" },
        },
      },
      {
        $project: {
          _id: 0,
          country: "$_id",
          cc: 1,
          mcc: 1,
        },
      },
      { $sort: { country: 1 } },
    ])

    const filteredCountries = search
      ? countries.filter((country) => country.country.toLowerCase().includes(search.toLowerCase()))
      : countries

    const headers = ["country", "cc", "mcc"]
    const csvData = convertToCSV(filteredCountries, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=countries.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportCountriesCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export Current Countries CSV (only current page/displayed data)
exports.exportCurrentCountriesCSV = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.body

    const countries = await Prefix.aggregate([
      {
        $group: {
          _id: "$Country",
          cc: { $first: "$CC" },
          mcc: { $first: "$MCC" },
        },
      },
      {
        $project: {
          _id: 0,
          country: "$_id",
          cc: 1,
          mcc: 1,
        },
      },
      { $sort: { country: 1 } },
    ])

    let filteredCountries = search
      ? countries.filter((country) => country.country.toLowerCase().includes(search.toLowerCase()))
      : countries

    if (limit !== 999999) {
      const skip = (page - 1) * limit
      filteredCountries = filteredCountries.slice(skip, skip + Number.parseInt(limit))
    }

    const headers = ["country", "cc", "mcc"]
    const csvData = convertToCSV(filteredCountries, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=countries_current_page.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportCurrentCountriesCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export Current Operators CSV (only current page/displayed data)
exports.exportCurrentOperatorsCSV = async (req, res) => {
  try {
    const { country, search = "", page = 1, limit = 10 } = req.body

    const matchQuery = {
      MNC: { $ne: null },
      Prefix: null,
    }

    if (country && country !== "All") {
      matchQuery.Country = new RegExp(`^${country}$`, "i")
    }

    const isNumericSearch = /^\d+$/.test(search)
    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        { Country: new RegExp(search, "i") },
        ...(isNumericSearch ? [{ MNC: Number(search) }, { MCC: Number(search) }] : []),
      ]
    }

    const skip = limit === 999999 ? 0 : (page - 1) * limit
    const limitNum = limit === 999999 ? 999999 : Number.parseInt(limit)

    const operators = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        "Operetor name": 1,
      })
      .sort({ Country: 1, "Operetor name": 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const result = operators.map((op) => ({
      country: op.Country,
      operator: op["Operetor name"],
      mcc: op.MCC,
      mnc: op.MNC,
    }))

    const headers = ["country", "operator", "mcc", "mnc"]
    const csvData = convertToCSV(result, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=operators_current_page.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportCurrentOperatorsCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export Current Prefixes CSV (only current page/displayed data)
exports.exportCurrentPrefixesCSV = async (req, res) => {
  try {
    const { country, operator, mnc, search = "", page = 1, limit = 10 } = req.body

    const matchQuery = {
      MNC: { $ne: null },
      Prefix: { $ne: null },
    }

    if (country && country !== "All") {
      matchQuery.Country = new RegExp(`^${country}$`, "i")
    }

    if (operator && operator !== "All") {
      matchQuery["Operetor name"] = new RegExp(`^${operator}$`, "i")
    }

    if (mnc) {
      matchQuery.MNC = mnc
    }

    const isNumericSearch = /^\d+$/.test(search)
    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        { Country: new RegExp(search, "i") },
        ...(isNumericSearch
          ? [
              { MNC: Number(search) },
              { MCC: Number(search) },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$Prefix" },
                    regex: search,
                  },
                },
              },
            ]
          : []),
      ]
    }

    const skip = limit === 999999 ? 0 : (page - 1) * limit
    const limitNum = limit === 999999 ? 999999 : Number.parseInt(limit)

    const prefixes = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        Prefix: 1,
        "Operetor name": 1,
      })
      .sort({ Country: 1, "Operetor name": 1, Prefix: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const result = prefixes.map((prefix) => ({
      country: prefix.Country,
      operator: prefix["Operetor name"],
      cc: prefix.CC,
      mcc: prefix.MCC,
      mnc: prefix.MNC,
      prefix: prefix.Prefix,
    }))

    const headers = ["country", "operator", "cc", "mcc", "mnc", "prefix"]
    const csvData = convertToCSV(result, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=prefixes_current_page.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportCurrentPrefixesCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export Operators CSV
exports.exportOperatorsCSV = async (req, res) => {
  try {
    const { country, search = "" } = req.body
    if (!country) {
      return res.status(400).json({ message: "Country required" })
    }

    const isNumericSearch = /^\d+$/.test(search)
    const matchQuery = {
      Country: new RegExp(`^${country}$`, "i"),
      MNC: { $ne: null },
      Prefix: null,
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        ...(isNumericSearch ? [{ MNC: Number(search) }] : []),
      ]
    }

    const operators = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        "Operetor name": 1,
      })
      .sort({ "Operetor name": 1 })
      .lean()

    const result = operators.map((op) => ({
      country: op.Country,
      operator: op["Operetor name"],
      mcc: op.MCC,
      mnc: op.MNC,
    }))

    const headers = ["country", "operator", "mcc", "mnc"]
    const csvData = convertToCSV(result, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=operators.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportOperatorsCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export All Operators CSV
exports.exportAllOperatorsCSV = async (req, res) => {
  try {
    const { search = "" } = req.body
    const isNumericSearch = /^\d+$/.test(search)

    const matchQuery = {
      MNC: { $ne: null },
      Prefix: null,
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        { Country: new RegExp(search, "i") },
        ...(isNumericSearch ? [{ MNC: Number(search) }, { MCC: Number(search) }] : []),
      ]
    }

    const operators = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        "Operetor name": 1,
      })
      .sort({ Country: 1, "Operetor name": 1 })
      .lean()

    const result = operators.map((op) => ({
      country: op.Country,
      operator: op["Operetor name"],
      mcc: op.MCC,
      mnc: op.MNC,
    }))

    const headers = ["country", "operator", "mcc", "mnc"]
    const csvData = convertToCSV(result, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=all_operators.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportAllOperatorsCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export Prefixes CSV
exports.exportPrefixesCSV = async (req, res) => {
  try {
    const { country, operator, mnc, search = "" } = req.body
    if (!country) {
      return res.status(400).json({ message: "Country required" })
    }

    const isNumericSearch = /^\d+$/.test(search)
    const matchQuery = {
      Country: new RegExp(`^${country}$`, "i"),
      MNC: { $ne: null },
      Prefix: { $ne: null },
    }

    if (operator && operator !== "All") {
      matchQuery["Operetor name"] = new RegExp(`^${operator}$`, "i")
    }

    if (mnc) {
      matchQuery.MNC = mnc
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        ...(isNumericSearch
          ? [
              { MNC: Number(search) },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$Prefix" },
                    regex: search,
                  },
                },
              },
            ]
          : []),
      ]
    }

    const prefixes = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        Prefix: 1,
        "Operetor name": 1,
      })
      .sort({ "Operetor name": 1, Prefix: 1 })
      .lean()

    const result = prefixes.map((prefix) => ({
      country: prefix.Country,
      operator: prefix["Operetor name"],
      cc: prefix.CC,
      mcc: prefix.MCC,
      mnc: prefix.MNC,
      prefix: prefix.Prefix,
    }))

    const headers = ["country", "operator", "cc", "mcc", "mnc", "prefix"]
    const csvData = convertToCSV(result, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=prefixes.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportPrefixesCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Export All Prefixes CSV
exports.exportAllPrefixesCSV = async (req, res) => {
  try {
    const { search = "" } = req.body
    const isNumericSearch = /^\d+$/.test(search)

    const matchQuery = {
      MNC: { $ne: null },
      Prefix: { $ne: null },
    }

    if (search) {
      matchQuery.$or = [
        { "Operetor name": new RegExp(search, "i") },
        { Country: new RegExp(search, "i") },
        ...(isNumericSearch
          ? [
              { MNC: Number(search) },
              { MCC: Number(search) },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$Prefix" },
                    regex: search,
                  },
                },
              },
            ]
          : []),
      ]
    }

    const prefixes = await Prefix.find(matchQuery)
      .select({
        Country: 1,
        CC: 1,
        MCC: 1,
        MNC: 1,
        Prefix: 1,
        "Operetor name": 1,
      })
      .sort({ Country: 1, "Operetor name": 1, Prefix: 1 })
      .lean()

    const result = prefixes.map((prefix) => ({
      country: prefix.Country,
      operator: prefix["Operetor name"],
      cc: prefix.CC,
      mcc: prefix.MCC,
      mnc: prefix.MNC,
      prefix: prefix.Prefix,
    }))

    const headers = ["country", "operator", "cc", "mcc", "mnc", "prefix"]
    const csvData = convertToCSV(result, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=all_prefixes.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("exportAllPrefixesCSV error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Debug endpoint to check what's in the database
exports.debugPrefixes = async (req, res) => {
  try {
    const { country, operator, mnc } = req.body
    console.log(`🔍 DEBUG: Searching for prefixes`)
    console.log(`   Country: ${country}`)
    console.log(`   Operator: ${operator}`)
    console.log(`   MNC: ${mnc}`)

    // Search with exact match
    const exactMatch = await Prefix.find({
      Country: { $regex: country, $options: "i" },
      "Operetor name": { $regex: operator, $options: "i" },
      MNC: mnc === "*" ? "*" : Number(mnc),
    })
      .select("Country Operetor name MCC MNC Prefix")
      .limit(10)

    // Search with partial operator name match
    const partialMatch = await Prefix.find({
      Country: { $regex: country, $options: "i" },
      "Operetor name": { $regex: operator.split("(")[0].trim(), $options: "i" },
    })
      .select("Country Operetor name MCC MNC Prefix")
      .limit(10)

    // Search all operators in country
    const allOperators = await Prefix.find({
      Country: { $regex: country, $options: "i" },
      "Operetor name": { $ne: null },
      Prefix: null, // Only operator records
    })
      .select("Operetor name MNC")
      .limit(20)

    return res.status(200).json({
      searchCriteria: { country, operator, mnc },
      exactMatch: exactMatch,
      partialMatch: partialMatch,
      allOperatorsInCountry: allOperators,
      exactMatchCount: exactMatch.length,
      partialMatchCount: partialMatch.length,
    })
  } catch (err) {
    console.error("debugPrefixes error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// Download sample rates CSV template
exports.downloadSampleRatesCSV = async (req, res) => {
  try {
    // Sample data for the CSV template
    const sampleData = [
      {
        MCC: 404,
        MNC: 1,
        rate: 0.015,
        label: "Airtel India",
      },
      {
        MCC: 404,
        MNC: 2,
        rate: 0.0145,
        label: "Vodafone India",
      },
      {
        MCC: 404,
        MNC: 3,
        rate: 0.014,
        label: "Jio India",
      },
      {
        MCC: 404,
        MNC: 4,
        rate: 0.0155,
        label: "BSNL India",
      },
      {
        MCC: 404,
        MNC: 5,
        rate: 0.0148,
        label: "Idea India",
      },
    ]

    const headers = ["MCC", "MNC", "rate", "label"]
    const csvData = convertToCSV(sampleData, headers)

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=sample_rates_template.csv")
    res.status(200).send(csvData)
  } catch (err) {
    console.error("downloadSampleRatesCSV error:", err)
    return res.status(500).json({ message: "Error generating sample CSV" })
  }
}
