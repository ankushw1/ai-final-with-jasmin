const mongoose = require("mongoose")
const axios = require("axios")
const CreditHistory = require("../models/CreditHistory")

// Load the Jasmin API base URL from .env
const JASMIN_API_URL = process.env.JASMIN_URL
const customerUserCollection = mongoose.connection.collection("customerusers")

exports.getBalance = async (req, res) => {
  try {
    const username = req.user.username // Extract username from JWT

    // Fetch user credentials from DB
    const userRecord = await customerUserCollection.findOne({ username })

    if (!userRecord) {
      return res.status(404).json({ message: "User not found in customerusers." })
    }

    const jasminUsername = userRecord.username
    const jasminPassword = userRecord.password

    // Call Jasmin HTTP API balance endpoint using query params
    const response = await axios.get(`${JASMIN_API_URL}/balance`, {
      params: {
        username: jasminUsername,
        password: jasminPassword,
      },
    })

    const { balance } = response.data

    // Return balance
    res.json({
      balance,
    })
  } catch (error) {
    console.error("Error fetching balance:", error?.response?.data || error.message)
    res.status(500).json({ error: "Failed to fetch balance" })
  }
}

exports.getCreditHistory = async (req, res) => {
  try {
    const username = req.user.username // Extract username from JWT
    const { page = 0, pageSize = 10, search = "" } = req.query

    const skip = Number.parseInt(page) * Number.parseInt(pageSize)
    const limit = Number.parseInt(pageSize)

    // Build filter for the user's credit history
    const filter = { username }

    // Add search functionality if search term is provided
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { transactionType: { $regex: search, $options: "i" } },
      ]
    }

    // Fetch credit history with pagination, sorted by latest first
    const history = await CreditHistory.find(filter)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .select("transactionType previousBalance amountAdded newBalance description createdAt") // Only select needed fields

    const totalHistory = await CreditHistory.countDocuments(filter)

    res.status(200).json({
      history,
      total: totalHistory,
      page: Number.parseInt(page),
      pageSize: Number.parseInt(pageSize),
    })
  } catch (error) {
    console.error("Error fetching credit history:", error.message)
    res.status(500).json({
      error: "Failed to fetch credit history",
      details: error.message,
    })
  }
}
