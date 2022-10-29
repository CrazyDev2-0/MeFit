const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();

// Setup personalized monitoring from disease
router.post("/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (
      Utils.checkParamsPresence(req.body, [
        "name",
        "description",
        "vitalThresholds",
        "isPredictionModelAssigned",
        "intervalSeconds",
        "isMonitorStepCount",
        "isMonitorCalorieCount",
      ])
    ) {
      // fetch profile
      const profile = await prisma.profile.findFirst({
        where: {
          userId: req.user.id,
        },
        select: {
          gender: true,
          age: true,
        },
      });
      await prisma.$transaction(
        async (tx) => {
          // Create monitoring
          let monitoring = await tx.personalizedMonitoring.create({
            data: {
              name: req.body.name,
              description: req.body.description,
              userId: req.user.id,
              assigneeType: "patient",
              intervalSeconds: req.body.intervalSeconds,
              isPredictionModelAssigned:
                req.body.isPredictionModelAssigned || false,
              predictionModelId:
                (req.body.isPredictionModelAssigned || false) &&
                req.body.predictionModelId != -1 &&
                req.body.predictionModelId != null
                  ? req.body.predictionModelId
                  : null,
              isMonitorStepCount: req.body.isMonitorStepCount || false,
              isMonitorCalorieCount: req.body.isMonitorCalorieCount || false,
              minStepCount: req.body.minStepCount || null,
              minCalorieCount: req.body.minCalorieCount || null,
              isLive: true,
              registeredOn: Date.now(),
            },
            select: {
              id: true,
            },
          });

          // Add Vitals Thresholds for monitoring
          for (let i = 0; i < req.body.vitalThresholds.length; i++) {
            let thresholdData = req.body.vitalThresholds[i];
            await tx.vitalThreshold.create({
              data: {
                personalizedMonitoringId: monitoring.id,
                vitalId: thresholdData.vitalId,
                maxAge: profile.age + 50,
                minAge: Math.min(profile.age - 1, 0),
                gender: profile.gender,
                min: thresholdData.min,
                max: thresholdData.max,
                threshold: thresholdData.threshold,
                isNegativeThreshold: thresholdData.isNegativeThreshold,
                longTermMonitoringRequired:
                  thresholdData.longTermMonitoringRequired,
                rate: thresholdData.rate,
              },
            });
          }
        },
        {
          timeout: 10000,
        }
      );
      response.setSuccess(true, "Monitoring setup successful");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Creation Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
