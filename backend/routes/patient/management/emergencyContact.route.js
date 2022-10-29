const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();

// SOS
router.get("/sos", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const MQClient = await require("../../../singletons/mq_manager").getInstance();
    await MQClient.sendMessageToQueue("sos", {
      "userId": req.user.id,
    }, true)
    response.setSuccess(true, "Fetched emergency contacts");
    response.setStatusCode(200);
  } catch (err) {
    console.log(err);
    response.setSuccess(false, "Failed to add contact details");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
})

// Get all emergency contacts
router.get("/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const emergencyContacts = await prisma.emergencyContact.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
    response.setSuccess(true, "Fetched emergency contacts");
    response.setStatusCode(200);
    response.setPayload(emergencyContacts);
  } catch (err) {
    console.log(err);
    response.setSuccess(false, "Failed to add contact details");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Add new emergency contacts
router.post("/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["name", "phone", "email"])) {
      var data = await prisma.emergencyContact.create({
        data: {
          name: req.body.name,
          phone: req.body.phone.toString(),
          email: req.body.email,
          userId: req.user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });
      response.setSuccess(true, "Emergenecy contact added");
      response.setStatusCode(200);
      response.setPayload(data);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (err) {
    console.log(err);
    response.setSuccess(false, "Failed to add contact details");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Delete emergency contact
router.delete("/:id", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    await prisma.emergencyContact.deleteMany({
      where: {
        userId: req.user.id,
        id: req.params.id,
      },
    });
    response.setSuccess(true, "Deleted successfully");
    response.setStatusCode(200);
  } catch (err) {
    console.log(err);
    response.setSuccess(false, "Failed to delete contact details");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});


module.exports = router;
