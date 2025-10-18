const axios = require("axios")
const CreditHistory = require("../models/CreditHistory")

// Get user balance from Jasmin API
exports.getUserBalance = async (req, res) => {
  try {
    const response = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/`, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })

    if (response.status === 200) {
      const users = response.data.users || []
      const userBalances = users.map((user) => ({
        username: user.username,
        balance: user.mt_messaging_cred?.quota?.balance || "0",
      }))

      res.status(200).json({ users: userBalances })
    } else {
      res.status(500).json({ error: "Failed to fetch user balances" })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user balances",
      details: error.response?.data || error.message,
    })
  }
}

// Get credit history for a specific user
exports.getCreditHistory = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({ error: "Username is required" })
    }

    const history = await CreditHistory.find({ username }).sort({ createdAt: -1 }).limit(100) // Limit to last 100 transactions

    res.status(200).json({ history })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch credit history",
      details: error.message,
    })
  }
}

// Add credit to user
exports.addCredit = async (req, res) => {
  try {
    const { username, creditAmount, description } = req.body

    if (!username || !creditAmount) {
      return res.status(400).json({ error: "Username and credit amount are required" })
    }

    // First, check if user exists by getting all users and finding the specific one
    const allUsersResponse = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/`, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })

    if (allUsersResponse.status !== 200) {
      return res.status(500).json({ error: "Failed to fetch users from Jasmin" })
    }

    const users = allUsersResponse.data.users || []
    const targetUser = users.find((user) => user.username === username || user.uid === username)

    if (!targetUser) {
      return res.status(404).json({
        error: "User not found in Jasmin",
        details: `User '${username}' does not exist in the Jasmin system. Available users: ${users.map((u) => u.username).join(", ")}`,
      })
    }

    // Use the correct identifier (uid) for the API call
    const userIdentifier = targetUser.uid || targetUser.username

    // Get current balance from the found user
    const currentBalance = Number.parseFloat(targetUser.mt_messaging_cred?.quota?.balance || 0)
    const newBalance = currentBalance + Number.parseFloat(creditAmount)

    // Update balance in Jasmin using the correct user identifier
    const updates = [["mt_messaging_cred", "quota", "balance", newBalance.toString()]]

    const updateResponse = await axios.patch(`${process.env.JASMIN_BASE_URL}/api/users/${userIdentifier}/`, updates, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })

    if (updateResponse.status === 200) {
      // Save transaction history in MongoDB
      const creditHistory = new CreditHistory({
        username: targetUser.username, // Use the actual username from Jasmin
        transactionType: "credit_added",
        previousBalance: currentBalance,
        amountAdded: Number.parseFloat(creditAmount),
        newBalance,
        description: description || `Credit added by admin`,
        addedBy: req.user.username || req.user.id,
        addedByRole: req.user.role,
      })

      await creditHistory.save()

      res.status(200).json({
        message: "Credit added successfully",
        previousBalance: currentBalance,
        amountAdded: Number.parseFloat(creditAmount),
        newBalance,
        transaction: creditHistory,
        userInfo: {
          username: targetUser.username,
          uid: targetUser.uid,
          gid: targetUser.gid,
        },
      })
    } else {
      res.status(500).json({ error: "Failed to update balance in Jasmin" })
    }
  } catch (error) {
    console.error("Credit addition error:", error.response?.data || error.message)
    res.status(500).json({
      error: "Failed to add credit",
      details: error.response?.data || error.message,
    })
  }
}

// Get all users for dropdown
exports.getAllUsers = async (req, res) => {
  try {
    const response = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/`, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })

    if (response.status === 200) {
      const users = response.data.users || []
      const userList = users.map((user) => ({
        username: user.username,
        uid: user.uid,
        gid: user.gid,
        balance: user.mt_messaging_cred?.quota?.balance || "0",
        status: user.status || "unknown",
      }))

      console.log(
        "Available users:",
        userList.map((u) => `${u.username} (${u.uid})`),
      )

      res.status(200).json({ users: userList })
    } else {
      res.status(500).json({ error: "Failed to fetch users" })
    }
  } catch (error) {
    console.error("Get users error:", error.response?.data || error.message)
    res.status(500).json({
      error: "Failed to fetch users",
      details: error.response?.data || error.message,
    })
  }
}
