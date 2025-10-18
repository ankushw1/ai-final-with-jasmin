const Customer = require("../models/Customer")
const Sms = require("../models/smsModal")
const SMPP = require("../models/smpp")
const mongoose = require("mongoose")
const axios = require("axios")

// Helper function to deduplicate DLR records by message ID
const deduplicateDlrRecords = (records) => {
  const uniqueRecords = new Map()
  records.forEach((record) => {
    const messageId = record.data.id
    if (!uniqueRecords.has(messageId)) {
      uniqueRecords.set(messageId, record)
    }
  })
  return Array.from(uniqueRecords.values())
}

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    console.log("Dashboard stats API called by user:", req.user)
    const { filter = "last24hours", startDate, endDate } = req.query

    // Calculate date range based on filter
    let dateStart, dateEnd
    const now = new Date()

    if (filter === "custom" && startDate && endDate) {
      dateStart = new Date(startDate)
      dateEnd = new Date(endDate)
    } else {
      switch (filter) {
        case "last1hour":
          dateStart = new Date(now.getTime() - 60 * 60 * 1000)
          dateEnd = now
          break
        case "last2hours":
          dateStart = new Date(now.getTime() - 2 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last6hours":
          dateStart = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last12hours":
          dateStart = new Date(now.getTime() - 12 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last24hours":
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "today":
          dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case "thisweek":
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          dateStart = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
          dateEnd = new Date()
          break
        case "thismonth":
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateEnd = new Date()
          break
        default:
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          dateEnd = now
      }
    }

    console.log("Date range:", { dateStart, dateEnd })

    // Build SMS query based on user role
    const smsQuery = {
      sentAt: { $gte: dateStart, $lte: dateEnd },
    }

    // If customer, only show their SMS
    if (req.user.role === 3) {
      smsQuery.customer = req.user._id
    }

    console.log("SMS Query:", smsQuery)

    // Get SMS records for the date range - populate customer info
    const smsRecords = await Sms.find(smsQuery).populate("customer", "username primaryEmail credits companyName")

    console.log("Found SMS records:", smsRecords.length)

    // Extract provider response IDs for DLR lookup
    const providerResponseIds = smsRecords.map((sms) => sms.providerResponse?.id).filter(Boolean)

    console.log("Provider response IDs:", providerResponseIds.length)

    // Get DLR data from dlrlevel2 collection and deduplicate
    let dlrRecords = []
    if (providerResponseIds.length > 0) {
      const dlrDatasCollection = mongoose.connection.collection("dlrlevel2")
      const rawDlrRecords = await dlrDatasCollection
        .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
        .toArray()

      // Deduplicate DLR records
      dlrRecords = deduplicateDlrRecords(rawDlrRecords)
    }

    console.log("DLR records found (after deduplication):", dlrRecords.length)

    // Create DLR map for quick lookup
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    // Count statuses based on DLR data (actual delivery status)
    let deliveredCount = 0
    let rejectedCount = 0
    let undeliveredCount = 0
    let pendingCount = 0

    smsRecords.forEach((sms) => {
      const providerId = sms.providerResponse?.id
      const dlr = providerId ? dlrDataMap[providerId] : null

      if (dlr && dlr.message_status) {
        const dlrStatus = dlr.message_status.toUpperCase()
        switch (dlrStatus) {
          case "DELIVRD":
            deliveredCount++
            break
          case "REJECTD":
            rejectedCount++
            break
          case "UNDELIV":
            undeliveredCount++
            break
          default:
            pendingCount++
            break
        }
      } else {
        // No DLR data means still pending
        pendingCount++
      }
    })

    const totalMessages = smsRecords.length
    const totalSent = deliveredCount + rejectedCount + undeliveredCount

    console.log("Status counts based on DLR:", {
      totalMessages,
      deliveredCount,
      rejectedCount,
      undeliveredCount,
      pendingCount,
    })

    // Get user stats - ONLY users who sent messages in the selected time period
    let userStatsQuery = {}
    if (req.user.role === 2) {
      // Reseller can see their customers
      userStatsQuery = { createdByReseller: req.user._id }
    } else if (req.user.role === 3) {
      // Customer can only see themselves
      userStatsQuery = { _id: req.user._id }
    } else if (req.user.role === 4) {
      // Account manager can see assigned customers
      userStatsQuery = { assignedAccountManager: req.user._id }
    }

    // Get unique customer IDs who sent messages in the time period
    const activeCustomerIds = smsRecords
      .filter((sms) => sms.customer && sms.customer._id)
      .map((sms) => sms.customer._id.toString())

    const uniqueActiveCustomerIds = [...new Set(activeCustomerIds)]

    console.log("Active customer IDs:", uniqueActiveCustomerIds)

    let userStats = []
    if (uniqueActiveCustomerIds.length > 0) {
      // Get customer details and their SMS counts
      const customers = await Customer.find({
        ...userStatsQuery,
        _id: { $in: uniqueActiveCustomerIds.map((id) => new mongoose.Types.ObjectId(id)) },
      }).select("username primaryEmail credits companyName")

      // Calculate stats for each customer based on DLR data
      userStats = customers
        .map((customer) => {
          const customerSms = smsRecords.filter(
            (sms) => sms.customer && sms.customer._id.toString() === customer._id.toString(),
          )

          const submitted = customerSms.length

          // Count delivered based on DLR status
          const delivered = customerSms.filter((sms) => {
            const providerId = sms.providerResponse?.id
            const dlr = providerId ? dlrDataMap[providerId] : null
            return dlr && dlr.message_status && dlr.message_status.toUpperCase() === "DELIVRD"
          }).length

          // Count pending (no DLR or DLR without final status)
          const pending = customerSms.filter((sms) => {
            const providerId = sms.providerResponse?.id
            const dlr = providerId ? dlrDataMap[providerId] : null

            if (!dlr || !dlr.message_status) {
              return true // No DLR = pending
            }

            const dlrStatus = dlr.message_status.toUpperCase()
            return !["DELIVRD", "REJECTD", "UNDELIV"].includes(dlrStatus)
          }).length

          return {
            _id: customer._id,
            username: customer.username,
            primaryEmail: customer.primaryEmail,
            creditsRemaining: customer.credits || 0,
            companyName: customer.companyName,
            submitted,
            delivered,
            pending,
          }
        })
        .filter((stat) => stat.submitted > 0)
        .sort((a, b) => b.submitted - a.submitted)
        .slice(0, 20)
    }

    console.log("User stats found:", userStats.length)

    // Fetch Jasmin balances for all users
    try {
      const jasminResponse = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/`, {
        headers: {
          Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
        },
        timeout: 5000,
      })

      if (jasminResponse.status === 200) {
        const jasminUsers = jasminResponse.data.users || []
        // Add Jasmin balance to each user stat
        userStats = userStats.map((userStat) => {
          const jasminUser = jasminUsers.find((ju) => ju.username === userStat.username)
          return {
            ...userStat,
            jasminBalance: jasminUser?.mt_messaging_cred?.quota?.balance || "0",
          }
        })
      }
    } catch (jasminError) {
      console.log("Could not fetch Jasmin balances for dashboard:", jasminError.message)
      // Add default jasminBalance to all users
      userStats = userStats.map((userStat) => ({
        ...userStat,
        jasminBalance: "0",
      }))
    }

    // Get SMPP/Gateway status
    const smppConnections = await SMPP.find({}).select("name status")
    const gatewayStatus = smppConnections.map((smpp) => ({
      gatewayId: smpp.name,
      status: smpp.status || "Unknown",
    }))

    // Get Gateway Statistics from DLR data - FIXED LOGIC with deduplication
    let gatewayStats = []
    try {
      const dlrLevel1Collection = mongoose.connection.collection("dlrlevel1")

      // Get DLR level 1 records within date range
      const rawDlrLevel1Records = await dlrLevel1Collection
        .find({
          createdAt: { $gte: dateStart, $lte: dateEnd },
        })
        .toArray()

      // Deduplicate DLR level 1 records
      const dlrLevel1Records = deduplicateDlrRecords(rawDlrLevel1Records)

      console.log("DLR Level 1 records found (after deduplication):", dlrLevel1Records.length)

      // Get corresponding DLR level 2 data for delivery status
      const messageIds = dlrLevel1Records.map((record) => record.data.id)

      let dlrLevel2Records = []
      if (messageIds.length > 0) {
        const dlrLevel2Collection = mongoose.connection.collection("dlrlevel2")
        const rawDlrLevel2Records = await dlrLevel2Collection
          .find({
            "data.id": { $in: messageIds },
            "data.level": "2",
          })
          .toArray()

        // Deduplicate DLR level 2 records
        dlrLevel2Records = deduplicateDlrRecords(rawDlrLevel2Records)
      }

      console.log("DLR Level 2 records found (after deduplication):", dlrLevel2Records.length)

      // Create map for quick lookup
      const dlrLevel2Map = dlrLevel2Records.reduce((acc, record) => {
        acc[record.data.id] = record.data
        return acc
      }, {})

      // Aggregate gateway statistics by gateway+country combination
      const gatewayStatsMap = {}

      dlrLevel1Records.forEach((record) => {
        const gateway = record.data.connector
        const country = record.data.country
        const key = `${gateway}-${country}`
        const messageId = record.data.id
        const dlr2 = dlrLevel2Map[messageId]

        if (!gatewayStatsMap[key]) {
          gatewayStatsMap[key] = {
            gatewayName: gateway,
            country,
            totalMessages: 0,
            delivered: 0,
            rejected: 0,
            undelivered: 0,
            pending: 0,
          }
        }

        // Count each message for this specific gateway+country combination
        gatewayStatsMap[key].totalMessages++

        // Count delivery status based on DLR level 2 data
        if (dlr2 && dlr2.message_status) {
          const status = dlr2.message_status.toUpperCase()
          switch (status) {
            case "DELIVRD":
              gatewayStatsMap[key].delivered++
              break
            case "REJECTD":
              gatewayStatsMap[key].rejected++
              break
            case "UNDELIV":
              gatewayStatsMap[key].undelivered++
              break
            default:
              gatewayStatsMap[key].pending++
              break
          }
        } else {
          // No DLR level 2 data means still pending
          gatewayStatsMap[key].pending++
        }
      })

      // Convert to array and sort by total messages
      gatewayStats = Object.values(gatewayStatsMap)
        .sort((a, b) => b.totalMessages - a.totalMessages)
        .slice(0, 10) // Top 10 gateway+country combinations

      console.log("Gateway stats processed:", gatewayStats)
    } catch (error) {
      console.error("Error fetching gateway stats:", error)
    }

    const responseData = {
      summary: {
        totalMessages,
        totalSent,
        delivered: deliveredCount,
        rejected: rejectedCount,
        undelivered: undeliveredCount,
        pending: pendingCount,
        total: totalMessages,
      },
      userStats,
      gatewayStats,
      gatewayStatus,
      dateRange: { startDate: dateStart, endDate: dateEnd },
    }

    console.log("Sending response with summary:", responseData.summary)
    console.log("Gateway stats in response:", responseData.gatewayStats)

    res.json(responseData)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: error.message,
    })
  }
}

// FIXED: Get comprehensive user details for popup with gateway-wise breakdown

// FIXED: Get comprehensive user details for popup with gateway-wise breakdown
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const { filter = "last24hours", startDate, endDate } = req.query

    console.log("=== USER DETAILS DEBUG START ===")
    console.log("Fetching user details for:", userId, "with filter:", filter)

    // Calculate date range based on filter
    let dateStart, dateEnd
    const now = new Date()

    if (filter === "custom" && startDate && endDate) {
      dateStart = new Date(startDate)
      dateEnd = new Date(endDate)
    } else {
      switch (filter) {
        case "last1hour":
          dateStart = new Date(now.getTime() - 60 * 60 * 1000)
          dateEnd = now
          break
        case "last2hours":
          dateStart = new Date(now.getTime() - 2 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last6hours":
          dateStart = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last12hours":
          dateStart = new Date(now.getTime() - 12 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last24hours":
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "today":
          dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case "thisweek":
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          dateStart = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
          dateEnd = new Date()
          break
        case "thismonth":
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateEnd = new Date()
          break
        default:
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          dateEnd = now
      }
    }

    console.log("Date range:", { dateStart, dateEnd })

    // Get customer details
    const customer = await Customer.findById(userId).select(
      "username primaryEmail credits companyName smppConnection profileType createdAt status",
    )

    if (!customer) {
      return res.status(404).json({ message: "User not found" })
    }

    console.log("Customer found:", customer.username)

    // DIRECT APPROACH: Query dlrlevel1 collection directly by username and date range
    const dlrLevel1Collection = mongoose.connection.collection("dlrlevel1")

    console.log("Querying dlrlevel1 with:", {
      "data.username": customer.username,
      "data.level": "1",
      createdAt: { $gte: dateStart, $lte: dateEnd },
    })

    const rawDlrLevel1Records = await dlrLevel1Collection
      .find({
        "data.username": customer.username,
        "data.level": "1",
        createdAt: { $gte: dateStart, $lte: dateEnd },
      })
      .toArray()

    console.log(`Found ${rawDlrLevel1Records.length} raw DLR level 1 records for ${customer.username}`)

    // Log each record to see what we're getting
    rawDlrLevel1Records.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        id: record.data.id,
        connector: record.data.connector,
        country: record.data.country,
        username: record.data.username,
        createdAt: record.createdAt,
      })
    })

    // Deduplicate DLR level 1 records
    const dlrLevel1Records = deduplicateDlrRecords(rawDlrLevel1Records)
    console.log(`After deduplication: ${dlrLevel1Records.length} records`)

    if (dlrLevel1Records.length === 0) {
      console.log("No DLR level 1 records found - returning basic user info")

      // Try to get Jasmin balance
      let jasminBalance = "0"
      try {
        const jasminResponse = await axios.get(`${process.env.JASMIN_BASE_URL}/api/users/`, {
          headers: {
            Authorization: `Bearer ${process.env.JASMIN_API_KEY}`,
          },
          timeout: 5000,
        })

        if (jasminResponse.status === 200) {
          const jasminUsers = jasminResponse.data.users || []
          const jasminUser = jasminUsers.find((u) => u.username === customer.username)
          if (jasminUser) {
            jasminBalance = jasminUser.mt_messaging_cred?.quota?.balance || "0"
          }
        }
      } catch (jasminError) {
        console.log("Could not fetch Jasmin balance:", jasminError.message)
      }

      return res.json({
        ...customer.toObject(),
        submitted: 0,
        delivered: 0,
        pending: 0,
        rejected: 0,
        undelivered: 0,
        totalProfit: 0,
        avgCostPrice: 0,
        avgSalePrice: 0,
        jasminBalance,
        gatewayStats: [],
        recentActivity: {
          totalSent: 0,
          deliveryRate: "0",
          totalSpent: 0,
          avgResponseTime: "< 1s",
        },
      })
    }

    // Get message IDs for DLR level 2 lookup
    const messageIds = dlrLevel1Records.map((record) => record.data.id)
    console.log(`Looking up DLR level 2 for ${messageIds.length} message IDs`)

    // Get DLR level 2 records
    let dlrLevel2Records = []
    if (messageIds.length > 0) {
      const dlrLevel2Collection = mongoose.connection.collection("dlrlevel2")
      const rawDlrLevel2Records = await dlrLevel2Collection
        .find({
          "data.id": { $in: messageIds },
          "data.level": "2",
        })
        .toArray()

      dlrLevel2Records = deduplicateDlrRecords(rawDlrLevel2Records)
      console.log(`Found ${dlrLevel2Records.length} DLR level 2 records (after deduplication)`)
    }

    // Create DLR level 2 map for quick lookup
    const dlrLevel2Map = dlrLevel2Records.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    // Process gateway statistics
    const gatewayStats = {}
    let totalDelivered = 0
    let totalPending = 0
    let totalRejected = 0
    let totalUndelivered = 0
    let totalCostPrice = 0
    let totalSalePrice = 0
    let totalProfit = 0

    console.log("Processing gateway statistics...")

    dlrLevel1Records.forEach((record, index) => {
      const gateway = record.data.connector
      const country = record.data.country
      const key = `${gateway}-${country}`
      const messageId = record.data.id

      console.log(`Processing record ${index + 1}: ${gateway}-${country} (${messageId})`)

      const dlr2 = dlrLevel2Map[messageId]

      if (!gatewayStats[key]) {
        gatewayStats[key] = {
          gatewayName: gateway,
          country,
          totalMessages: 0,
          delivered: 0,
          rejected: 0,
          undelivered: 0,
          pending: 0,
          totalCostPrice: 0,
          totalSalePrice: 0,
          totalProfit: 0,
        }
        console.log(`Created new gateway stat entry for: ${key}`)
      }

      // Increment counts
      gatewayStats[key].totalMessages++
      gatewayStats[key].totalCostPrice += record.data.costRate || 0
      gatewayStats[key].totalSalePrice += record.data.assignedRate || 0
      gatewayStats[key].totalProfit += record.data.profit || 0

      // Update overall totals
      totalCostPrice += record.data.costRate || 0
      totalSalePrice += record.data.assignedRate || 0
      totalProfit += record.data.profit || 0

      // Count delivery status based on DLR level 2 data
      if (dlr2 && dlr2.message_status) {
        const dlrStatus = dlr2.message_status.toUpperCase()
        console.log(`Message ${messageId} has DLR status: ${dlrStatus}`)

        switch (dlrStatus) {
          case "DELIVRD":
            gatewayStats[key].delivered++
            totalDelivered++
            break
          case "REJECTD":
            gatewayStats[key].rejected++
            totalRejected++
            break
          case "UNDELIV":
            gatewayStats[key].undelivered++
            totalUndelivered++
            break
          default:
            gatewayStats[key].pending++
            totalPending++
            break
        }
      } else {
        console.log(`Message ${messageId} has no DLR level 2 data - marking as pending`)
        gatewayStats[key].pending++
        totalPending++
      }
    })

    console.log("Gateway stats after processing:", Object.keys(gatewayStats))
    Object.entries(gatewayStats).forEach(([key, stats]) => {
      console.log(`${key}:`, stats)
    })

    // Convert to array and calculate averages
    const gatewayStatsArray = Object.values(gatewayStats)
      .map((gateway) => ({
        ...gateway,
        avgCostPrice: gateway.totalMessages > 0 ? gateway.totalCostPrice / gateway.totalMessages : 0,
        avgSalePrice: gateway.totalMessages > 0 ? gateway.totalSalePrice / gateway.totalMessages : 0,
      }))
      .sort((a, b) => b.totalMessages - a.totalMessages)

    console.log(`Final gateway stats array has ${gatewayStatsArray.length} entries`)

    // Calculate overall averages
    const totalMessages = dlrLevel1Records.length
    const avgCostPrice = totalMessages > 0 ? totalCostPrice / totalMessages : 0
    const avgSalePrice = totalMessages > 0 ? totalSalePrice / totalMessages : 0

    const userDetails = {
      ...customer.toObject(),
      submitted: totalMessages,
      delivered: totalDelivered,
      pending: totalPending,
      rejected: totalRejected,
      undelivered: totalUndelivered,
      totalProfit,
      avgCostPrice,
      avgSalePrice,
      smppConnection: customer.smppConnection || "Default",
      profileType: customer.profileType || "Standard",
      gatewayStats: gatewayStatsArray,
      recentActivity: {
        totalSent: totalMessages,
        deliveryRate: totalMessages > 0 ? ((totalDelivered / totalMessages) * 100).toFixed(1) : "0",
        totalSpent: totalSalePrice,
        avgResponseTime: "< 1s",
      },
    }

    console.log(`=== USER DETAILS DEBUG END ===`)
    console.log(`Returning user details for ${customer.username}:`)
    console.log(`- Total messages: ${totalMessages}`)
    console.log(`- Gateway stats entries: ${gatewayStatsArray.length}`)
    console.log(`- Gateway combinations: ${gatewayStatsArray.map((g) => `${g.gatewayName}-${g.country}`).join(", ")}`)

    res.json(userDetails)
  } catch (error) {
    console.error("Error fetching comprehensive user details:", error)
    res.status(500).json({
      message: "Error fetching user details",
      error: error.message,
    })
  }
}


// Get gateway details - FIXED to show correct counts per gateway+country with deduplication
exports.getGatewayDetails = async (req, res) => {
  try {
    const { gateway, country, filter = "last24hours", startDate, endDate } = req.query

    console.log("Fetching gateway details for:", gateway, country)

    // Calculate date range based on filter
    let dateStart, dateEnd
    const now = new Date()

    if (filter === "custom" && startDate && endDate) {
      dateStart = new Date(startDate)
      dateEnd = new Date(endDate)
    } else {
      switch (filter) {
        case "last1hour":
          dateStart = new Date(now.getTime() - 60 * 60 * 1000)
          dateEnd = now
          break
        case "last2hours":
          dateStart = new Date(now.getTime() - 2 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last6hours":
          dateStart = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last12hours":
          dateStart = new Date(now.getTime() - 12 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "last24hours":
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          dateEnd = now
          break
        case "today":
          dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case "thisweek":
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          dateStart = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
          dateEnd = new Date()
          break
        case "thismonth":
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateEnd = new Date()
          break
        default:
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          dateEnd = now
      }
    }

    // Get DLR level 1 data for the SPECIFIC gateway and country combination
    const dlrLevel1Collection = mongoose.connection.collection("dlrlevel1")
    const rawDlrLevel1Records = await dlrLevel1Collection
      .find({
        "data.connector": gateway,
        "data.country": country,
        createdAt: { $gte: dateStart, $lte: dateEnd },
      })
      .toArray()

    // Deduplicate DLR level 1 records
    const dlrLevel1Records = deduplicateDlrRecords(rawDlrLevel1Records)

    console.log(`Found ${dlrLevel1Records.length} records for ${gateway}-${country} (after deduplication)`)

    // Get corresponding DLR level 2 data
    const messageIds = dlrLevel1Records.map((record) => record.data.id)

    let dlrLevel2Records = []
    if (messageIds.length > 0) {
      const dlrLevel2Collection = mongoose.connection.collection("dlrlevel2")
      const rawDlrLevel2Records = await dlrLevel2Collection
        .find({
          "data.id": { $in: messageIds },
          "data.level": "2",
        })
        .toArray()

      // Deduplicate DLR level 2 records
      dlrLevel2Records = deduplicateDlrRecords(rawDlrLevel2Records)
    }

    // Create maps for quick lookup
    const dlrLevel2Map = dlrLevel2Records.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    // Aggregate user statistics for this specific gateway+country
    const userStats = {}
    let totalMessages = 0
    let delivered = 0
    let rejected = 0
    let undelivered = 0
    let pending = 0

    dlrLevel1Records.forEach((record) => {
      const username = record.data.username
      const messageId = record.data.id
      const dlr2 = dlrLevel2Map[messageId]

      if (!userStats[username]) {
        userStats[username] = {
          username,
          totalMessages: 0,
          delivered: 0,
          rejected: 0,
          undelivered: 0,
          pending: 0,
          totalCostPrice: 0,
          totalSalePrice: 0,
          totalProfit: 0,
          messageCount: 0,
        }
      }

      userStats[username].totalMessages++
      userStats[username].totalCostPrice += record.data.costRate || 0
      userStats[username].totalSalePrice += record.data.assignedRate || 0
      userStats[username].totalProfit += record.data.profit || 0
      userStats[username].messageCount++

      totalMessages++

      // Count delivery status
      if (dlr2 && dlr2.message_status) {
        const status = dlr2.message_status.toUpperCase()
        switch (status) {
          case "DELIVRD":
            userStats[username].delivered++
            delivered++
            break
          case "REJECTD":
            userStats[username].rejected++
            rejected++
            break
          case "UNDELIV":
            userStats[username].undelivered++
            undelivered++
            break
          default:
            userStats[username].pending++
            pending++
            break
        }
      } else {
        userStats[username].pending++
        pending++
      }
    })

    // Convert to array and calculate averages
    const userDetails = Object.values(userStats).map((user) => ({
      ...user,
      avgCostPrice: user.messageCount > 0 ? user.totalCostPrice / user.messageCount : 0,
      avgSalePrice: user.messageCount > 0 ? user.totalSalePrice / user.messageCount : 0,
    }))

    const gatewayDetails = {
      gatewayName: gateway,
      country,
      totalMessages,
      delivered,
      rejected,
      undelivered,
      pending,
      userDetails,
    }

    console.log("Gateway details response:", gatewayDetails)

    res.json(gatewayDetails)
  } catch (error) {
    console.error("Error fetching gateway details:", error)
    res.status(500).json({
      message: "Error fetching gateway details",
      error: error.message,
    })
  }
}

// Get real-time status updates
exports.getStatusUpdates = async (req, res) => {
  try {
    console.log("Status updates API called by user:", req.user)

    const smsQuery = {
      sentAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
    }

    // If customer, only show their SMS
    if (req.user.role === 3) {
      smsQuery.customer = req.user._id
    }

    const recentSms = await Sms.find(smsQuery).select("status providerResponse sentAt")

    // Get DLR data for recent SMS and deduplicate
    const providerResponseIds = recentSms.map((sms) => sms.providerResponse?.id).filter(Boolean)

    let dlrRecords = []
    if (providerResponseIds.length > 0) {
      const dlrDatasCollection = mongoose.connection.collection("dlrlevel2")
      const rawDlrRecords = await dlrDatasCollection
        .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
        .toArray()

      // Deduplicate DLR records
      dlrRecords = deduplicateDlrRecords(rawDlrRecords)
    }

    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    const statusCounts = {
      delivered: 0,
      pending: 0,
      failed: 0,
    }

    recentSms.forEach((sms) => {
      const providerId = sms.providerResponse?.id
      const dlr = providerId ? dlrDataMap[providerId] : null

      if (dlr && dlr.message_status) {
        const dlrStatus = dlr.message_status.toUpperCase()
        if (dlrStatus === "DELIVRD") {
          statusCounts.delivered++
        } else if (dlrStatus === "REJECTD" || dlrStatus === "UNDELIV") {
          statusCounts.failed++
        } else {
          statusCounts.pending++
        }
      } else {
        statusCounts.pending++
      }
    })

    res.json({
      recentActivity: recentSms.length,
      statusCounts,
      lastUpdate: new Date(),
    })
  } catch (error) {
    console.error("Error fetching status updates:", error)
    res.status(500).json({
      message: "Error fetching status updates",
      error: error.message,
    })
  }
}
