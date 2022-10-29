const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();

// Fetch all records
router.get("/all", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const todayBeginningTimestamp = Utils.getUnixTimestampOfBeginingOfToday();
    const todayEndTimestamp = Utils.getUnixTimestampOfEndOfToday();
    // Fetch today's all step count
    let totalStepsCount = await prisma.vitalData.aggregate({
      where: {
        userId: req.user.id,
        vital: {
          code: "steps_walked",
        },
        AND: [
          {
            timestamp: {
              gte: todayBeginningTimestamp,
            },
          },
          {
            timestamp: {
              lte: todayEndTimestamp,
            },
          },
        ],
      },
      _sum: {
        val: true,
      },
    });

    totalStepsCount = totalStepsCount._sum.val || 0;

    // Fetch today's all calories count
    let totalCaloriesCount = await prisma.vitalData.aggregate({
      where: {
        userId: req.user.id,
        vital: {
          code: "calorie",
        },
        AND: [
          {
            timestamp: {
              gte: todayBeginningTimestamp,
            },
          },
          {
            timestamp: {
              lte: todayEndTimestamp,
            },
          },
        ],
      },
      _sum: {
        val: true,
      },
    });

    totalCaloriesCount = totalCaloriesCount._sum.val || 0;

    // let datas = await prisma.personalizedMonitoring.findMany({
    //   where: {
    //     userId: req.user.id,
    //     isLive: true,
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     assigneeType: true,
    //     isLive: true,
    //     isMonitorCalorieCount: true,
    //     minCalorieCount: true,
    //     isMonitorStepCount: true,
    //     minStepCount: true,
    //     isPredictionModelAssigned: true,
    //     predictionModel: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //     intervalSeconds: true,
    //     vitalThreshold: {
    //       select: {
    //         vital: {
    //           select: {
    //             name: true,
    //             unit: true,
    //           },
    //         },
    //         min: true,
    //         max: true,
    //         threshold: true,
    //         isNegativeThreshold: true,
    //         longTermMonitoringRequired: true,
    //         rate: true,
    //       },
    //     },
    //   },
    // });

    let datas = await prisma.personalizedMonitoring.findMany({
      where: {
        userId: req.user.id,
        isLive: true,
      },
      select: {
        id: true,
        name: true,
        assigneeType: true,
        doctor:{
          select:{
            name:true
          }
        },
        isLive: true,
        isMonitorCalorieCount: true,
        minCalorieCount: true,
        isMonitorStepCount: true,
        minStepCount: true,
        isPredictionModelAssigned: true,
        predictionModel: {
          select: {
            name: true,
          },
        },
        intervalSeconds: true,
        vitalThreshold: {
          select: {
            vital: {
              select: {
                name: true,
                unit: true,
              },
            }
          },
        },
      },
    });


    for (let i = 0; i < datas.length; i++) {
      datas[i]["currentSteps"] = totalStepsCount;
      datas[i]["currentCalories"] = totalCaloriesCount;
    }

    response.setSuccess(true, "Fetched monitoring data");
    response.setStatusCode(200);
    response.setPayload(datas);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Disable monitoring
router.post("/disable", async (req, res, next) => {
  response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["monitoringId"])) {
      const monitoring = await prisma.personalizedMonitoring.findFirstOrThrow({
        where: {
          id: req.body.monitoringId,
          userId: req.user.id,
        },
        select: {
          isLive: true,
          assigneeType: true,
        },
      });
      if (monitoring.isLive == false) {
        response.setSuccess(false, "Monitoring already disabled");
        response.setStatusCode(200);
      } else if (monitoring.assigneeType != "patient") {
        response.setSuccess(
          false,
          "Only doctor or hospital can disable monitoring"
        );
        response.setStatusCode(200);
      } else {
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
      }
    } else {
      response.setSuccess(false, "Missing parameters");
      response.setStatusCode(200);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Failed to disable");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
