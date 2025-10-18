const UserUpdateHistory = require("../models/UserUpdateHistory")
const CustomerUserProfile = require("../models/CustomerUserProfile")
const axios = require("axios") // Import axios

// Get user update history
exports.getUserUpdateHistory = async (req, res) => {
  try {
    const { username } = req.params
    const { page = 0, pageSize = 10, updateType } = req.query

    const skip = Number.parseInt(page) * Number.parseInt(pageSize)
    const limit = Number.parseInt(pageSize)

    const filter = {}
    if (username) {
      filter.username = username
    }
    if (updateType) {
      filter.updateType = updateType
    }

    const history = await UserUpdateHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const totalHistory = await UserUpdateHistory.countDocuments(filter)

    res.status(200).json({
      history,
      total: totalHistory,
      page: Number.parseInt(page),
      pageSize: Number.parseInt(pageSize),
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user update history",
      details: error.message,
    })
  }
}

// Get user profile with current settings
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params

    const profile = await CustomerUserProfile.findOne({ username })

    if (!profile) {
      return res.status(404).json({ error: "User profile not found" })
    }

    res.status(200).json({ profile })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user profile",
      details: error.message,
    })
  }
}

// Get all user profiles with pagination
exports.getAllUserProfiles = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search = "" } = req.query

    const skip = Number.parseInt(page) * Number.parseInt(pageSize)
    const limit = Number.parseInt(pageSize)

    const filter = {}
    if (search) {
      filter.$or = [{ username: { $regex: search, $options: "i" } }, { usid: { $regex: search, $options: "i" } }]
    }

    const profiles = await CustomerUserProfile.find(filter).sort({ lastSyncWithJasmin: -1 }).skip(skip).limit(limit)

    const totalProfiles = await CustomerUserProfile.countDocuments(filter)

    res.status(200).json({
      profiles,
      total: totalProfiles,
      page: Number.parseInt(page),
      pageSize: Number.parseInt(pageSize),
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user profiles",
      details: error.message,
    })
  }
}

// Sync user data from Jasmin to MongoDB
exports.syncUserFromJasmin = async (req, res) => {
  try {
    const { username } = req.params

    // Fetch user data from Jasmin
    const response = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/${username}/`, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })

    if (response.status === 200) {
      const userData = response.data
      const quota = userData.mt_messaging_cred?.quota || {}
      const auth = userData.mt_messaging_cred?.authorization || {}

      // Update or create user profile
      const profile = await CustomerUserProfile.findOneAndUpdate(
        { username },
        {
          $set: {
            usid: userData.uid,
            groupname: userData.gid,
            "currentBalance.balance": Number.parseFloat(quota.balance || 0),
            "currentBalance.smsCount": Number.parseFloat(quota.sms_count || 0),
            "currentBalance.earlyPercent": Number.parseFloat(quota.early_percent || 0),
            "currentBalance.httpThroughput": Number.parseFloat(quota.http_throughput || 0),
            "currentBalance.smppsThroughput": Number.parseFloat(quota.smpps_throughput || 0),
            "currentBalance.lastUpdated": new Date(),
            "currentPermissions.httpSend": auth.http_send === "True",
            "currentPermissions.dlrMethod": auth.http_dlr_method === "True",
            "currentPermissions.httpBalance": auth.http_balance === "True",
            "currentPermissions.smppsSend": auth.smpps_send === "True",
            "currentPermissions.priority": auth.priority === "True",
            "currentPermissions.longContent": auth.http_long_content === "True",
            "currentPermissions.srcAddr": auth.src_addr === "True",
            "currentPermissions.dlrLevel": auth.dlr_level === "True",
            "currentPermissions.httpRate": auth.http_rate === "True",
            "currentPermissions.validPeriod": auth.validity_period === "True",
            "currentPermissions.httpBulk": auth.http_bulk === "True",
            "currentPermissions.hexContent": auth.hex_content === "True",
            "currentPermissions.lastUpdated": new Date(),
            "currentStatus.status": userData.status || "enabled",
            "currentStatus.lastUpdated": new Date(),
            lastSyncWithJasmin: new Date(),
          },
        },
        { upsert: true, new: true },
      )

      res.status(200).json({
        message: "User synced successfully",
        profile,
      })
    } else {
      res.status(404).json({ error: "User not found in Jasmin" })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to sync user from Jasmin",
      details: error.response?.data || error.message,
    })
  }
}
