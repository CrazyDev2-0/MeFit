const router = require("express").Router();
const Utils = require("../../helper/utils");
const ResponseSchema = require("../../models/responseSchema");
const prisma = require("../../singletons/db_client").getInstance();

// Request Patient to give access to doctor
router.post("/request", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["email"])) {
      const  patient = await prisma.user.findFirstOrThrow({
        where: {
          email: req.body.email,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const doctor = await prisma.doctor.findFirstOrThrow({
        where: {
            id: req.user.id,
        },
        select:{
            id: true,
            name: true,
            email: true,
        }
      })

      const record  =await prisma.accessRequest.create({
        data:{
          doctorId: doctor.id,
          userId: patient.id,
          requestedOn: Date.now(),
        },
        select:{
          id: true
        }
      })

      let message = `Doctor ${doctor.name} has requested access to your vital records. Please open this link to grant access: ${process.env.SERVER_BASE_URL_CONSUMER_CALLBACK}/approve/doctor-access/${record.id} Ignore this email if you do not want to grant access.`;
      
      const mq = await require("../../singletons/mq_manager").getInstance();
      await mq.sendMessageToQueue("notification", {
        "isPatient" : true,
        "patientId": patient.id,
        "cause" : "dataAccessRequestDoctor",
        "message": message
      }, true)

      response.setSuccess(true, "Request sent");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Request Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Fetch all patients
router.get("/all", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const patientAccessRecord = await prisma.patientDataAccess.findMany({
      where: {
        doctorId: req.user.id,
      },
      select: {
        id: true,
        user:{
            select:{
              id: true,
              name: true,
              email: true,
              profile:{
                select:{
                  id: true,
                  age: true,
                  bloodGroup: true,
                  gender: true,
                }
              }
            }
        }
      }
    });

    let patientList = [];
    for (let i = 0; i < patientAccessRecord.length; i++) {
      const record = patientAccessRecord[i];
      patientList.push(record.user);
    }

    response.setSuccess(true, "Patients fetched successfully");
    response.setStatusCode(200);
    response.setPayload(patientList);
  } catch (err) {
    console.log(err);
    response.setSuccess(false, err.message);
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
})

// Fetch one patient data
router.get("/details/:patientId", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const patient = await prisma.user.findFirstOrThrow({
      where: {
        id: req.params.patientId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            id: true,
            age: true,
            bloodGroup: true,
            gender: true,
          }
        }
      }
    });

    response.setSuccess(true, "Patient fetched successfully");
    response.setStatusCode(200);
    response.setPayload(patient);
  } catch (err) {
    console.log(err);
    response.setSuccess(false, err.message);
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
})

// Fetch latest patient data
router.get("/latest/:patientId", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    await prisma.patientDataAccess.findFirstOrThrow({
      where: {
        doctorId: req.user.id,
        userId: req.params.patientId
      }
    })
    
    const vitalCodesRecords = await prisma.vital.findMany({
      select: {
        id: true,
        code: true
      }
    })

    let latestData = {};

    for (let i = 0; i < vitalCodesRecords.length; i++) {
      const vitalCodeRecord = vitalCodesRecords[i];
      const vitalLatestData = await prisma.vitalData.findFirst({
        where: {
          vitalId: vitalCodeRecord.id,
          userId: req.params.patientId
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
router.get("/data/old/:vitalCode/:patientId", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    await prisma.patientDataAccess.findFirstOrThrow({
      where: {
        doctorId: req.user.id,
        userId: req.params.patientId
      }
    })
    const oldestTimestampOfAllRecord = parseInt(req.query.t) || Date.now();
    const pageSize = parseInt(req.query.p) || 100;

    const data = await prisma.vitalData.findMany({
      take: pageSize,
      where:{
        userId: req.params.patientId,
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
router.get("/data/new/:vitalCode/:patientId", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    await prisma.patientDataAccess.findFirstOrThrow({
      where: {
        doctorId: req.user.id,
        userId: req.params.patientId
      }
    })
    const newestTimestampOfAllRecord = parseInt(req.query.t) || Date.now();
    const pageSize = parseInt(req.query.p) || 100;

    const data = await prisma.vitalData.findMany({
      take: pageSize,
      where:{
        userId: req.params.patientId,
        vital:{
          code: req.params.vitalCode
        },
        timestamp: {
          gte: newestTimestampOfAllRecord
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
