const express = require('express');
const multer = require('multer');
const path = require('path');
const PrefixController = require('../controllers/prefixController'); // Path to your controller file

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: './uploads' });  // You can configure the file storage as needed

// Route for Bulk CSV import (using POST)
router.post('/upload_prefix', upload.single('file'), PrefixController.ImportCSV);

// Route to add a single prefix record (using POST)
router.post('/add_prefix', PrefixController.AddPrefix);

// Route to fetch MCC codes by country (using GET)
router.get('/mcc_by_country', PrefixController.MCCByCountry);

// Route to fetch unique countries (using GET) // our imp
router.get('/countries', PrefixController.UniqueCountries);
router.get('/operators', PrefixController.getOperatorsByCountry);
router.get('/mncs', PrefixController.getMNCByOperator);
router.get('/prefixes', PrefixController.getPrefixByMNC);
router.get('/cc', PrefixController.getCountryCode);


// DB logic
router.post('/addfiltertodb', PrefixController.addFilterToDB);


module.exports = router;


// all curls
// curl -X GET "http://localhost:2223/api/mcc_by_country?country=India"
// curl -X GET http://localhost:2223/api/unique_countries
// curl -X POST http://localhost:2223/api/add_prefix \
//   -H "Content-Type: application/json" \
//   -d '{
//     "Country": "India",
//     "CC": "91",
//     "Prefix": "123",
//     "OperatorName": "Airtel",
//     "MCC": "404",
//     "MNC": "12"
//   }'
// curl -X POST http://localhost:2223/api/upload_prefix \
//   -F "file=@/path/to/your/file.csv"