const router = require("express").Router();
const ResponseSchema = require("../models/responseSchema");
const prisma = require("../singletons/db_client").getInstance();


// Fetch available vitals info
// Recommended to store this in a cache of app
router.get("/vitals/info", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const vitalsInfo = await prisma.vital.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        canReceiveFromDevice: true,
      },
    });
    response.setSuccess(true, "System Vitals Fetched");
    response.setStatusCode(200);
    response.setPayload(vitalsInfo);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Manage Patients Route
router.use("/patients", require("./doctor/patients.route"));
// Fetch Disease Details Route
router.use("/disease", require("./doctor/disease.route"));
// Monitoring Config
router.use("/monitoring", require("./doctor/monitoring.route"));
// Detection alert histories
router.use("/alert", require("./doctor/alert.route"));

module.exports = router;
