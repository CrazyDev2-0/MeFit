const router = require("express").Router();

// Setup monitoring
router.use("/setup", require("./monitoring/setup.route"));
// Fetch disease data
router.use("/disease", require("./monitoring/disease.route"));
// Personalized monitoring records and stop monitoring API
router.use("/records", require("./monitoring/records.route"));

module.exports = router;
