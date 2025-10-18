const HttpCarrier = require("../models/HttpCarrier");

exports.createHttpCarrier = async (req, res) => {
  const { uniqueId, url, httpMethod,password } = req.body;

  if (!uniqueId || !url || !httpMethod || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newHttpCarrier = new HttpCarrier({ uniqueId, url, httpMethod, password });
    await newHttpCarrier.save();

    res.status(201).json({
      message: "HTTP Carrier created successfully!",
      httpCarrier: newHttpCarrier,
    });
  } catch (error) {
    console.error("Error creating HTTP Carrier:", error);
    res.status(500).json({ message: "Error creating HTTP Carrier", error });
  }
};

exports.getAllHttpCarriers = async (req, res) => {
  try {
    const httpCarriers = await HttpCarrier.find();
    res.json(httpCarriers);
  } catch (error) {
    console.error("Error fetching HTTP Carriers:", error);
    res.status(500).json({ message: "Error fetching HTTP Carriers", error });
  }
};

exports.updateHttpCarrier = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const httpCarrier = await HttpCarrier.findById(id);

    if (!httpCarrier) {
      return res.status(404).json({ message: "HTTP Carrier not found" });
    }

    const updatedHttpCarrier = await HttpCarrier.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: "HTTP Carrier updated successfully", httpCarrier: updatedHttpCarrier });
  } catch (error) {
    console.error("Error updating HTTP Carrier:", error);
    res.status(500).json({ message: "Error updating HTTP Carrier", error });
  }
};

exports.deleteHttpCarrier = async (req, res) => {
  const { id } = req.params;

  try {
    const httpCarrier = await HttpCarrier.findById(id);

    if (!httpCarrier) {
      return res.status(404).json({ message: "HTTP Carrier not found" });
    }

    await HttpCarrier.findByIdAndDelete(id);
    res.json({ message: "HTTP Carrier deleted successfully" });
  } catch (error) {
    console.error("Error deleting HTTP Carrier:", error);
    res.status(500).json({ message: "Error deleting HTTP Carrier", error });
  }
};
