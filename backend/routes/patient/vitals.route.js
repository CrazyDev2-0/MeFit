const router = require("express").Router();

router.use("/fetch", require("./vitals/fetch.route"));
router.use("/update", require("./vitals/update.route"));


module.exports = router;
