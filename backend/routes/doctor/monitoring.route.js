const router = require("express").Router();
const ResponseSchema = require("../../models/responseSchema");
const Utils = require("../../helper/utils");
const prisma = require("../../singletons/db_client").getInstance();

// Fetch Prediction Models
router.get("/prediction-models", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const predictionModels = await prisma.predictionModel.findMany({
      select: {
        id: true,
        name: true,
        disease: {
          select: {
            name: true,
            description: true,
          },
        },
        requiredParams: {
          select: {
            id: true,
            name: true,
            vital: {
              select: {
                name: true,
                code: true,
                canReceiveFromDevice: true,
              },
            },
            manualEntryAllowed: true,
          },
        },
      },
    });
    response.setSuccess(true, "Fetched prediction models");
    response.setStatusCode(200);
    response.setPayload(predictionModels);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Setup personalized monitoring from disease
router.post("/setup", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (
      Utils.checkParamsPresence(req.body, [
        "patientId",
        "name",
        "description",
        "vitalThresholds",
        "isPredictionModelAssigned",
        "intervalSeconds",
        "isMonitorStepCount",
        "isMonitorCalorieCount",
        "minStepCount",
        "minCalorieCount"
      ])
    ) {
      console.log(req.body);
      // Check access
      await prisma.patientDataAccess.findFirstOrThrow({
        where: {
          doctorId: req.user.id,
          userId: req.body.patientId,
        },
      });
      // fetch profile
      const profile = await prisma.profile.findFirst({
        where: {
          userId: req.body.patientId,
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
              doctorId: req.user.id,
              userId: req.body.patientId,
              assigneeType: "doctor",
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
              minStepCount: req.body.minStepCount,
              minCalorieCount: req.body.minCalorieCount,
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
            try {
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
            } catch (error) {
              console.log("Erro in adding vital threshold topersonalize monitoring at doctor side")
            }
          }
        },
        {
          timeout: 10000,
        }
      );

      // Find all the vitals that are old more than 2 day or not present
      let required_vitals_update = [];
      for (let i = 0; i < req.body.vitalThresholds.length; i++) {
        let thresholdData = req.body.vitalThresholds[i];
        let vital = await prisma.vitalData.findFirst({
          where: {
            userId: req.body.patientId,
            vitalId: thresholdData.vitalId,
            timestamp : {
              gt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            }
          },
          orderBy:{
            timestamp: "desc"
          }
        });
        if (vital == null) {
          required_vitals_update.push(thresholdData.vitalId);
        }
      }

      if(required_vitals_update.length > 0){
        let tmp = [];
        for (let i = 0; i < required_vitals_update.length; i++) {
          if(required_vitals_update[i] != ""){
            tmp.push({
              "id" : required_vitals_update[i],
            })
          }
        }

        // Create vital request
        let vitalRequest = await prisma.vitalRequest.create({
          data:{
            userId: req.body.patientId,
            vitals:{
              connect:tmp
            },
            requestedOn: Date.now()
          }
        });
        // Send notification to patient
        let mqClient = await require("../../singletons/mq_manager").getInstance();
        await mqClient.sendMessageToQueue("notification", {
          "isPatient": true,
          "patientId": req.body.patientId,
          "cause": "requestVitalUpdate",
          "message" : "Our system has detected that you have not updated your vitals in last 2 days. Please update your vitals to continue monitoring. Form link : " + process.env.SERVER_BASE_URL_CONSUMER_CALLBACK + "/uv/" + vitalRequest.id,
        }, true)
      }
      
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

// Disable monitoring
router.post("/disable", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["monitoringId"])) {
      // Check access
      await prisma.personalizedMonitoring.findFirstOrThrow({
        where: {
          id: req.body.monitoringId,
          doctorId: req.user.id,
        },
      });
      await prisma.personalizedMonitoring.update({
        where: {
          id: req.body.monitoringId,
        },
        data: {
          isLive: false,
        },
      });
      response.setSuccess(true, "Monitoring disabled");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Disable Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Fetch personalized monitoring for patient
router.get("/records", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const monitoringRecords = await prisma.personalizedMonitoring.findMany({
      where: {
        doctorId: req.user.id,
        assigneeType: "doctor",
      },
      select: {
        id: true,
        name: true,
        description: true,
        isLive: true,
        registeredOn: true,
        isPredictionModelAssigned: true,
        predictionModel: {
          select: {
            name: true,
            disease: {
              select: {
                name: true,
              },
            },
          },
        },
        intervalSeconds: true,
        isMonitorStepCount: true,
        isMonitorCalorieCount: true,
        minStepCount: true,
        minCalorieCount: true,
        isLive: true,
        user: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                age: true,
                gender: true,
                bloodGroup: true,
              },
            },
          },
        },
      },
    });
    response.setSuccess(true, "Fetched monitoring records");
    response.setStatusCode(200);
    response.setPayload(monitoringRecords);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
