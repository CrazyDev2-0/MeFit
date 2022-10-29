const router = require("express").Router();
const ResponseSchema = require("../models/responseSchema");
const Utils = require("../helper/utils");
const prisma = require("../singletons/db_client").getInstance();
const MQManager = require("../singletons/mq_manager");

// Log detected issues
router.post("/detected", async (req, res, next) => {
  response = new ResponseSchema();
  try {
    if (
      Utils.checkParamsPresence(req.body, [
        "userId",
        "reoprtedByName",
        "cause",
        "riskLevel",
        "diseaseId",
      ])
    ) {
      //  dont add to db and dont act if the same disease with same severity reported within 1 hour
      // Check for old detected event with same riskLevel and same disease and userId and with same reporter
      const count = await prisma.detectionHistory.count({
        where:{
          userId: req.body.userId,
          reoprtedByName: req.body.reoprtedByName,
          diseaseId: req.body.diseaseId,
          riskLevel: req.body.riskLevel,
          detectedOn:{
            gte: Date.now() - 60 * 60 * 1000
          }
        }
      })

      if(true){
        // TODO fix this

        // Create new detected event
        const data = await prisma.detectionHistory.create({
          data: {
            userId: req.body.userId,
            reoprtedByName: req.body.reoprtedByName,
            cause: req.body.cause,
            riskLevel: req.body.riskLevel,
            diseaseId: req.body.diseaseId,
            detectedOn: Date.now(),
          },
          select: {
            id: true,
            reoprtedByName: true,
            cause: true,
            riskLevel: true,
            disease: {
              select: {
                name: true,
                description: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            detectedOn: true
          },
        });

        // MQ instance
        const mqClient = await MQManager.getInstance();
        // Send notification to patient
        await mqClient.sendMessageToQueue("notification", {
          "isPatient": true,
          "patientId": data.user.id,
          "data": data,
          "cause": "detectionAlert",
          "message" : "You have been detected with " + data.disease.name + " with risk level " + data.riskLevel,
        }, true)



        // Send alerts to doctor
        if (req.body.personalizedMonitoringId) {
          try {
            console.log(req.body.personalizedMonitoringId)
            const personalizedMonitoringRecord =
              await prisma.personalizedMonitoring.findFirstOrThrow({
                where: {
                  id: req.body.personalizedMonitoringId,
                },
                select: {
                  doctorId: true,
                },
              });
            console.log(personalizedMonitoringRecord.doctorId);
            if (personalizedMonitoringRecord.doctorId != null) {
              await mqClient.sendMessageToQueue("notification", {
                "isPatient": false,
                "doctorId": personalizedMonitoringRecord.doctorId,
                "data": data,
                "cause": "detectionAlert",
                "message" : data.user.name+" have been detected with " + data.disease.name + " with risk level " + data.riskLevel,
              }, true)
            }
          } catch (error) {
            console.log(error);
          }
        }
      }

      response.setSuccess(true, "OK");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Fetch latest vitals of a user
router.get("/vital/latest/:userId", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const vitalCodesRecords = await prisma.vital.findMany({
      select: {
        id: true,
        code: true,
      },
    });

    let latestData = {};

    for (let i = 0; i < vitalCodesRecords.length; i++) {
      const vitalCodeRecord = vitalCodesRecords[i];
      const vitalLatestData = await prisma.vitalData.findFirst({
        where: {
          vitalId: vitalCodeRecord.id,
          userId: req.params.userId,
        },
        orderBy: {
          timestamp: "desc",
        },
        select: {
          val: true,
          timestamp: true,
        },
      });
      if (vitalLatestData) {
        latestData[vitalCodeRecord.code] = {
          val: vitalLatestData.val,
          timestamp: vitalLatestData.timestamp,
        };
      } else {
        latestData[vitalCodeRecord.code] = {
          val: -1,
          timestamp: -1,
        };
      }
    }

    response.setSuccess(true, "Vitals Fetched");
    response.setStatusCode(200);
    response.setPayload(latestData);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Fetch one single vitals data between a given timerange
// Pagination enabled
router.get("/vital/data/:vitalCode/:userId/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const startTimestamp = parseInt(req.query.start) || 0;
    const endTimestamp = parseInt(req.query.end) || Date.now();
    const pageSize = parseInt(req.query.p) || 1000;

    const data = await prisma.vitalData.findMany({
      take: pageSize,
      where: {
        userId: req.params.userId,
        vital: {
          code: req.params.vitalCode,
        },
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      select: {
        val: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    const finalData = [];

    for (let i = 0; i < data.length; i++) {
      finalData.push([data[i].val, data[i].timestamp]);
    }

    response.setSuccess(true, "Vitals Fetched");
    response.setStatusCode(200);
    response.setPayload(finalData);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

router.post("/vital/bulkdata/:userId/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const vitalCodes = req.body.vitals;
    const take = 1000;
    const skip = req.body.skip || 0;

    let fetchedData = {};

    for (let i = 0; i < vitalCodes.length; i++) {
      const code = vitalCodes[i];
      const data = await prisma.vitalData.findMany({
        take: take,
        skip: skip,
        where: {
          userId: req.params.userId,
          vital: {
            code: code
          },
          AND: [
            {
              timestamp: {
                gte: req.body.start,
              },
            },
            {
              timestamp: {
                lt: req.body.end,
              },
            },
          ],
        },
        orderBy: {
          timestamp: "asc",
        },
        select: {
          id: true,
          vital: {
            select: {
              code: true,
            },
          },
          val: true,
          timestamp: true,
        },
      });
      fetchedData[code] = data;
    }

    let finalData = [];
    let currentIndexes = [];
    for (let i = 0; i < vitalCodes.length; i++) {
      currentIndexes.push(0);
    }


    let totalDatasPerVital = {};
    for (let i = 0; i < vitalCodes.length; i++) {
      const vital = vitalCodes[i];
      totalDatasPerVital[vital] = fetchedData[vital].length;
    }

    let lastVitalRecord = {};

    for (let i = 0; i < vitalCodes.length; i++) {
      const code = vitalCodes[i];
      lastVitalRecord[code] = fetchedData[code][currentIndexes[i]].val;
    }

    // [spo2,pulse,resp,abp0,abp1,abp2,hr]

    let shouldContinue = true;

    do {
      for (let i = 0; i < vitalCodes.length; i++) {
        const el = vitalCodes[i];
        shouldContinue = shouldContinue && currentIndexes[i] < totalDatasPerVital[el];
      }

      if (!shouldContinue) break;
      // calulate min timestamp
      let mintimestamp = fetchedData[vitalCodes[0]][currentIndexes[0]].timestamp;
      for (let i = 1; i < vitalCodes.length; i++) {
        const code = vitalCodes[i];
        if (mintimestamp > fetchedData[code][currentIndexes[i]].timestamp) {
          mintimestamp = fetchedData[code][currentIndexes[i]].timestamp;
        }
      }

      // serialize data
      let tmpArr = [];
      for (let i = 0; i < vitalCodes.length; i++) {
        const code = vitalCodes[i];
        if (fetchedData[code][currentIndexes[i]].timestamp == mintimestamp) {
          tmpArr.push(fetchedData[code][currentIndexes[i]].val);
          lastVitalRecord[code] = fetchedData[code][currentIndexes[i]].val;
          currentIndexes[i]++;
        } else {
          tmpArr.push(lastVitalRecord[code]);
        }
      }

      finalData.push(tmpArr);
    } while (shouldContinue);



    //  Go through the records and check if the timestamp matches
    // If vital data is not present for a timestamp, then add -1


    response.setSuccess(true, "Vitals Fetched");
    response.setStatusCode(200);
    response.setPayload(finalData);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
