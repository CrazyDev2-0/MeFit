const router = require("express").Router();
const ResponseSchema = require("../../models/responseSchema");
const prisma = require("../../singletons/db_client").getInstance();


// Send last 50 alerts
router.get("/", async (req, res, next) => {
    var response = new ResponseSchema();
    try {
        const alerts = await prisma.detectionHistory.findMany({
            where:{
                user: {
                    patientDataAccess:{
                        some:{
                            doctorId: req.user.id
                        }
                    }
                },
                resolved: false
            },
            select: {
                id: true,
                reoprtedByName: true,
                user:{
                    select:{
                        id: true,
                        name: true,
                    }
                },
                riskLevel: true,
                detectedOn: true,
                disease:{
                    select:{
                        name: true,
                    }
                },
                cause: true
            },
            take: 100,
            orderBy: {
                detectedOn: "desc",
            },
        });
        response.setSuccess(true, "Alerts Fetched");
        response.setStatusCode(200);
        response.setPayload(alerts);
    }
    catch (error) {
        if (process.env.DEBUG == 1) console.log(error);
        response.setSuccess(false, "Alert fetch Failed");
        response.setStatusCode(500);
    }
    res.status(response.getStatusCode()).json(response.toJSON());
})

module.exports = router;
