const axios = require("axios");
const qs = require('qs'); // <-- npm install qs

const AUTH_HEADER = {
  headers: {
    Authorization: "Basic cm9vdDpuZXR3YXJlNA==", // Replace with actual credentials
  },
};

const JASMIN_BASE_URL = process.env.JASMIN_BASE_URL || "http://185.169.252.75:8000";

let routingStatus = "pending";

exports.addFilter = async (req, res) => {
  const { filterType, filterId, filterP, group, routesmpp, sellingPrice } = req.body;

  if (!filterType || !filterId) {
    return res.status(400).json({ error: "filterType and filterId are required" });
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const createdFilterIds = [];

  try {
    let normalizedFilterP = Array.isArray(filterP) ? filterP : [filterP];

    let updatedFilterP = normalizedFilterP
      .map((p) => {
        if (!p || !p.prefix || !p.cc) return null;
        return p.cc === p.prefix ? p.cc : `${p.cc}${p.prefix}`;
      })
      .filter(Boolean);

    // 1️⃣ Create DestinationAddrFilters
    for (let p of updatedFilterP) {
      const modifiedFilterId = `${filterId}${p}`;
      const payload = {
        type: "DestinationAddrFilter",
        fid: modifiedFilterId,
        parameter: p,
      };

      try {
        await axios.post(`${JASMIN_BASE_URL}/api/filters/`, payload);
        createdFilterIds.push(modifiedFilterId);
        console.log(`✅ Created DestinationAddrFilter: ${modifiedFilterId}`);
      } catch (err) {
        console.error(`❌ Failed to create DestinationAddrFilter: ${modifiedFilterId}`, err.message);
      }

      await delay(30000); // 30s delay
    }

    // 2️⃣ Create GroupFilter
    const groupFilterPayload = {
      type: "GroupFilter",
      fid: group,
      parameter: group,
    };

    try {
      await axios.post(`${JASMIN_BASE_URL}/api/filters/`, groupFilterPayload);
      console.log(`✅ Created GroupFilter: ${group}`);
    } catch (err) {
      console.error(`❌ Failed to create GroupFilter: ${group}`, err.message);
      return res.status(500).json({ error: "Failed to create group filter" });
    }

    // 3️⃣ Create MT Routers using x-www-form-urlencoded
    for (const destinationFid of createdFilterIds) {
      const uniqueOrder = Math.floor(Date.now() / 1000);

      const mtRouterPayload = {
        type: "StaticMTRoute",
        order: uniqueOrder,
        rate: parseFloat(sellingPrice),
        smppconnectors: routesmpp, // Assuming routesmpp is an array, you might need to format this too
        filters: `${destinationFid},${group}`,  // Combine filters as a comma-separated string
      };

      console.log("🟨 MTRoute Payload:", mtRouterPayload);

      try {
        await axios.post(
          `${JASMIN_BASE_URL}/api/mtrouters/`,
          qs.stringify(mtRouterPayload, { arrayFormat: 'repeat' }), // 👈 key part
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        console.log(`✅ Created MTRoute for ${destinationFid} + ${group}`);
      } catch (err) {
        console.error(`❌ Failed to create MTRoute`, err.response?.data || err.message);
      }

      await delay(30000);
    }

        routingStatus = "completed";

    res.status(200).json({ message: "All filters and MT Routes added successfully." });
  } catch (error) {
    console.error("❌ Unexpected Error:", error.message);
    res.status(500).json({ error: "Failed to add filters", details: error.message });
  }
};



exports.getFilterStatus = async (req, res) => {
  res.json({ status: routingStatus });
};

// Delete Filter
exports.deleteFilter = async (req, res) => {
  const { filterId } = req.body;

  if (!filterId) {
    return res.status(400).json({ error: "filterId is required" });
  }

  try {
    const apiUrl = `${JASMIN_BASE_URL}/api/filters/${filterId}/`; // <-- Jasmin REST endpoint

    const response = await axios.delete(apiUrl); // <-- No auth header, clean DELETE call

    if (response.status === 200) {
      res.status(200).json({ message: "Filter deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete filter", details: response.data });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete filter",
      details: error.response?.data || error.message,
    });
  }
};


// Get All Filters
exports.getFilters = async (req, res) => {
  try {
    const apiUrl = `${JASMIN_BASE_URL}/api/filters/`;
    const response = await axios.get(apiUrl);

    res
      .status(200)
      .json({ message: "Filters retrieved successfully", data: response.data });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch filters", details: error.message });
  }
};
