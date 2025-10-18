const axios = require('axios');
const SMPP = require('../models/smpp');

const JASMIN_BASE_URL = process.env.JASMIN_BASE_URL || 'http://185.169.252.75:8000';

// Get all SMPP connectors
exports.getAllSmpp = async (req, res) => {
  try {
    const response = await axios.get(`${JASMIN_BASE_URL}/api/smppsconns/`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SMPP connectors', details: error.message });
  }
};

// Create SMPP connector
exports.addSmpp = async (req, res) => {
    const { smppName } = req.body;
    if (!smppName) {
      return res.status(400).json({ error: "SMPP name is required" });
    }
  
    try {
      const existing = await SMPP.findOne({ name: smppName });
      if (existing) {
        return res.status(400).json({ error: "SMPP already exists" });
      }
  
      const response = await axios.post(`${JASMIN_BASE_URL}/api/smppsconns/`, {
        cid: smppName
      });
  
      // Save in DB and return success regardless of status code
      await new SMPP({ name: smppName }).save();
      return res.status(200).json({ message: "SMPP created successfully", data: response.data });
    } catch (error) {
      return res.status(500).json({
        error: "Error creating SMPP",
        details: error.response?.data || error.message
      });
    }
  };
  

// Delete SMPP connector
exports.deleteSmpp = async (req, res) => {
  const { smppName } = req.query;
  if (!smppName) return res.status(400).json({ error: "SMPP name is required" });

  try {
    const response = await axios.delete(`${JASMIN_BASE_URL}/api/smppsconns/${smppName}/`);
    if (response.status === 200) {
      await SMPP.deleteOne({ name: smppName });
      res.status(200).json({ message: "SMPP deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete SMPP", details: response.data });
    }
  } catch (error) {
    res.status(500).json({ error: "Error deleting SMPP", details: error.message });
  }
};

// Enable SMPP connector
exports.enableSmpp = async (req, res) => {
  const smppName = req.body.smppName || req.body.params?.smppName;
  if (!smppName) return res.status(400).json({ error: "SMPP name is required" });

  try {
    const response = await axios.put(`${JASMIN_BASE_URL}/api/smppsconns/${smppName}/start/`);

    // Accept both 200 and 400 as valid start (already started)
    if (response.status === 200 || response.status === 400) {
      await SMPP.updateOne({ name: smppName }, { status: 'enabled' });
      return res.status(200).json({ message: "SMPP enabled successfully", details: response.data });
    }

    res.status(500).json({ error: "Failed to enable SMPP", details: response.data });
  } catch (error) {
    res.status(500).json({ error: "Error enabling SMPP", details: error.response?.data || error.message });
  }
};

// Disable SMPP connector
exports.disableSmpp = async (req, res) => {
  const smppName = req.body.smppName || req.body.params?.smppName;
  if (!smppName) return res.status(400).json({ error: "SMPP name is required" });

  try {
    const response = await axios.put(`${JASMIN_BASE_URL}/api/smppsconns/${smppName}/stop/`);

    // Accept both 200 and 400 as valid stop (already stopped)
    if (response.status === 200 || response.status === 400) {
      await SMPP.updateOne({ name: smppName }, { status: 'disabled' });
      return res.status(200).json({ message: "SMPP disabled successfully", details: response.data });
    }

    res.status(500).json({ error: "Failed to disable SMPP", details: response.data });
  } catch (error) {
    res.status(500).json({ error: "Error disabling SMPP", details: error.response?.data || error.message });
  }
};

  
  
// Get single SMPP
exports.getSingleSmpp = async (req, res) => {
  const { smppName } = req.query;
  if (!smppName) return res.status(400).json({ error: "SMPP name is required" });

  try {
    const response = await axios.get(`${JASMIN_BASE_URL}/api/smppsconns/${smppName}/`);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch SMPP details", details: error.message });
  }
};

// Update SMPP connector
exports.updateSmpp = async (req, res) => {
    const { smpp_name, cid, ...rawUpdates } = req.body;
  
    const connectorId = smpp_name || cid;
  
    if (!connectorId) {
      return res.status(400).json({ error: "Connector ID (smpp_name or cid) is required" });
    }
  
    // Exclude fields we don't want in MongoDB
    const { session, stops, status, starts, ...updates } = rawUpdates;
  
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid update parameters provided" });
    }
  
    try {
      // Send everything except session to Jasmin
      const response = await axios.patch(
        `${JASMIN_BASE_URL}/api/smppsconns/${connectorId}/`,
        updates,
        { headers: { "Content-Type": "application/json" } }
      );
  
      if (response.status === 200) {
        // Save only selected fields in MongoDB
        await SMPP.updateOne({ name: connectorId }, updates, { upsert: true });
        return res.status(200).json({ message: "SMPP updated successfully", data: response.data });
      }
  
      return res.status(500).json({ error: "Failed to update SMPP", details: response.data });
    } catch (error) {
      return res.status(500).json({
        error: "Error updating SMPP",
        details: error.response?.data || error.message,
      });
    }
  };
  