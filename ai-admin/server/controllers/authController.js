const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Admin model
const Reseller = require('../models/Reseller'); // Reseller model
const Customer = require('../models/Customer'); // Customer model

// Get Current User (used for frontend to get the user's details after login)
exports.getCurrentUser = async (req, res) => {
  try {
    // Check if the token is passed in the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Decode the token and get the user id and role
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded; // Extract id and role from the decoded token

    let user;

    // Query the appropriate model based on the role
    if (role === 1) {  // Admin
      user = await Admin.findById(id);
    } else if (role === 2) {  // Reseller
      user = await Reseller.findById(id);
    } else if (role === 3) {  // Customer
      user = await Customer.findById(id);
    } else {
      return res.status(404).json({ message: 'Role not recognized' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user info back to the frontend (you can filter sensitive fields)
    res.json({
      id: user._id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
