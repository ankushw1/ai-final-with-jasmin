const axios = require('axios');
const Group = require('../models/Group');

const JASMIN_BASE_URL = process.env.JASMIN_BASE_URL || 'http://185.169.252.75:8000';

// Reuse auth headers (Bearer token from request header)
const getAuthHeader = (req) => ({
    headers: {
        'Authorization': req.headers.authorization || '', // Expecting "Bearer <token>"
    }
});

// Get All SMS Groups
exports.getSmsGroups = async (req, res) => {
    try {
        const response = await axios.get(`${JASMIN_BASE_URL}/api/groups/`, getAuthHeader(req));
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch groups', details: error.response?.data || error.message });
    }
};

// Enable SMS Group
exports.enableSmsGroup = async (req, res) => {
    const { groupName } = req.query;

    if (!groupName) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const response = await axios.put(`${JASMIN_BASE_URL}/api/groups/${groupName}/enable/`, {}, getAuthHeader(req));
        res.status(200).json({ message: 'Group enabled', data: response.data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to enable group', details: error.response?.data || error.message });
    }
};

// Disable SMS Group
exports.disableSmsGroup = async (req, res) => {
    const { groupName } = req.query;

    if (!groupName) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const response = await axios.put(`${JASMIN_BASE_URL}/api/groups/${groupName}/disable/`, {}, getAuthHeader(req));
        res.status(200).json({ message: 'Group disabled', data: response.data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disable group', details: error.response?.data || error.message });
    }
};

// Add SMS Group
exports.addSmsGroup = async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const existing = await Group.findOne({ name: groupName });
        if (existing) {
            return res.status(400).json({ error: 'Group already exists in database' });
        }

        const response = await axios.post(
            `${JASMIN_BASE_URL}/api/groups/`,
            { name: groupName },
            {
                ...getAuthHeader(req),
                headers: {
                    ...getAuthHeader(req).headers,
                    'Content-Type': 'application/json'
                }
            }
        );

        const newGroup = new Group({ name: groupName });
        await newGroup.save();

        res.status(200).json({ message: 'Group added', data: response.data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add group', details: error.response?.data || error.message });
    }
};

// Delete SMS Group
exports.deleteSmsGroup = async (req, res) => {
    const { groupName } = req.query;

    if (!groupName) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const response = await axios.delete(`${JASMIN_BASE_URL}/api/groups/${groupName}/`, getAuthHeader(req));
        await Group.deleteOne({ name: groupName });

        res.status(200).json({ message: 'Group deleted', data: response.data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete group', details: error.response?.data || error.message });
    }
};
