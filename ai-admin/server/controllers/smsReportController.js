const Sms = require('../models/smsModal');
const mongoose = require('mongoose'); // Mongoose for accessing `dlrlevel2`

exports.getSmsReport = async (req, res) => {
  try {
    const { smsId, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Validate inputs
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid pagination parameters." });
    }

    const customerId = req.user._id; // Extracted from the JWT using authenticate middleware

    // Initialize filter object
    const filter = { customer: customerId };
    if (smsId) {
      filter._id = smsId; // Filter by specific SMS ID
    }
    if (startDate) {
      filter.sentAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.sentAt = { ...(filter.sentAt || {}), $lte: new Date(endDate) };
    }

    // Determine pagination values
    const skip = (parsedPage - 1) * parsedLimit;

    // Fetch SMS records with filters and pagination
    const smsRecords = await Sms.find(filter)
      .sort({ sentAt: -1 }) // Sort by sent date (descending)
      .skip(skip)
      .limit(parsedLimit)
      .select('sender status providerResponse sentAt message mobileNumbers'); // Select necessary fields

    // If no SMS records found, return early
    if (!smsRecords.length) {
      return res.status(404).json({ message: "No SMS records found for the given criteria." });
    }

    // Extract provider response IDs and clean up any extra quotes
    const providerResponseIds = smsRecords
      .map((sms) => {
        const responseData = sms.providerResponse?.details?.data;

        // Check if providerResponse.data exists and is a string
        if (responseData && typeof responseData === 'string') {
          try {
            // Remove 'Success ' prefix, strip extra quotes, and extract the ID
            const extractedId = responseData
              .replace("Success ", "")           // Remove 'Success ' prefix
              .replace(/^"|"$/g, "")             // Remove leading/trailing quotes
              .trim();                           // Remove leading/trailing spaces

            return extractedId;
          } catch (err) {
            console.error("Error extracting ID from providerResponse:", err);
            return null;
          }
        }
        return null; // If providerResponse.data is null or undefined, return null
      })
      .filter((id) => id); // Filter out null or undefined IDs


    if (!providerResponseIds.length) {
      return res.status(404).json({ message: "No valid provider response data found for SMS records." });
    }

    // Access the `dlrlevel2` collection dynamically
    const dlrDatasCollection = mongoose.connection.collection("dlrlevel2");

    // Fetch matching DLR data for provider response IDs
    const dlrRecords = await dlrDatasCollection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
      .toArray();

    // Log the results of the DLR query to verify the match

    // Map DLR data for quick lookup by providerResponseId
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data;
      return acc;
    }, {});

    // Log the DLR data map for debugging

    // Attach DLR data to each SMS record
    const enrichedSmsRecords = smsRecords.map((sms) => {
      // Extract provider response ID from each SMS
      const extractedId = sms.providerResponse?.details?.data
        .replace("Success ", "")
        .replace(/^"|"$/g, "")
        .trim();


      const dlr = dlrDataMap[extractedId] || null;

      return {
        ...sms.toObject(),
        dlr, // Attach the corresponding DLR data if available
      };
    });

    // Calculate total number of records (without pagination)
    const totalRecords = await Sms.countDocuments(filter);

    // Combine and return paginated response
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


exports.getSmsStatusCount = async (req, res) => {
  try {
    const customerId = req.user._id; // Extracted from the JWT using authenticate middleware

    // Fetch all SMS records for the user
    const smsRecords = await Sms.find({ customer: customerId })
      .select('providerResponse'); // Only need providerResponse data to match DLR

    // Extract provider response IDs
    const providerResponseIds = smsRecords
      .map((sms) => {
        const responseData = sms.providerResponse?.details?.data;

        // Extract the provider response ID from the data
        if (responseData && typeof responseData === 'string') {
          try {
            return responseData
              .replace("Success ", "")  // Remove 'Success ' prefix
              .replace(/^"|"$/g, "")    // Remove leading/trailing quotes
              .trim();
          } catch (err) {
            console.error("Error extracting ID from providerResponse:", err);
            return null;
          }
        }
        return null;
      })
      .filter((id) => id); // Filter out null or undefined IDs

    if (!providerResponseIds.length) {
      return res.status(404).json({ message: "No valid provider response data found." });
    }

    // Access the `dlrlevel2` collection dynamically
    const dlrDatasCollection = mongoose.connection.collection("dlrlevel2");

    // Fetch DLR records matching provider response IDs
    const dlrRecords = await dlrDatasCollection
      .find({ "data.id": { $in: providerResponseIds }, "data.level": "2" })
      .toArray();

    // Map DLR data for quick lookup by providerResponseId
    const dlrDataMap = dlrRecords.reduce((acc, record) => {
      acc[record.data.id] = record.data;
      return acc;
    }, {});

    // Count the different statuses
    let deliveredCount = 0;
    let rejectedCount = 0;
    let undeliveredCount = 0;
    let pendingCount = 0;

    // Go through each SMS record and match the DLR data to count statuses
    smsRecords.forEach((sms) => {
      const extractedId = sms.providerResponse?.details?.data
        .replace("Success ", "")
        .replace(/^"|"$/g, "")
        .trim();

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
        // If DLR data is not found, consider the status as "PENDING"
        pendingCount++;
      }
    });

    // Return the status counts in the response
    return res.status(200).json({
      message: "SMS status counts fetched successfully.",
      statusCounts: {
        DELIVRD: deliveredCount,
        REJECTD: rejectedCount,
        UNDELIV: undeliveredCount,
        PENDING: pendingCount,
      }
    });
  } catch (error) {
    console.error("Error fetching SMS status count:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};
