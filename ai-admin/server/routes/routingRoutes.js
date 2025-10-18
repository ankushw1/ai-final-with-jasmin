const express = require("express")
const router = express.Router()
const multer = require("multer")
const rateController = require("../controllers/routingController")
const auth = require("../middleware/authMiddleware")

// Multer setup (for CSV/XLSX file upload)
const upload = multer({ dest: "uploads/" })

// Routes with role-based middleware
router.post("/import-prefix", auth([1]), upload.single("file"), rateController.ImportCSV)
router.post("/import-rates", auth([1]), upload.single("file"), rateController.ImportRatesCSV)
router.get("/rates-by-country", auth([1]), rateController.getRatesByCountry)
router.get("/rates-by-smpp", auth([1]), rateController.getRatesBySMPP) // NEW ROUTE
router.get("/operators-by-country", auth([1]), rateController.getOperatorsByCountryAndSMPP)
router.post("/operator-prefixes", auth([1]), rateController.getOperatorPrefixes)
router.get("/smpps", auth([1]), rateController.getAllSMPPs)
router.get("/countries", auth([1]), rateController.getAllCountries)
router.get("/users", auth([1]), rateController.getAllUsers)
router.get("/all", auth([1]), rateController.getAllRoutings)
router.post("/submitted-routing", rateController.submitDefinedRoutes)
router.post("/country", auth([1]), rateController.addCountry)
router.post("/operator", auth([1]), rateController.addOperator)
router.post("/prefix", auth([1]), rateController.addPrefix)
router.post("/details", auth([1]), rateController.getCountryDetails)
router.post("/detailss", auth([1]), rateController.getCountryDetailss)
router.post("/operators", auth([1]), rateController.getOperatorsByCountry)

// NEW ROUTES
router.get("/usernames-with-routing", auth([1]), rateController.getUsernamesWithRouting)
router.get("/routing/:username", auth([1]), rateController.getRoutingByUsername)

// ALL DATA ROUTES
router.post("/all-operators", auth([1]), rateController.getAllOperators)
router.post("/all-prefixes", auth([1]), rateController.getAllPrefixes)

// CURRENT PAGE CSV EXPORT ROUTES (only export currently displayed data)
router.post("/export-current-countries", auth([1]), rateController.exportCurrentCountriesCSV)
router.post("/export-current-operators", auth([1]), rateController.exportCurrentOperatorsCSV)
router.post("/export-current-prefixes", auth([1]), rateController.exportCurrentPrefixesCSV)

// Download sample CSV template
router.get("/sample-rates-csv", auth([1]), rateController.downloadSampleRatesCSV)

module.exports = router
