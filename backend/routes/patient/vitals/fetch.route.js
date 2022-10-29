const router = require("express").Router();
const Utils = require("../../../helper/utils");
const ResponseSchema = require("../../../models/responseSchema");
const prisma = require("../../../singletons/db_client").getInstance();

// Fetch available vitals info 
// Recommended to store this in a cache of app
router.get("/info", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const vitalsInfo = await prisma.vital.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        canReceiveFromDevice: true
      }
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
})


// Fetch latest vitals
router.get("/latest", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const vitalCodesRecords = await prisma.vital.findMany({
      select: {
        id: true,
        code: true
      }
    })

    let latestData = {};
    const todayStartTimestamp = Utils.getUnixTimestampOfBeginingOfToday();


    for (let i = 0; i < vitalCodesRecords.length; i++) {
      const vitalCodeRecord = vitalCodesRecords[i];

      if(vitalCodeRecord.code == "sleep" || vitalCodeRecord.code == "calorie" || vitalCodeRecord.code == "steps_walked"){
        // Show sum of steps of last 24 hrs for steps_walked, calories_burned, sleep
        const val_total = await prisma.vitalData.aggregate({
          where: {
            vitalId: vitalCodeRecord.id,
            userId: req.user.id,
            timestamp: {
              gte: todayStartTimestamp
            }
          },
          _sum: {
            val: true
          }
        })
        latestData[vitalCodeRecord.code] = {
          val:  val_total._sum.val ? val_total._sum.val : -1,
          timestamp: -1
        };
      }else{
        const vitalLatestData = await prisma.vitalData.findFirst({
          where: {
            vitalId: vitalCodeRecord.id,
            userId: req.user.id
          },
          orderBy: {
            timestamp: "desc"
          },
          select:{
            val: true,
            timestamp: true
          }
        })
        if (vitalLatestData) {
          latestData[vitalCodeRecord.code] = {
            val: vitalLatestData.val,
            timestamp: vitalLatestData.timestamp
          };
        }else{
          latestData[vitalCodeRecord.code] = {
            val: -1,
            timestamp: -1
          };
        }
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

// Fetch one single vitals past data
// Pagination enabled
// Send oldest records timestamp
// Default page size is 100
router.get("/data/old/:vitalCode/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const oldestTimestampOfAllRecord = parseInt(req.query.t) || Date.now();
    const pageSize = parseInt(req.query.p) || 100;

    const data = await prisma.vitalData.findMany({
      take: pageSize,
      where:{
        userId: req.user.id,
        vital:{
          code: req.params.vitalCode
        },
        timestamp: {
          lt: oldestTimestampOfAllRecord
        }
      },
      orderBy:{
        timestamp: "desc"
      }
    })
    response.setSuccess(true, "Vitals Fetched");
    response.setStatusCode(200);
    response.setPayload(data);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});


// Fetch one single vitals new data
// Pagination enabled
// Send latest records timestamp
// Default page size is 100
router.get("/data/new/:vitalCode/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const newestTimestampOfAllRecord = parseInt(req.query.t) || Date.now();
    const pageSize = parseInt(req.query.p) || 100;

    const data = await prisma.vitalData.findMany({
      take: pageSize,
      where:{
        userId: req.user.id,
        vital:{
          code: req.params.vitalCode
        },
        timestamp: {
          gt: newestTimestampOfAllRecord
        }
      },
      orderBy:{
        timestamp: "desc"
      }
    })
    response.setSuccess(true, "Vitals Fetched");
    response.setStatusCode(200);
    response.setPayload(data);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
