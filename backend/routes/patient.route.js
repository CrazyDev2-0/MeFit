const router = require("express").Router();


// Manage Account Routes
router.use("/manage", require("./patient/management.route"));
// Vital Related Routes
router.use("/vitals", require("./patient/vitals.route"));
// Detected Events Routes
router.use("/detection", require("./patient/detection.route"));
// Monitoring Routes
router.use("/monitoring", require("./patient/monitoring.route"));


module.exports = router;
