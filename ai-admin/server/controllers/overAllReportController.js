const Sms = require("../models/smsModal");
const mongoose = require("mongoose"); // Mongoose for accessing `dlrlevel2`
const submitLogCollection = mongoose.connection.collection("submit_log");
const Customer = require("../models/Customer"); // Import the Customer model
const customerUserCollection = mongoose.connection.collection('customerusers');
const LoginHistory = require("../models/LoginHistory");


exports.getAllSmsReport = async (req, res) => {
  try {
    let { smsId, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Default date range: today's date
    if (!startDate || !endDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      startDate = todayStart.toISOString();
      endDate = todayEnd.toISOString();
    }

    // Validate pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (
      isNaN(parsedPage) ||
      parsedPage < 1 ||
      isNaN(parsedLimit) ||
      parsedLimit < 1
    ) {
      return res
        .status(400)
        .json({ message: "Invalid pagination parameters." });
    }

    // Build query filter (no customer filter to get all records)
    const filter = {};
    if (smsId) filter._id = smsId;
    filter.sentAt = { $gte: new Date(startDate), $lte: new Date(endDate) };

    // Fetch SMS records with filters and pagination
    const smsRecords = await Sms.find(filter)
      .sort({ sentAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select("sender status providerResponse sentAt message mobileNumbers"); // Fetch only required fields

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

    // Extract providerResponse IDs
    const providerResponseIds = smsRecords
      .map((sms) => {
        const details = sms.providerResponse?.id; // Use the ID field for matching
        return details || null;
      })
      .filter(Boolean); // Remove null/undefined values

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

    // Enrich SMS records with DLR data
    const enrichedSmsRecords = smsRecords.map((sms) => {
      const providerId = sms.providerResponse?.id; // Get the provider response ID

      return {
        ...sms.toObject(),
        dlr: providerId ? dlrDataMap[providerId] : null,
      };
    });

    // Calculate total records for pagination
    const totalRecords = await Sms.countDocuments(filter);

    // Return enriched data with pagination
    return res.status(200).json({
      message: "SMS and DLR details fetched successfully.",
      data: enrichedSmsRecords,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalRecords / parsedLimit),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching SMS and DLR details:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.getCustomerSpecificSmsReport = async (req, res) => {
  try {
    let { smsId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const { customerId } = req.params;

    // Default date range: today's date
    if (!startDate || !endDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      startDate = todayStart.toISOString();
      endDate = todayEnd.toISOString();
    }

    // Validate pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (
      isNaN(parsedPage) ||
      parsedPage < 1 ||
      isNaN(parsedLimit) ||
      parsedLimit < 1
    ) {
      return res
        .status(400)
        .json({ message: "Invalid pagination parameters." });
    }

    // Build query filter
    const filter = { customer: customerId };
    if (smsId) filter._id = smsId;
    filter.sentAt = { $gte: new Date(startDate), $lte: new Date(endDate) };

    // Fetch SMS records with filters and pagination
    const smsRecords = await Sms.find(filter)
      .sort({ sentAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select(
        "sender status providerResponse sentAt message mobileNumbers sentAt"
      ); // Fetch only required fields

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

    // Extract providerResponse IDs
    const providerResponseIds = smsRecords
      .map((sms) => {
        const details = sms.providerResponse?.id; // Use the ID field for matching
        return details || null;
      })
      .filter(Boolean); // Remove null/undefined values

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

    // Fetch pricing data from dlrlevel1
    const dlrLevel1Collection = mongoose.connection.collection("dlrlevel1");
    const dlrLevel1Records = await dlrLevel1Collection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "1" })
      .toArray();

    const dlrLevel1Map = dlrLevel1Records.reduce((acc, record) => {
      acc[record.data.id] = record.data;
      return acc;
    }, {});


    // Enrich SMS records with DLR data
    const enrichedSmsRecords = smsRecords.map((sms) => {
      const providerId = sms.providerResponse?.id; // Get the provider response ID

      const dlr = providerId ? dlrDataMap[providerId] : null;

        const dlr1 = providerId ? dlrLevel1Map[providerId] : null; // <- use dlrlevel1

      return {
        ...sms.toObject(),
   assignedRate: dlr1?.assignedRate || 0,
    costRate: dlr1?.costRate || 0,
    profit: dlr1?.profit || 0,
        dlr,
      };

    });

    // Calculate total records for pagination
    const totalRecords = await Sms.countDocuments(filter);

    // Return enriched data with pagination
    return res.status(200).json({
      message: "SMS and DLR details fetched successfully.",
      data: enrichedSmsRecords,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalRecords / parsedLimit),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching SMS and DLR details:", error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

exports.fetchBilling = async (req, res) => {
  try {
    let { startDate, endDate, CUSTOMERID, page = 1, limit = 10 } = req.query;

    const customer = await Customer.findById(CUSTOMERID); // Assuming CUSTOMERID is a valid ObjectId
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const username = customer.username;

    // Fetch user record dynamically
    const userRecord = await customerUserCollection.findOne({ username });

    if (!userRecord) {
      return res
        .status(404)
        .json({ message: "User not found in customerusers." });
    }

    const uid = userRecord.username; // Extract dynamic username

    // Default date range: today's date if no date provided
    if (!startDate || !endDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      startDate = todayStart.toISOString(); // UTC ISO string
      endDate = todayEnd.toISOString(); // UTC ISO string
    }

    // Convert startDate and endDate to Date objects
    const startDateObj = new Date(startDate); // Ensure this is in UTC
    const endDateObj = new Date(endDate); // Ensure this is in UTC

    // Convert to UTC string format (if necessary)
    const startDateStr = startDateObj
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const endDateStr = endDateObj.toISOString().slice(0, 19).replace("T", " ");

    // Validate pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (
      isNaN(parsedPage) ||
      parsedPage < 1 ||
      isNaN(parsedLimit) ||
      parsedLimit < 1
    ) {
      return res
        .status(400)
        .json({ message: "Invalid pagination parameters." });
    }

    // MongoDB query filter to fetch records within the adjusted date range
    const query = {
      uid,
      created_at: {
        $gte: startDateStr, // Compare as string in 'YYYY-MM-DD HH:mm:ss' format
        $lte: endDateStr, // Compare as string in 'YYYY-MM-DD HH:mm:ss' format
      },
    };

    // Fetch submit_log data with filters (including pagination)
    const billingData = await submitLogCollection
      .find(query)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .toArray();

    // Debugging: Print fetched billing data

    // If no records are found, return response with 0 billing data
    if (!billingData.length) {
      console.log("No records found, returning response with 0 billing data.");
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
    const totalBilling = billingData.reduce(
      (sum, record) => sum + (record.rate || 0),
      0
    );

    // Calculate status counts
    const statusCounts = billingData.reduce(
      (counts, record) => {
        const status = record.status;
        counts.TOTAL += 1;
        if (status === "DELIVRD") counts.DELIVRD += 1;
        else if (status === "REJECTD") counts.REJECTD += 1;
        else if (status === "UNDELIV") counts.UNDELIV += 1;
        else counts.PENDING += 1; // Everything else is considered PENDING
        return counts;
      },
      { DELIVRD: 0, REJECTD: 0, UNDELIV: 0, PENDING: 0, TOTAL: 0 }
    );

    // Extract unique rates for reference
    const ratesApplied = Array.from(
      new Set(billingData.map((record) => record.rate).filter(Boolean))
    );

    // Calculate total documents for pagination
    const totalBillingRecords = await submitLogCollection.countDocuments(query);

    // Return response with aggregated data
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
    res
      .status(500)
      .json({
        message: "Error fetching billing report.",
        error: error.message,
      });
  }
};


exports.getAllLoginHistory = async (req, res) => {
  try {
    let { userId, email, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Default date range: today's date if not provided
    if (!startDate || !endDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      startDate = todayStart.toISOString();
      endDate = todayEnd.toISOString();
    }

    // Convert pagination values to integers
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters." });
    }

    // Build query filter
    const filter = {};
    if (userId) filter.userId = userId;
    if (email) filter.email = email;
    filter.loginTime = { $gte: new Date(startDate), $lte: new Date(endDate) };

    // Fetch login history records with pagination
    const loginRecords = await LoginHistory.find(filter)
      .sort({ loginTime: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select("userId userType email ip deviceType location loginTime");

    if (!loginRecords.length) {
      return res.status(200).json({
        message: "No login records found for the given criteria.",
        data: [],
        pagination: {
          currentPage: parsedPage,
          totalPages: 0,
          totalRecords: 0,
        },
      });
    }

    // Calculate total records for pagination
    const totalRecords = await LoginHistory.countDocuments(filter);

    // Return structured response
    return res.status(200).json({
      message: "Login history fetched successfully.",
      data: loginRecords.map(record => ({
        _id: record._id,
        userId: record.userId,
        userType: record.userType,
        email: record.email,
        ip: record.ip,
        deviceType: record.deviceType,
        location: {
          country: record.location?.country || "",
          region: record.location?.region || "",
          city: record.location?.city || "",
          latitude: record.location?.latitude || null,
          longitude: record.location?.longitude || null,
        },
        loginTime: record.loginTime,
      })),
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalRecords / parsedLimit),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};
