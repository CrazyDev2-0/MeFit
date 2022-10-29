const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();

// Fetch Profile
router.get("/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        registeredOn: true,
        profile: {
          select: {
            age: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });
    response.setSuccess(true, "Profile fetched successfully");
    response.setStatusCode(200);
    response.setPayload(user);
  } catch (err) {
    console.log(err);
    response.setSuccess(false, err.message);
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Update age
router.patch("/age", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["age"])) {
      await prisma.profile.updateMany({
        where: {
          userId: req.user.id,
        },
        data: {
          age: req.body.age,
        },
      });
      response.setSuccess(true, "Age updated successfully");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Age Update Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Update Bloodgroup
router.patch("/blood-group", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["bloodGroup"])) {
      await prisma.profile.updateMany({
        where: {
          userId: req.user.id,
        },
        data: {
          bloodGroup: req.body.bloodGroup,
        },
      });
      response.setSuccess(true, "Blood Group updated successfully");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Blood Group Update Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Update Gender
router.patch("/gender", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["gender"])) {
      await prisma.profile.updateMany({
        where: {
          userId: req.user.id,
        },
        data: {
          gender: req.body.gender,
        },
      });
      response.setSuccess(true, "Gender updated successfully");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Gender Update Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Approve Access to doctor
router.post("/approve/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.query, ["doctorId"])) {
      await prisma.patientDataAccess.create({
        data: {
          doctorId: req.query.doctorId,
          userId: req.user.id,
          granted: true,
        },
      });
      response.setSuccess(true, "Access Granted");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Access Approval Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

module.exports = router;
