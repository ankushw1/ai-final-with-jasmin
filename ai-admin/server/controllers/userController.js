const axios = require("axios")
const CreditHistory = require("../models/CreditHistory")
const UserUpdateHistory = require("../models/UserUpdateHistory")
const CustomerUserProfile = require("../models/CustomerUserProfile")
const { listUsers, enableUser: enableJasminUser, disableUser: disableJasminUser, updateUserPermissions: updateJasminPermissions, updateUserBalance: updateJasminBalance } = require('../utils/jasminWrapper')

const AUTH_HEADER = {
  headers: {
    Authorization: "Basic cm9vdDpuZXR3YXJlNA==",
  },
}

exports.getUsers = async (req, res) => {
  try {
    // Use Python script to get users from Jasmin
    const result = await listUsers()
    
    if (result.success) {
      // Users already have proper format from Python script
      res.status(200).json({ users: result.users })
    } else {
      res.status(500).json({ error: "Failed to fetch users", details: result.error })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users", details: error.message })
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

  // Build permissions object for Python script
  const permissions = {}
  if (http_send !== undefined) permissions['http_send'] = http_send
  if (dlr_method !== undefined) permissions['dlr_method'] = dlr_method
  if (http_balance !== undefined) permissions['http_balance'] = http_balance
  if (smpps_send !== undefined) permissions['smpps_send'] = smpps_send
  if (priority !== undefined) permissions['priority'] = priority
  if (long_content !== undefined) permissions['http_long_content'] = long_content
  if (src_addr !== undefined) permissions['src_addr'] = src_addr
  if (dlr_level !== undefined) permissions['dlr_level'] = dlr_level
  if (http_rate !== undefined) permissions['http_rate'] = http_rate
  if (valid_period !== undefined) permissions['validity_period'] = valid_period
  if (http_bulk !== undefined) permissions['http_bulk'] = http_bulk
  if (hex_content !== undefined) permissions['hex_content'] = hex_content

  if (Object.keys(permissions).length === 0) {
    return res.status(400).json({ error: "No valid permissions to update" })
  }

  try {
    // Use Python script to update permissions
    const result = await updateJasminPermissions(user_name, permissions)
    
    if (result.success) {
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
      rawJasminResponse: result,
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

      res.status(200).json({ message: "Permissions updated successfully", data: result })
    } else {
      res.status(500).json({ error: "Failed to update permissions", details: result.error })
    }
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

  // Filter valid balance parameters
  const balanceData = {}
  Object.keys(params).forEach((key) => {
    if (key.startsWith("balance_") || key.startsWith("http_tput") || key.startsWith("smpp_tput")) {
      balanceData[key] = params[key]
    }
  })

  if (Object.keys(balanceData).length === 0) {
    return res.status(400).json({ error: "No valid balance settings to update" })
  }

  try {
    // Use Python script to update balance
    const result = await updateJasminBalance(user_name, balanceData)
    
    if (result.success) {
      const balanceData = {
        previousBalance: 0, // We'll need to get this from user details if needed
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
      rawJasminResponse: result,
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

      res.status(200).json({ message: "Balance updated successfully", data: result })
    } else {
      res.status(500).json({ error: "Failed to update balance", details: result.error })
    }
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
    // Use Python script to enable user
    const result = await enableJasminUser(uid)
    
    if (result.success) {
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
        rawJasminResponse: result,
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

      res.status(200).json({ message: "User enabled successfully", data: result })
    } else {
      res.status(500).json({ error: "Failed to enable user", details: result.error })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to enable user",
      details: error.message,
    })
  }
}

exports.disableUser = async (req, res) => {
  const { uid } = req.params

  if (!uid) {
    return res.status(400).json({ error: "Missing required path parameter: uid" })
  }

  try {
    // Use Python script to disable user
    const result = await disableJasminUser(uid)
    
    if (result.success) {
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
        rawJasminResponse: result,
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

      res.status(200).json({ message: "User disabled successfully", data: result })
    } else {
      res.status(500).json({ error: "Failed to disable user", details: result.error })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to disable user",
      details: error.message,
    })
  }
}
