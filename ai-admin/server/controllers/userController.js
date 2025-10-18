const axios = require("axios")
const CreditHistory = require("../models/CreditHistory")
const UserUpdateHistory = require("../models/UserUpdateHistory")
const CustomerUserProfile = require("../models/CustomerUserProfile")

const AUTH_HEADER = {
  headers: {
    Authorization: "Basic cm9vdDpuZXR3YXJlNA==",
  },
}

exports.getUsers = async (req, res) => {
  try {
    const response = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/`, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })

    if (response.status === 200) {
      res.status(200).json(response.data)
    } else {
      res.status(500).json({ error: "Failed to fetch users" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users", details: error.response?.data || error.message })
  }
}

exports.addUser = async (req, res) => {
  const { usid, groupname, username, password } = req.query

  if (!usid || !groupname || !username || !password) {
    return res.status(400).json({ error: "Missing required query parameters" })
  }

  try {
    const response = await axios.get(`http://185.169.252.75:9494/add_user`, {
      ...AUTH_HEADER,
      params: { usid, groupname, username, password },
    })

    if (response.status === 200) {
      res.status(200).json(response.data)
    } else {
      res.status(500).json({ error: "Failed to add user" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to add user", details: error.response?.data || error.message })
  }
}

exports.deleteUser = async (req, res) => {
  const { user_name } = req.query

  if (!user_name) {
    return res.status(400).json({ error: "Missing required query parameter: user_name" })
  }

  try {
    const response = await axios.delete("http://185.169.252.75:9494/delete_user", {
      ...AUTH_HEADER,
      params: { user_name },
    })

    if (response.status === 200) {
      res.status(200).json(response.data)
    } else {
      res.status(500).json({ error: "Failed to delete user" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user", details: error.response?.data || error.message })
  }
}

exports.addPermissions = async (req, res) => {
  const {
    user_name,
    http_send,
    dlr_method,
    http_balance,
    smpps_send,
    priority,
    long_content,
    src_addr,
    dlr_level,
    http_rate,
    valid_period,
    http_bulk,
    hex_content,
  } = req.query

  if (!user_name) {
    return res.status(400).json({ error: "Missing required query parameter: user_name" })
  }

  const updates = []

  if (http_send !== undefined) updates.push(["mt_messaging_cred", "authorization", "http_send", http_send])
  if (dlr_method !== undefined) updates.push(["mt_messaging_cred", "authorization", "dlr_method", dlr_method])
  if (http_balance !== undefined) updates.push(["mt_messaging_cred", "authorization", "http_balance", http_balance])
  if (smpps_send !== undefined) updates.push(["mt_messaging_cred", "authorization", "smpps_send", smpps_send])
  if (priority !== undefined) updates.push(["mt_messaging_cred", "authorization", "priority", priority])
  if (long_content !== undefined)
    updates.push(["mt_messaging_cred", "authorization", "http_long_content", long_content])
  if (src_addr !== undefined) updates.push(["mt_messaging_cred", "authorization", "src_addr", src_addr])
  if (dlr_level !== undefined) updates.push(["mt_messaging_cred", "authorization", "dlr_level", dlr_level])
  if (http_rate !== undefined) updates.push(["mt_messaging_cred", "authorization", "http_rate", http_rate])
  if (valid_period !== undefined) updates.push(["mt_messaging_cred", "authorization", "validity_period", valid_period])
  if (http_bulk !== undefined) updates.push(["mt_messaging_cred", "authorization", "http_bulk", http_bulk])
  if (hex_content !== undefined) updates.push(["mt_messaging_cred", "authorization", "hex_content", hex_content])

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid permissions to update" })
  }

  const payload = updates

  try {
    const response = await axios.patch(`${process.env.JASMIN_BASE_URL}/api/users/${user_name}/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const permissionsData = {
      httpSend: http_send === "1",
      dlrMethod: dlr_method === "1",
      httpBalance: http_balance === "1",
      smppsSend: smpps_send === "1",
      priority: priority === "1",
      longContent: long_content === "1",
      srcAddr: src_addr === "1",
      dlrLevel: dlr_level === "1",
      httpRate: http_rate === "1",
      validPeriod: valid_period === "1",
      httpBulk: http_bulk === "1",
      hexContent: hex_content === "1",
    }

    const updateHistory = new UserUpdateHistory({
      username: user_name,
      uid: user_name,
      updateType: "permissions_update",
      permissionsData,
      description: "Permissions updated via admin panel",
      updatedBy: req.user?.username || req.user?.id || "admin",
      updatedByRole: req.user?.role || 1,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      rawJasminResponse: response.data,
      rawRequestData: req.query,
    })

    await updateHistory.save()

    // Update user profile using username as primary key
    const updateData = {
      usid: user_name, // Set usid if available
      "currentPermissions.httpSend": http_send === "1",
      "currentPermissions.dlrMethod": dlr_method === "1",
      "currentPermissions.httpBalance": http_balance === "1",
      "currentPermissions.smppsSend": smpps_send === "1",
      "currentPermissions.priority": priority === "1",
      "currentPermissions.longContent": long_content === "1",
      "currentPermissions.srcAddr": src_addr === "1",
      "currentPermissions.dlrLevel": dlr_level === "1",
      "currentPermissions.httpRate": http_rate === "1",
      "currentPermissions.validPeriod": valid_period === "1",
      "currentPermissions.httpBulk": http_bulk === "1",
      "currentPermissions.hexContent": hex_content === "1",
      "currentPermissions.lastUpdated": new Date(),
      lastSyncWithJasmin: new Date(),
    }

    await CustomerUserProfile.findOneAndUpdate(
      { username: user_name },
      {
        $set: updateData,
        $inc: { totalUpdates: 1 },
      },
      { upsert: true, new: true },
    )

    res.status(200).json({ message: "Permissions updated", data: response.data })
  } catch (error) {
    const failedUpdate = new UserUpdateHistory({
      username: user_name,
      uid: user_name,
      updateType: "permissions_update",
      description: `Failed permissions update: ${error.message}`,
      updatedBy: req.user?.username || req.user?.id || "admin",
      updatedByRole: req.user?.role || 1,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      rawRequestData: req.query,
    })

    await failedUpdate.save().catch(() => {})

    res.status(500).json({
      error: "Failed to update permissions",
      details: error.response?.data || error.message,
    })
  }
}

exports.addUserBalance = async (req, res) => {
  const { user_name, ...params } = req.query

  if (!user_name) {
    return res.status(400).json({ error: "Missing required query parameter: user_name" })
  }

  // Get current balance before update
  let previousBalance = 0
  try {
    const currentUserResponse = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/${user_name}/`, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
      },
    })
    previousBalance = Number.parseFloat(currentUserResponse.data.mt_messaging_cred?.quota?.balance || 0)
  } catch (error) {
    console.log("Could not fetch current balance:", error.message)
  }

  // Convert params to a list of updates in the required format
  const updates = []

  Object.keys(params).forEach((key) => {
    if (key.startsWith("balance_") || key.startsWith("http_tput") || key.startsWith("smpp_tput")) {
      if (key === "balance_amt") {
        updates.push(["mt_messaging_cred", "quota", "balance", params[key]])
      } else if (key === "balance_sms") {
        updates.push(["mt_messaging_cred", "quota", "sms_count", params[key]])
      } else if (key === "balance_percent") {
        updates.push(["mt_messaging_cred", "quota", "early_percent", params[key]])
      } else if (key === "http_tput") {
        updates.push(["mt_messaging_cred", "quota", "http_throughput", params[key]])
      } else if (key === "smpp_tput") {
        updates.push(["mt_messaging_cred", "quota", "smpps_throughput", params[key]])
      }
    }
  })

  const payload = updates

  try {
    const response = await axios.patch(`${process.env.JASMIN_BASE_URL}/api/users/${user_name}/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const balanceData = {
      previousBalance,
      newBalance: Number.parseFloat(params.balance_amt || 0),
      balanceSms: Number.parseFloat(params.balance_sms || 0),
      balancePercent: Number.parseFloat(params.balance_percent || 0),
      httpThroughput: Number.parseFloat(params.http_tput || 0),
      smppThroughput: Number.parseFloat(params.smpp_tput || 0),
    }

    const updateHistory = new UserUpdateHistory({
      username: user_name,
      uid: user_name,
      updateType: "balance_update",
      balanceData,
      description: "Balance updated via admin panel",
      updatedBy: req.user?.username || req.user?.id || "admin",
      updatedByRole: req.user?.role || 1,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      rawJasminResponse: response.data,
      rawRequestData: req.query,
    })

    await updateHistory.save()

    // Update user profile using username as primary key
    const updateData = {
      usid: user_name, // Set usid if available
      "currentBalance.balance": Number.parseFloat(params.balance_amt || 0),
      "currentBalance.smsCount": Number.parseFloat(params.balance_sms || 0),
      "currentBalance.earlyPercent": Number.parseFloat(params.balance_percent || 0),
      "currentBalance.httpThroughput": Number.parseFloat(params.http_tput || 0),
      "currentBalance.smppsThroughput": Number.parseFloat(params.smpp_tput || 0),
      "currentBalance.lastUpdated": new Date(),
      lastSyncWithJasmin: new Date(),
    }

    await CustomerUserProfile.findOneAndUpdate(
      { username: user_name },
      {
        $set: updateData,
        $inc: { totalUpdates: 1 },
      },
      { upsert: true, new: true },
    )

    res.status(200).json({ message: "Balance updated", data: response.data })
  } catch (error) {
    const failedUpdate = new UserUpdateHistory({
      username: user_name,
      uid: user_name,
      updateType: "balance_update",
      description: `Failed balance update: ${error.message}`,
      updatedBy: req.user?.username || req.user?.id || "admin",
      updatedByRole: req.user?.role || 1,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      rawRequestData: req.query,
    })

    await failedUpdate.save().catch(() => {})

    res.status(500).json({
      error: "Failed to update balance",
      details: error.response?.data || error.message,
    })
  }
}

exports.addOnlyUserBalance = async (req, res) => {
  const { user_name, balance_amt } = req.query

  if (!user_name || !balance_amt) {
    return res.status(400).json({ error: "Missing required query parameter: user_name or balance_amt" })
  }

  const updates = [["mt_messaging_cred", "quota", "balance", balance_amt]]
  const payload = updates

  try {
    const response = await axios.patch(`${process.env.JASMIN_BASE_URL}/api/users/${user_name}/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const creditHistory = new CreditHistory({
      username: user_name,
      transactionType: "balance_updated",
      previousBalance: 0,
      amountAdded: 0,
      newBalance: Number.parseFloat(balance_amt),
      description: "Balance updated via admin panel",
      addedBy: req.user?.username || req.user?.id || "admin",
      addedByRole: req.user?.role || 1,
    })

    await creditHistory.save()

    res.status(200).json({ message: "Balance updated", data: response.data })
  } catch (error) {
    res.status(500).json({
      error: "Failed to update balance",
      details: error.response?.data || error.message,
    })
  }
}

exports.enableUser = async (req, res) => {
  const { uid } = req.params

  if (!uid) {
    return res.status(400).json({ error: "Missing required path parameter: uid" })
  }

  try {
    const response = await axios.put(`${process.env.JASMIN_BASE_URL}/api/users/${uid}/enable/`, null, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 200) {
      const updateHistory = new UserUpdateHistory({
        username: uid,
        uid: uid,
        updateType: "status_change",
        statusData: {
          previousStatus: "disabled",
          newStatus: "enabled",
        },
        description: "User enabled via admin panel",
        updatedBy: req.user?.username || req.user?.id || "admin",
        updatedByRole: req.user?.role || 1,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
        rawJasminResponse: response.data,
      })

      await updateHistory.save()

      await CustomerUserProfile.findOneAndUpdate(
        { username: uid },
        {
          $set: {
            usid: uid,
            "currentStatus.status": "enabled",
            "currentStatus.lastUpdated": new Date(),
            lastSyncWithJasmin: new Date(),
          },
          $inc: { totalUpdates: 1 },
        },
        { upsert: true, new: true },
      )

      res.status(200).json({ message: "User enabled successfully", data: response.data })
    } else {
      res.status(500).json({ error: "Failed to enable user" })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to enable user",
      details: error.response?.data || error.message,
    })
  }
}

exports.disableUser = async (req, res) => {
  const { uid } = req.params

  if (!uid) {
    return res.status(400).json({ error: "Missing required path parameter: uid" })
  }

  try {
    const response = await axios.put(`${process.env.JASMIN_BASE_URL}/api/users/${uid}/disable/`, null, {
      headers: {
        Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 200) {
      const updateHistory = new UserUpdateHistory({
        username: uid,
        uid: uid,
        updateType: "status_change",
        statusData: {
          previousStatus: "enabled",
          newStatus: "disabled",
        },
        description: "User disabled via admin panel",
        updatedBy: req.user?.username || req.user?.id || "admin",
        updatedByRole: req.user?.role || 1,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
        rawJasminResponse: response.data,
      })

      await updateHistory.save()

      await CustomerUserProfile.findOneAndUpdate(
        { username: uid },
        {
          $set: {
            usid: uid,
            "currentStatus.status": "disabled",
            "currentStatus.lastUpdated": new Date(),
            lastSyncWithJasmin: new Date(),
          },
          $inc: { totalUpdates: 1 },
        },
        { upsert: true, new: true },
      )

      res.status(200).json({ message: "User disabled successfully", data: response.data })
    } else {
      res.status(500).json({ error: "Failed to disable user" })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to disable user",
      details: error.response?.data || error.message,
    })
  }
}
