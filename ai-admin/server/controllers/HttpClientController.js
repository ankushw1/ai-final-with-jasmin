const HttpClient = require("../models/HttpClient");

exports.createHttpClient = async (req, res) => {
  const { uniqueId, url, httpMethod, user,password } = req.body;

  if (!uniqueId || !url || !httpMethod || !user || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newHttpClient = new HttpClient({ uniqueId, url, httpMethod, user,password });
    await newHttpClient.save();

    res.status(201).json({
      message: "HTTP Client created successfully!",
      httpClient: newHttpClient,
    });
  } catch (error) {
    console.error("Error creating HTTP Client:", error);
    res.status(500).json({ message: "Error creating HTTP Client", error });
  }
};

exports.getAllHttpClients = async (req, res) => {
  try {
    const httpClients = await HttpClient.find();
    res.json(httpClients);
  } catch (error) {
    console.error("Error fetching HTTP Clients:", error);
    res.status(500).json({ message: "Error fetching HTTP Clients", error });
  }
};

exports.updateHttpClient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const httpClient = await HttpClient.findById(id);

    if (!httpClient) {
      return res.status(404).json({ message: "HTTP Client not found" });
    }

    const updatedHttpClient = await HttpClient.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: "HTTP Client updated successfully", httpClient: updatedHttpClient });
  } catch (error) {
    console.error("Error updating HTTP Client:", error);
    res.status(500).json({ message: "Error updating HTTP Client", error });
  }
};

exports.deleteHttpClient = async (req, res) => {
  const { id } = req.params;

  try {
    const httpClient = await HttpClient.findById(id);

    if (!httpClient) {
      return res.status(404).json({ message: "HTTP Client not found" });
    }

    await HttpClient.findByIdAndDelete(id);
    res.json({ message: "HTTP Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting HTTP Client:", error);
    res.status(500).json({ message: "Error deleting HTTP Client", error });
  }
};
