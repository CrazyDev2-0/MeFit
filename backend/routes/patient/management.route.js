const router = require("express").Router();


// ##################### DEVICE ##############################
router.use("/device", require("./management/device.route"));
// ##################### Profile ##############################
router.use("/profile", require("./management/profile.route"));
// ####################Emergency Contact ##########################
router.use("/contact", require("./management/emergencyContact.route"))


module.exports = router;
