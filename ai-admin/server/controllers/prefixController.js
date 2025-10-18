const fs = require('fs');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const Prefix = require('../models/Prefix');
const path = require('path');

module.exports.ImportCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    try {
        let results = [];

        // Helper to clean keys and values
        const cleanData = (rows) =>
            rows.map((row) => {
                const cleanedRow = {};
                for (const key in row) {
                    const cleanKey = key.trim();
                    const value = row[key];
                    cleanedRow[cleanKey] =
                        typeof value === 'string' ? value.trim() : value;
                }
                return cleanedRow;
            });

        if (ext === '.csv') {
            // Handle CSV
            fs.createReadStream(req.file.path)
                .pipe(csvParser())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    const cleaned = cleanData(results);
                    await Prefix.insertMany(cleaned);
                    res.status(200).json({ message: 'CSV data imported successfully' });
                });
        } else if (ext === '.xlsx') {
            // Handle XLSX
            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            const cleaned = cleanData(data);
            await Prefix.insertMany(cleaned);
            res.status(200).json({ message: 'XLSX data imported successfully' });
        } else {
            return res.status(400).json({ message: 'Unsupported file type. Use CSV or XLSX.' });
        }

    } catch (err) {
        res.status(500).json({ message: `Error occurred: ${err.message}` });
    }
};


// Controller to add a single record to the database
module.exports.AddPrefix = async (req, res) => {
    try {
        const record = req.body;

        if (!record) {
            return res.status(400).json({ message: 'Missing data in request body' });
        }

        const newPrefix = new Prefix(record);  // Dynamically adding fields
        await newPrefix.save();
        res.status(200).json({ message: 'Prefix added successfully' });
    } catch (err) {
        res.status(500).json({ message: `Error occurred: ${err.message}` });
    }
};

// Fetch country code (CC) by country
module.exports.getCountryCode = async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ message: 'Country is required' });

        const countryCode = await Prefix.findOne({ Country: country }, 'CC');

        if (!countryCode) return res.status(404).json({ message: 'Country code not found' });

        res.status(200).json({ country_code: countryCode.CC });
    } catch (err) {
        res.status(500).json({ message: `Error: ${err.message}` });
    }
};


// Controller to fetch MCC codes by country
module.exports.MCCByCountry = async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) {
            return res.status(400).json({ message: 'Country parameter is required' });
        }

        const mccs = await Prefix.distinct('MCC', { Country: country });
        res.status(200).json({ unique_mcc: mccs });
    } catch (err) {
        res.status(500).json({ message: `Error occurred: ${err.message}` });
    }
};

// Controller to fetch unique countries from the database
module.exports.UniqueCountries = async (req, res) => {
    try {
        const uniqueCountries = await Prefix.distinct('Country');
        res.status(200).json({ unique_countries: uniqueCountries });
    } catch (err) {
        res.status(500).json({ message: `Error occurred: ${err.message}` });
    }
};

// Fetch all operators by country
module.exports.getOperatorsByCountry = async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ message: 'Country is required' });

        const operators = await Prefix.distinct('Operetor name', { Country: country });
        res.status(200).json({ operators });
    } catch (err) {
        res.status(500).json({ message: `Error: ${err.message}` });
    }
};

// Fetch MNC by operator (within a country)

module.exports.getMNCByOperator = async (req, res) => {
    try {
        const { country, operator } = req.query;
        if (!country || !operator) return res.status(400).json({ message: 'Country and operator are required' });

        const mncs = await Prefix.distinct('MNC', { Country: country, "Operetor name ": operator });
        res.status(200).json({ mncs });
    } catch (err) {
        res.status(500).json({ message: `Error: ${err.message}` });
    }
};

// Fetch prefixes by MNC (within an operator)

module.exports.getPrefixByMNC = async (req, res) => {
    try {
        const { country, operator, mnc } = req.query;
        if (!country || !operator || !mnc) return res.status(400).json({ message: 'Country, operator, and MNC are required' });

        const prefixes = await Prefix.distinct('Prefix', { Country: country, "Operetor name ": operator, MNC: mnc });
        res.status(200).json({ prefixes });
    } catch (err) {
        res.status(500).json({ message: `Error: ${err.message}` });
    }
};


// Add or Update Filter Data

module.exports.addFilterToDB = async (req, res) => {
    try {
        const { filterId, filterType, prefix, country, operator, mnc, costPrice, sellingPrice,filterP,group,routesmpp,cc } = req.body;

        if (!filterId || !filterType) {
            return res.status(400).json({ message: "filterId and filterType are required" });
        }

        const prefixArray = Array.isArray(prefix) ? prefix : prefix?.split(",").map(item => item.trim());

        // Check if the filterId already exists
        let existingFilter = await Filter.findOne({ filterId });

        if (existingFilter) {
            // Update existing record
            existingFilter.filterType = filterType;
            existingFilter.filterP = filterP || existingFilter.filterP;
            existingFilter.prefix = prefix || existingFilter.prefix;
            existingFilter.country = country || existingFilter.country;
            existingFilter.operator = operator || existingFilter.operator;
            existingFilter.mnc = mnc || existingFilter.mnc;
            existingFilter.costPrice = costPrice || existingFilter.costPrice;
            existingFilter.sellingPrice = sellingPrice || existingFilter.sellingPrice;
            existingFilter.group = group || existingFilter.group;
            existingFilter.routesmpp = routesmpp || existingFilter.routesmpp;
            existingFilter.cc = routesmpp || existingFilter.cc;

            await existingFilter.save();
            return res.status(200).json({ message: "Filter updated successfully", data: existingFilter });
        }

        // Create a new filter if it does not exist
        const newFilter = new Filter({
            filterId,
            filterType,
            filterP,
            prefix,
            country,
            operator,
            mnc,
            costPrice,
            sellingPrice,
            group,
            routesmpp,
            cc
        });

        await newFilter.save();
        return res.status(201).json({ message: "Filter added successfully", data: newFilter });

    } catch (error) {
        return res.status(500).json({ message: `Error: ${error.message}` });
    }
};


// Fetch all filters
// router.get('/getAllFilters', async (req, res) => {
//     try {
//         const filters = await Filter.find();
//         return res.status(200).json(filters);
//     } catch (error) {
//         return res.status(500).json({ message: `Error: ${error.message}` });
//     }
// });

// Fetch a single filter by ID
// router.get('/getFilterById/:filterId', async (req, res) => {
//     try {
//         const { filterId } = req.params;
//         const filter = await Filter.findOne({ filterId });

//         if (!filter) {
//             return res.status(404).json({ message: "Filter not found" });
//         }

//         return res.status(200).json(filter);
//     } catch (error) {
//         return res.status(500).json({ message: `Error: ${error.message}` });
//     }
// });