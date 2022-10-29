const router = require("express").Router();
const ResponseSchema = require("../../models/responseSchema");
const prisma = require("../../singletons/db_client").getInstance();

// Detection History
router.get("/history", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    const detectionHistory = await prisma.detectionHistory.findMany({
      where:{
        userId: req.user.id
      },
      select: {
        id: true,
        reoprtedByName: true,
        cause: true,
        riskLevel: true,
        resolved: true,
        disease: {
          select: {
            name: true,
            description: true
          },
        },
        detectedOn: true,
      },
      orderBy:{
        detectedOn: "desc"
      }
    });

    response.setSuccess(true, "All detected events fetched");
    response.setStatusCode(200);
    response.setPayload(detectionHistory);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Failed to fetch detection history event");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});



// Mark as resolved
router.post("/resolved", async(req, res, next) => {
  let response = new ResponseSchema();
  try {
    const { id } = req.body;
    await prisma.detectionHistory.update({
      where: {
        id: id,
      },
      data: {
        resolved: true
      },
    });
  
    response.setSuccess(true, "Marked as resolved");
    response.setStatusCode(200);
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Failed to update");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});
// Marks as resolved

module.exports = router;
