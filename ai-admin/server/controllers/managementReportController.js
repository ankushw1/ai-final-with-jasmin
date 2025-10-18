const Sms = require('../models/smsModal');
const mongoose = require('mongoose'); // Mongoose for accessing `dlrlevel2`

exports.getAllManagementSmsReport = async (req, res) => {
  try {
    let { smsId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const loggedInUserId = req.user.id; // Assuming the logged-in user's ID is passed in req.user.id

    console.log('Logged-in User ID:', loggedInUserId); // Log logged-in user's ID

    // Default date range: today's date
    if (!startDate || !endDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      startDate = todayStart.toISOString();
      endDate = todayEnd.toISOString();
    }

    console.log('Date Range:', { startDate, endDate }); // Log the start and end dates

    // Validate pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters." });
    }

    // Build query filter (no customer filter to get all records)
    const filter = {};
    if (smsId) filter._id = smsId;
    filter.sentAt = { $gte: new Date(startDate), $lte: new Date(endDate) };

    console.log('Filter:', filter); // Log the filter object

    // Fetch SMS records assigned to the logged-in user's customers
    const smsRecords = await Sms.find(filter)
      .populate('customer') // Assuming `Sms` model has a `customer` field
      .where('customer.assignedAccountManager')
      .equals(loggedInUserId)
      .sort({ sentAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select('sender status providerResponse sentAt message mobileNumbers'); // Fetch only required fields

    console.log('SMS Records:', smsRecords); // Log the fetched SMS records

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

    console.log('Provider Response IDs:', providerResponseIds); // Log the provider response IDs

    // Fetch matching DLR data
    const dlrDatasCollection = mongoose.connection.collection("dlrlevel2");
    const dlrRecords = await dlrDatasCollection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
      .toArray();

    console.log('DLR Records:', dlrRecords); // Log the DLR records

    // Map DLR records by providerResponse ID
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data;
      return acc;
    }, {});

    console.log('DLR Data Map:', dlrDataMap); // Log the DLR data map

    // Enrich SMS records with DLR data
    const enrichedSmsRecords = smsRecords.map((sms) => {
      const providerId = sms.providerResponse?.id; // Get the provider response ID

      return {
        ...sms.toObject(),
        dlr: providerId ? dlrDataMap[providerId] : null,
      };
    });

    console.log('Enriched SMS Records:', enrichedSmsRecords); // Log the enriched SMS records

    // Calculate total records for pagination
    const totalRecords = await Sms.countDocuments(filter);

    console.log('Total Records:', totalRecords); // Log the total record count for pagination

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
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};
