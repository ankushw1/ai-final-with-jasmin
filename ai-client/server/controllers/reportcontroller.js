const Sms = require('../models/smsModal');
const mongoose = require('mongoose');

exports.getSmsReport = async (req, res) => {
  try {
    let { 
      senderName, 
      mobileNumber, 
      transactionId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      search = ''
    } = req.query;

    // Default date range: last 30 days if not provided
    if (!startDate || !endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      startDate = thirtyDaysAgo.toISOString();
      endDate = today.toISOString();
    }

    // Validate pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters." });
    }

    const customerId = req.user._id;

    // Build query filter
    const filter = { customer: customerId };
    
    // Date range filter
    filter.sentAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    
    // Search filters
    if (senderName) {
      filter.sender = { $regex: senderName, $options: 'i' };
    }
    
    if (mobileNumber) {
      filter.mobileNumbers = { $elemMatch: { $regex: mobileNumber } };
    }
    
    if (transactionId) {
      filter._id = transactionId;
    }
    
    // General search across multiple fields
    if (search) {
      filter.$or = [
        { sender: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { mobileNumbers: { $elemMatch: { $regex: search } } }
      ];
    }

    // Fetch SMS records with filters and pagination
    const smsRecords = await Sms.find(filter)
      .sort({ sentAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select('_id sender status providerResponse sentAt message mobileNumbers messageType');

    if (!smsRecords.length) {
      return res.status(200).json({
        message: "No SMS records found for the given criteria.",
        data: [],
        pagination: {
          currentPage: parsedPage,
          totalPages: 0,
          totalRecords: 0,
        },
      });
    }

    // Extract providerResponse IDs for DLR lookup
    const providerResponseIds = smsRecords
      .map((sms) => sms.providerResponse?.id)
      .filter(Boolean);

    // Fetch matching DLR data
    const dlrDatasCollection = mongoose.connection.collection("dlrlevel2");
    const dlrRecords = await dlrDatasCollection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
      .toArray();

    // Map DLR records by providerResponse ID
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data;
      return acc;
    }, {});

    // Enrich SMS records with DLR data and format for frontend
    const enrichedSmsRecords = smsRecords.map((sms) => {
      const providerId = sms.providerResponse?.id;
      const dlr = providerId ? dlrDataMap[providerId] : null;
      
      // Determine final status based on DLR data
      let finalStatus = sms.status;
      let deliveryStatus = 'Pending';
      
      if (dlr) {
        switch (dlr.message_status) {
          case 'DELIVRD':
            deliveryStatus = 'Delivered';
            break;
          case 'REJECTD':
            deliveryStatus = 'Failed';
            break;
          case 'UNDELIV':
            deliveryStatus = 'Failed';
            break;
          default:
            deliveryStatus = 'Pending';
        }
      }

      return {
        transactionId: sms._id.toString(),
        messageId: sms.providerResponse?.id || 'N/A',
        mobile: sms.mobileNumbers.join(', '),
        senderName: sms.sender,
        textMessage: sms.message,
        type: sms.messageType === 'TEXT' ? 'Transactional' : 'Promotional',
        length: sms.message.length,
cost: dlr?.assignedRate ? `€ ${dlr.assignedRate}` : '€ 0.00',
        status: deliveryStatus,
        cause: dlr ? (dlr.message_status === 'DELIVRD' ? 'Success' : dlr.err || 'Unknown') : 'Pending',
        channelName: 'Channel A', // You can map this from your data
        ipAddress: req.ip || '192.168.1.100',
        submittedTime: sms.sentAt,
        deliveredTime: dlr && dlr.donedate ? this.formatDlrDate(dlr.donedate) : null,
        dlr: dlr
      };
    });

    // Calculate total records for pagination
    const totalRecords = await Sms.countDocuments(filter);

    return res.status(200).json({
      message: "SMS delivery report fetched successfully.",
      data: enrichedSmsRecords,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalRecords / parsedLimit),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching SMS delivery report:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Helper function to format DLR date
exports.formatDlrDate = (dlrDate) => {
  if (!dlrDate) return null;
  
  // DLR date format is typically YYMMDDHHMMSS
  if (dlrDate.length === 12) {
    const year = '20' + dlrDate.substring(0, 2);
    const month = dlrDate.substring(2, 4);
    const day = dlrDate.substring(4, 6);
    const hour = dlrDate.substring(6, 8);
    const minute = dlrDate.substring(8, 10);
    const second = dlrDate.substring(10, 12);
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }
  
  return null;
};

exports.getSmsStatusCount = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Get the current date range (today's data)
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    // Fetch SMS records for today
    const smsRecords = await Sms.find({
      customer: customerId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    }).select('providerResponse');

    // Extract provider response IDs
    const providerResponseIds = smsRecords
      .map((sms) => sms.providerResponse?.id)
      .filter((id) => id);

    if (!providerResponseIds.length) {
      return res.status(200).json({
        message: "SMS status counts fetched successfully.",
        statusCounts: {
          DELIVRD: 0,
          REJECTD: 0,
          UNDELIV: 0,
          PENDING: 0,
          TOTAL: 0,
        }
      });
    }

    // Access the dlrlevel2 collection
    const dlrDatasCollection = mongoose.connection.collection("dlrlevel2");
    const dlrRecords = await dlrDatasCollection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
      .toArray();

    // Map DLR data for quick lookup
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data;
      return acc;
    }, {});

    // Count the different statuses
    let deliveredCount = 0;
    let rejectedCount = 0;
    let undeliveredCount = 0;
    let pendingCount = 0;

    smsRecords.forEach((sms) => {
      const extractedId = sms.providerResponse?.id;
      const dlr = dlrDataMap[extractedId] || null;

      if (dlr) {
        switch (dlr.message_status) {
          case "DELIVRD":
            deliveredCount++;
            break;
          case "REJECTD":
            rejectedCount++;
            break;
          case "UNDELIV":
            undeliveredCount++;
            break;
          default:
            pendingCount++;
            break;
        }
      } else {
        pendingCount++;
      }
    });

    const totalCount = deliveredCount + rejectedCount + undeliveredCount + pendingCount;

    return res.status(200).json({
      message: "SMS status counts fetched successfully.",
      statusCounts: {
        DELIVRD: deliveredCount,
        REJECTD: rejectedCount,
        UNDELIV: undeliveredCount,
        PENDING: pendingCount,
        TOTAL: totalCount,
      }
    });
  } catch (error) {
    console.error("Error fetching SMS status count:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

exports.fetchBilling = async (req, res) => {
  try {
    let { startDate, endDate, page = 1, limit = 10 } = req.query;
    const uid = req.user.username;

    // Default date range: today's date if no date provided
    if (!startDate || !endDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      startDate = todayStart.toISOString();
      endDate = todayEnd.toISOString();
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const startDateStr = startDateObj.toISOString().slice(0, 19).replace('T', ' ');
    const endDateStr = endDateObj.toISOString().slice(0, 19).replace('T', ' ');

    // Validate pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters." });
    }

    const submitLogCollection = mongoose.connection.collection('submit_log');

    const query = {
      uid,
      created_at: {
        $gte: startDateStr,
        $lte: endDateStr,
      },
    };

    // Fetch submit_log data with filters
    const billingData = await submitLogCollection
      .find(query)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .toArray();

    if (!billingData.length) {
      return res.status(200).json({
        message: "No billing records found for the given criteria.",
        billingSummary: {
          totalBilling: 0,
          statusCounts: {
            DELIVRD: 0,
            REJECTD: 0,
            UNDELIV: 0,
            PENDING: 0,
            TOTAL: 0,
          },
          rates: [],
        },
        pagination: {
          currentPage: parsedPage,
          totalPages: 0,
          totalRecords: 0,
        },
      });
    }

    // Calculate total billing amount
    const totalBilling = billingData.reduce((sum, record) => sum + (record.rate || 0), 0);

    // Calculate status counts
    const statusCounts = billingData.reduce(
      (counts, record) => {
        const status = record.status;
        counts.TOTAL += 1;
        if (status === "DELIVRD") counts.DELIVRD += 1;
        else if (status === "REJECTD") counts.REJECTD += 1;
        else if (status === "UNDELIV") counts.UNDELIV += 1;
        else counts.PENDING += 1;
        return counts;
      },
      { DELIVRD: 0, REJECTD: 0, UNDELIV: 0, PENDING: 0, TOTAL: 0 }
    );

    const ratesApplied = Array.from(new Set(billingData.map((record) => record.rate).filter(Boolean)));
    const totalBillingRecords = await submitLogCollection.countDocuments(query);

    res.status(200).json({
      message: "Billing report fetched successfully.",
      billingSummary: {
        totalBilling,
        totalMessages: totalBillingRecords,
        statusCounts,
        rates: ratesApplied,
      },
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalBillingRecords / parsedLimit),
        totalRecords: totalBillingRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching billing report:", error);
    res.status(500).json({ message: "Error fetching billing report.", error: error.message });
  }
};
