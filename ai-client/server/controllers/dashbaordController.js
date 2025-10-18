const Sms = require("../models/smsModal")
const mongoose = require("mongoose")

// Get real-time SMS statistics
exports.getRealTimeStats = async (req, res) => {
  try {
    const customerId = req.user._id
    const { filter = "Today" } = req.query

    let dateFilter = {}
    const now = new Date()

    switch (filter) {
      case "Today":
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)
        const endOfToday = new Date(now)
        endOfToday.setHours(23, 59, 59, 999)
        dateFilter = { sentAt: { $gte: startOfToday, $lte: endOfToday } }
        break

      case "Yesterday":
        const startOfYesterday = new Date(now)
        startOfYesterday.setDate(now.getDate() - 1)
        startOfYesterday.setHours(0, 0, 0, 0)
        const endOfYesterday = new Date(now)
        endOfYesterday.setDate(now.getDate() - 1)
        endOfYesterday.setHours(23, 59, 59, 999)
        dateFilter = { sentAt: { $gte: startOfYesterday, $lte: endOfYesterday } }
        break

      case "Last 24 hours":
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last24Hours, $lte: now } }
        break

      case "This Week":
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        dateFilter = { sentAt: { $gte: startOfWeek, $lte: now } }
        break

      case "This Month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        startOfMonth.setHours(0, 0, 0, 0)
        dateFilter = { sentAt: { $gte: startOfMonth, $lte: now } }
        break

      case "Last 7 days":
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last7Days, $lte: now } }
        break

      case "Last 30 days":
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last30Days, $lte: now } }
        break

      default:
        // If no specific filter, get all data
        dateFilter = {}
    }

    console.log("Date filter for", filter, ":", dateFilter)

    // Fetch SMS records for the specified period
    const smsRecords = await Sms.find({
      customer: customerId,
      ...dateFilter,
    }).select("providerResponse sentAt")

    console.log(`Found ${smsRecords.length} SMS records for filter: ${filter}`)

    // Extract provider response IDs
    const providerResponseIds = smsRecords.map((sms) => sms.providerResponse?.id).filter((id) => id)

    if (!providerResponseIds.length) {
      return res.status(200).json({
        success: true,
        data: {
          DELIVERED: 0,
          REJECTED: 0,
          UNDELIVERED: 0,
          PENDING: 0,
          TOTAL: 0,
        },
      })
    }

    // Access the dlrlevel2 collection
    const dlrDatasCollection = mongoose.connection.collection("dlrlevel2")
    const dlrRecords = await dlrDatasCollection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
      .toArray()

    // Map DLR data for quick lookup
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    // Count the different statuses
    let deliveredCount = 0
    let rejectedCount = 0
    let undeliveredCount = 0
    let pendingCount = 0

    smsRecords.forEach((sms) => {
      const extractedId = sms.providerResponse?.id
      const dlr = dlrDataMap[extractedId] || null

      if (dlr) {
        switch (dlr.message_status) {
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
        pendingCount++
      }
    })

    const totalCount = deliveredCount + rejectedCount + undeliveredCount + pendingCount

    return res.status(200).json({
      success: true,
      data: {
        DELIVERED: deliveredCount,
        REJECTED: rejectedCount,
        UNDELIVERED: undeliveredCount,
        PENDING: pendingCount,
        TOTAL: totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching real-time stats:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Get hourly SMS distribution
exports.getHourlyDistribution = async (req, res) => {
  try {
    const customerId = req.user._id
    const { filter = "Today" } = req.query

    let dateFilter = {}
    const now = new Date()

    switch (filter) {
      case "Today":
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)
        const endOfToday = new Date(now)
        endOfToday.setHours(23, 59, 59, 999)
        dateFilter = { sentAt: { $gte: startOfToday, $lte: endOfToday } }
        break

      case "Yesterday":
        const startOfYesterday = new Date(now)
        startOfYesterday.setDate(now.getDate() - 1)
        startOfYesterday.setHours(0, 0, 0, 0)
        const endOfYesterday = new Date(now)
        endOfYesterday.setDate(now.getDate() - 1)
        endOfYesterday.setHours(23, 59, 59, 999)
        dateFilter = { sentAt: { $gte: startOfYesterday, $lte: endOfYesterday } }
        break

      default:
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last7Days, $lte: now } }
    }

    const hourlyData = await Sms.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $hour: "$sentAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Fill missing hours with 0
    const result = Array.from({ length: 24 }, (_, hour) => {
      const found = hourlyData.find((item) => item._id === hour)
      return {
        hour: `${hour}:00`,
        messages: found ? found.count : 0,
      }
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Error fetching hourly distribution:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Get daily performance for the specified number of days
exports.getDailyPerformance = async (req, res) => {
  try {
    const customerId = req.user._id
    const { filter = "Last 7 days" } = req.query

    let dateFilter = {}
    let days = 7
    const now = new Date()

    switch (filter) {
      case "This Week":
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        dateFilter = { sentAt: { $gte: startOfWeek, $lte: now } }
        days = 7
        break

      case "This Month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        startOfMonth.setHours(0, 0, 0, 0)
        dateFilter = { sentAt: { $gte: startOfMonth, $lte: now } }
        days = 30
        break

      case "Last 30 days":
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last30Days, $lte: now } }
        days = 30
        break

      default:
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last7Days, $lte: now } }
        days = 7
    }

    const dailyData = await Sms.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$sentAt" },
            month: { $month: "$sentAt" },
            day: { $dayOfMonth: "$sentAt" },
          },
          total: { $sum: 1 },
          providerIds: { $push: "$providerResponse.id" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // Get DLR data for delivery status
    const allProviderIds = dailyData.flatMap((day) => day.providerIds).filter(Boolean)
    const dlrCollection = mongoose.connection.collection("dlrlevel2")
    const dlrRecords = await dlrCollection.find({ "data.id": { $in: allProviderIds }, "data.level": "2" }).toArray()

    const dlrMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    const result = dailyData.map((day) => {
      let delivered = 0,
        rejected = 0,
        undelivered = 0,
        pending = 0

      day.providerIds.forEach((id) => {
        if (id) {
          const dlr = dlrMap[id]
          if (dlr) {
            switch (dlr.message_status) {
              case "DELIVRD":
                delivered++
                break
              case "REJECTD":
                rejected++
                break
              case "UNDELIV":
                undelivered++
                break
              default:
                pending++
                break
            }
          } else {
            pending++
          }
        }
      })

      const date = new Date(day._id.year, day._id.month - 1, day._id.day)
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

      return {
        name: dayNames[date.getDay()],
        date: date.toLocaleDateString(),
        total: day.total,
        delivered,
        rejected,
        undelivered,
        pending,
        deliveryRate: day.total > 0 ? Math.round((delivered / day.total) * 100) : 0,
      }
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Error fetching daily performance:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Get comparative analytics (yesterday vs today)
exports.getComparativeAnalytics = async (req, res) => {
  try {
    const customerId = req.user._id

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Get today's data
    const todayData = await Sms.find({
      customer: customerId,
      sentAt: { $gte: today, $lt: tomorrow },
    }).select("providerResponse")

    // Get yesterday's data
    const yesterdayData = await Sms.find({
      customer: customerId,
      sentAt: { $gte: yesterday, $lt: today },
    }).select("providerResponse")

    // Get DLR data for both days
    const allProviderIds = [
      ...todayData.map((sms) => sms.providerResponse?.id),
      ...yesterdayData.map((sms) => sms.providerResponse?.id),
    ].filter(Boolean)

    const dlrCollection = mongoose.connection.collection("dlrlevel2")
    const dlrRecords = await dlrCollection.find({ "data.id": { $in: allProviderIds }, "data.level": "2" }).toArray()

    const dlrMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    // Calculate stats for both days
    const calculateStats = (smsData) => {
      const submitted = smsData.length
      let delivered = 0,
        failed = 0,
        rejected = 0

      smsData.forEach((sms) => {
        const providerId = sms.providerResponse?.id
        const dlr = providerId ? dlrMap[providerId] : null

        if (dlr) {
          switch (dlr.message_status) {
            case "DELIVRD":
              delivered++
              break
            case "REJECTD":
              rejected++
              break
            case "UNDELIV":
              failed++
              break
          }
        }
      })

      return { submitted, delivered, failed, rejected }
    }

    const todayStats = calculateStats(todayData)
    const yesterdayStats = calculateStats(yesterdayData)

    const result = {
      submitted: { today: todayStats.submitted, yesterday: yesterdayStats.submitted },
      delivered: { today: todayStats.delivered, yesterday: yesterdayStats.delivered },
      failed: { today: todayStats.failed, yesterday: yesterdayStats.failed },
      rejected: { today: todayStats.rejected, yesterday: yesterdayStats.rejected },
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Error fetching comparative analytics:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Get daily report data
exports.getDailyReportData = async (req, res) => {
  try {
    const customerId = req.user._id
    const { filter = "Last 7 days" } = req.query

    let dateFilter = {}
    const now = new Date()

    switch (filter) {
      case "This Week":
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        dateFilter = { sentAt: { $gte: startOfWeek, $lte: now } }
        break

      case "This Month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        startOfMonth.setHours(0, 0, 0, 0)
        dateFilter = { sentAt: { $gte: startOfMonth, $lte: now } }
        break

      case "Last 30 days":
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last30Days, $lte: now } }
        break

      default:
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { sentAt: { $gte: last7Days, $lte: now } }
    }

    const dailyData = await Sms.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$sentAt" },
            month: { $month: "$sentAt" },
            day: { $dayOfMonth: "$sentAt" },
          },
          submitted: { $sum: 1 },
          providerIds: { $push: "$providerResponse.id" },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 },
      },
    ])

    // Get DLR data
    const allProviderIds = dailyData.flatMap((day) => day.providerIds).filter(Boolean)
    const dlrCollection = mongoose.connection.collection("dlrlevel2")
    const dlrRecords = await dlrCollection.find({ "data.id": { $in: allProviderIds }, "data.level": "2" }).toArray()

    const dlrMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data
      return acc
    }, {})

    const result = dailyData.map((day) => {
      let delivered = 0

      day.providerIds.forEach((id) => {
        if (id) {
          const dlr = dlrMap[id]
          if (dlr && dlr.message_status === "DELIVRD") {
            delivered++
          }
        }
      })

      const date = new Date(day._id.year, day._id.month - 1, day._id.day)
      const deliveryRate = day.submitted > 0 ? ((delivered / day.submitted) * 100).toFixed(2) : "0.00"

      return {
        date: date.toLocaleDateString(),
        submitted: day.submitted,
        delivered,
        deliveryRate,
      }
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Error fetching daily report data:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Get all SMS data for debugging
exports.getAllSmsData = async (req, res) => {
  try {
    const customerId = req.user._id

    // Get total SMS count
    const totalSms = await Sms.countDocuments({ customer: customerId })

    // Get recent SMS records with dates
    const recentSms = await Sms.find({ customer: customerId })
      .sort({ sentAt: -1 })
      .limit(10)
      .select("_id sentAt providerResponse createdAt")

    // Get date range of SMS data
    const oldestSms = await Sms.findOne({ customer: customerId }).sort({ sentAt: 1 }).select("sentAt")
    const newestSms = await Sms.findOne({ customer: customerId }).sort({ sentAt: -1 }).select("sentAt")

    // Get DLR count
    const dlrCollection = mongoose.connection.collection("dlrlevel2")
    const totalDlr = await dlrCollection.countDocuments()

    res.json({
      success: true,
      data: {
        totalSms,
        totalDlr,
        recentSms,
        customerId,
        dateRange: {
          oldest: oldestSms?.sentAt,
          newest: newestSms?.sentAt,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching debug data:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}
