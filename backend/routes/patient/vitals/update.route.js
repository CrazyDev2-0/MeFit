const router = require("express").Router();
const ResponseSchema = require("../../../models/responseSchema");
const Utils = require("../../../helper/utils");
const prisma = require("../../../singletons/db_client").getInstance();
const jwt = require("../../../helper/jwt");
const AuthMiddleware = require("../../../middleware/auth");


// ##################### Update Vitals ##############################
// Update vitals
router.patch("/", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (typeof req.body === "object") {
      let data = req.body;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        const vitalIdRecord = await prisma.vital.findUnique({
          where:{
            code: element.code
          },
          select:{
            id: true
          }
        })
        await prisma.vitalData.create({
          data:{
            userId: req.user.id,
            vitalId: vitalIdRecord.id,
            val: element.val,
            timestamp: Date.now()
          }
        })
      }

      response.setSuccess(true, "Vitals updated");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Vital Update Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
})


module.exports = router;
