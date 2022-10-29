const router = require("express").Router();
const ResponseSchema = require("../models/responseSchema");
const prisma = require("../singletons/db_client").getInstance();
const path = require("path");

// ####################################### Approve doctor's request #######################################
router.get("/approve/doctor-access/:id", async (req, res, next) => {
    try {
        const record = await prisma.accessRequest.findFirstOrThrow({
            where: {
                id: req.params.id
            },
            select: {
                id: true,
                userId: true,
                doctorId: true,
            },
        });

        await prisma.patientDataAccess.create({
            data: {
                doctorId: record.doctorId,
                userId: record.userId,
                granted: true
            }
        });

        res.render("accessGrantedDoctor");
    } catch (error) {
        res.send("Link Invalid")
    }
})
// ####################################### Update vitals data ##########################
router.get("/uv/:id", async (req, res, next) => {
    const record = await prisma.vitalRequest.findFirstOrThrow({
        where: {
            id: req.params.id
        },
        select: {
            active: true,
            vitals: {
                select: {
                    name: true,
                    code: true,
                    unit: true,
                }
            }
        }
    })
    if (record.active) res.render("vitalsUpdateForm", { vitals: record.vitals })
    else {
        res.redirect("/uvdone")
    }
})

router.post("/uv/:id", async (req, res, next) => {
    const timestamp = Date.now();
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findFirstOrThrow({
            where: {
                vitalRequest: {
                    some: {
                        id: req.params.id
                    }
                }
            },
            select: {
                id: true
            }
        })
        const vitalRequest = await tx.vitalRequest.findFirstOrThrow({
            where: {
                id: req.params.id,
                active: true
            },
            select: {
                id: true,
            }
        })

        // Update vitals data
        for (var vitalCode in req.body) {
            const vitalInfo = await tx.vital.findFirstOrThrow({
                where: {
                    code: vitalCode
                },
                select: {
                    id: true
                }
            })
            await tx.vitalData.create({
                data: {
                    userId: user.id,
                    val: parseFloat(req.body[vitalCode]),
                    vitalId: vitalInfo.id,
                    timestamp: timestamp
                }
            })
        }

        // update vital request from active to inactive state
        await tx.vitalRequest.updateMany({
            where: {
                id: vitalRequest.id
            },
            data: {
                active: false
            }
        })
    })

    res.redirect("/uvdone")
})

router.get("/uvdone", async (req, res, next) => {
    res.render("vitalRequestUpdated")
})

// ########################################### API at root level to understand ONLINE ###############################################
router.get('/', async (req, res, next) => {
    let response = new ResponseSchema();
    response.setSuccess(true, "🔥 Service is up and online 🔥");
    response.setStatusCode(200);
    res.status(response.getStatusCode()).json(response.toJSON());
});

// ################################# ROUTE NOT MATCHED ####### 404 #### 505 ##### ERROR HANDLE ########################################

// Handle errors if no route matches
router.use((req, res, next) => {
    let response = new ResponseSchema();
    response.setSuccess(false, "404 not found");
    response.setStatusCode(404);
    next(response);
});

// Handle errors if any error come without handling errors
router.use((err, req, res, next) => {
    let response;
    if (!(err instanceof ResponseSchema)) {
        response = new ResponseSchema();
        response.setSuccess(false, err.message || "Unexpected error");
        response.setStatusCode(err.code || 500);
    } else {
        response = err;
    }
    res.status(response.getStatusCode()).json(response.toJSON());
});


module.exports = router