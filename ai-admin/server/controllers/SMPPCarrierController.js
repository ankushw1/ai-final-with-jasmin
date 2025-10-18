const SmppClient = require("../models/SmppCarrier");

exports.createHttpClient = async (req, res) => {
  
  const { uniqueId, host, port, username, password } = req.body;

  if (!uniqueId || !host || !port || !username || !password ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newHttpClient = new SmppClient({ uniqueId, host, port, username, password });
    await newHttpClient.save();

    res.status(201).json({
      message: "SMPP Carrier created successfully!",
      smppClient: newHttpClient,
    });
  } catch (error) {
    console.error("Error creating SMPP Carrier:", error);
    res.status(500).json({ message: "Error creating SMPP Carrier", error });
  }
};

exports.getAllHttpClients = async (req, res) => {
  try {
    const httpClients = await SmppClient.find();
    res.json(httpClients);
  } catch (error) {
    console.error("Error fetching SMPP Carrier:", error);
    res.status(500).json({ message: "Error fetching SMPP Carrier", error });
  }
};

exports.updateHttpClient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const httpClient = await SmppClient.findById(id);

    if (!httpClient) {
      return res.status(404).json({ message: "SMPP Carrier not found" });
    }

    const updatedHttpClient = await SmppClient.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: "SMPP Carrier updated successfully", smppClient: updatedHttpClient });
  } catch (error) {
    console.error("Error updating SMPP Carrier:", error);
    res.status(500).json({ message: "Error updating SMPP Carrier", error });
  }
};

exports.deleteHttpClient = async (req, res) => {
  const { id } = req.params;

  try {
    const httpClient = await SmppClient.findById(id);

    if (!httpClient) {
      return res.status(404).json({ message: "SMPP Carrier not found" });
    }

    await SmppClient.findByIdAndDelete(id);
    res.json({ message: "SMPP Carrier deleted successfully" });
  } catch (error) {
    console.error("Error deleting SMPP Carrier:", error);
    res.status(500).json({ message: "Error deleting SMPP Carrier", error });
  }
};
