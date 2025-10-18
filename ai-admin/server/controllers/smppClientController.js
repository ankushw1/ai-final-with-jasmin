const SmppClient = require("../models/SmppClient");

exports.createHttpClient = async (req, res) => {
  const { uniqueId, host, port, username, password,user } = req.body;

  if (!uniqueId || !host || !port || !username || !password ||!user) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newHttpClient = new SmppClient({ uniqueId, host, port, username, password,user });
    await newHttpClient.save();

    res.status(201).json({
      message: "SMPP Client created successfully!",
      smppClient: newHttpClient,
    });
  } catch (error) {
    console.error("Error creating SMPP Client:", error);
    res.status(500).json({ message: "Error creating SMPP Client", error });
  }
};

exports.getAllHttpClients = async (req, res) => {
  try {
    const httpClients = await SmppClient.find();
    res.json(httpClients);
  } catch (error) {
    console.error("Error fetching SMPP Clients:", error);
    res.status(500).json({ message: "Error fetching SMPP Clients", error });
  }
};

exports.updateHttpClient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const httpClient = await SmppClient.findById(id);

    if (!httpClient) {
      return res.status(404).json({ message: "SMPP Client not found" });
    }

    const updatedHttpClient = await SmppClient.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: "SMPP Client updated successfully", smppClient: updatedHttpClient });
  } catch (error) {
    console.error("Error updating SMPP Client:", error);
    res.status(500).json({ message: "Error updating SMPP Client", error });
  }
};

exports.deleteHttpClient = async (req, res) => {
  const { id } = req.params;

  try {
    const httpClient = await SmppClient.findById(id);

    if (!httpClient) {
      return res.status(404).json({ message: "SMPP Client not found" });
    }

    await SmppClient.findByIdAndDelete(id);
    res.json({ message: "SMPP Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting SMPP Client:", error);
    res.status(500).json({ message: "Error deleting SMPP Client", error });
  }
};
