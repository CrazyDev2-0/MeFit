const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();

// Link hardware device
router.post("/link", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["hardwareId"])) {
      const check = await prisma.deviceUserLink.findFirst({
        where: {
          hardwareId: req.body.hardwareId.toString(),
        },
      });
      if (check != null) {
        response.setSuccess(false, "Device already linked to another user");
        response.setStatusCode(200);
      } else {
        // Link device to user
        await prisma.deviceUserLink.create({
          data: {
            hardwareId: req.body.hardwareId.toString(),
            userId: req.user.id,
            linkedOn: Date.now(),
          },
        });
        response.setSuccess(true, "Device linked to user");
        response.setStatusCode(200);
      }
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Link Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Unlink hardware device
router.post("/unlink", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["hardwareId"])) {
      const check = await prisma.deviceUserLink.findFirst({
        where: {
          hardwareId: req.body.hardwareId.toString(),
        },
      });
      if (check == null) {
        response.setSuccess(false, "Device not linked to any user");
        response.setStatusCode(200);
      } else {
        // Unlink device from user
        await prisma.deviceUserLink.delete({
          where: {
            hardwareId: req.body.hardwareId.toString(),
          },
        });
        response.setSuccess(true, "Device unlinked from user");
        response.setStatusCode(200);
      }
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Unlink Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});


module.exports = router;
