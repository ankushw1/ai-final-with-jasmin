const Reseller = require('../models/Reseller');  
const Customer = require('../models/Customer');  
// const Account = require('../models/Rates');  
const Sales = require('../models/Sales');  
const Billing = require('../models/Billing');  
const Support = require('../models/Support');  
const Management = require('../models/Management');  
const Routing = require('../models/Routing');  
const SmppCarrier = require('../models/SmppCarrier')
const SmppClient = require('../models/SmppClient')
const HttpCarrier = require('../models/HttpCarrier')
const HttpClient = require('../models/HttpClient')

const { verifyToken } = require('../middleware/authMiddleware');  

exports.activateReseller = async (req, res) => {
    try {
        const reseller = await Reseller.findById(req.params.id);

        if (req.user.role === 1) {
            reseller.isActive = req.body.isActive; // true to activate, false to deactivate
            await reseller.save();
            return res.status(200).json({ message: 'Reseller status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this reseller.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 || (req.user.role === 2 )) {
            customer.isActive = req.body.isActive; // true to activate, false to deactivate
            await customer.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateAccounts = async (req, res) => {
    try {
        const account = await Account.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            account.isActive = req.body.isActive; // true to activate, false to deactivate
            await account.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateSales = async (req, res) => {
    try {
        const sales = await Sales.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateSupport = async (req, res) => {
    try {
        const sales = await Support.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateBilling = async (req, res) => {
    try {
        const sales = await Billing.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateManagement = async (req, res) => {
    try {
        const sales = await Management.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateAccountManager = async (req, res) => {
    try {
        const sales = await Routing.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'Customer status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this customer.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateSmppCarrier = async (req, res) => {
    try {
        const sales = await SmppCarrier.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'SmppCarrier status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this SmppCarrier.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateSmppClient = async (req, res) => {
    try {
        const sales = await SmppClient.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'SmppClient status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this SmppClient.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateHttpCarrier = async (req, res) => {
    try {
        const sales = await HttpCarrier.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'HttpClient status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this HttpClient.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

exports.activateHttpClient = async (req, res) => {
    try {
        const sales = await HttpClient.findById(req.params.id);

        // Check if the user is an admin or a reseller managing the customer
        if (req.user.role === 1 ) {
            sales.isActive = req.body.isActive; // true to activate, false to deactivate
            await sales.save();
            return res.status(200).json({ message: 'HttpClient status updated successfully.' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to update this HttpClient.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};