const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();

// Fetch all diseases
router.get("/all", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const diseases = await prisma.disease.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    response.setSuccess(true, "Fetched diseases database");
    response.setStatusCode(200);
    response.setPayload(diseases);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Fetch all details of disease
router.get("/details/:id", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const profile = await prisma.profile.findFirst({
        where:{
            userId: req.user.id
        },
        select:{
            gender: true,
            age: true
        }
    })
    const disease = await prisma.disease.findFirst({
        where:{
            id: req.params.id
        },
        select:{
            name: true,
            description: true,
            predictionModel:{
                select:{
                    id: true,
                    name: true,
                }
            },
            vitalThresholds:{
                where:{
                    minAge:{
                        lte: profile.age
                    },
                    maxAge:{
                        gte: profile.age
                    },
                    gender: profile.gender
                },
                select:{
                    id: true,
                    vital:{
                        select:{
                            id: true,
                            name: true,
                            canReceiveFromDevice: true
                        }
                    },
                    max: true,
                    min: true,
                    threshold: true,
                    isNegativeThreshold: true,
                    rate: true,
                    longTermMonitoringRequired: true
                }
            }
        }
    })
    response.setSuccess(true, "Fetched disease details");
    response.setStatusCode(200);
    response.setPayload(disease);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Fetch Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
