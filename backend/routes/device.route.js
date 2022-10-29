const router = require("express").Router();
const ResponseSchema = require("../models/responseSchema");
const Utils = require("../helper/utils");
const prisma = require("../singletons/db_client").getInstance();
const jwt = require("../helper/jwt");
const AuthMiddleware = require("../middleware/auth");
const MQManager = require("../singletons/mq_manager");

// helper function to entry vital data in database
async function entryVitalData(vitalCode, value, userId, timestamp) {
  const vital = await prisma.vital.findUnique({
    where: {
      code: vitalCode,
    },
    select: {
      id: true,
    },
  });
  if (!vital) {
    throw new Error("Vital not found");
  }
  await prisma.vitalData.create({
    data: {
        vitalId: vital.id,
        userId: userId,
        val: value,
        timestamp: timestamp,
    },
  });
}



router.post("/log", async (req, res) => {
  try {
    const gzipEnabled = Utils.parseBool(process.env.DeviceGzipEnabled);
    const body = req.body.toString();
    const data = gzipEnabled ? Utils.decodeBase64GzippedString(body) : body;
    const lines = data.split("\n");
    if (lines.length >= 2) {
      // Line 0 will have hardware id
      const hardwareId = lines[0].trim();
      const user = await prisma.user.findFirstOrThrow({
        where: {
          device: {
            hardwareId: hardwareId,
          },
        },
        select: {
          id: true,
          profile:{
            select:{
              gender: true,
              age: true,
            }
          }
        },
      });
      // From line 1 onwards will have data
      // data format
      // // hr|hrv|ecg_reading|spo2|temperature|steps_walked|sleep|calories_burned|timestamp
      // hr|hrv|spo2|temperature|steps_walked|sleep|calories_burned|timestamp
      const datas = lines.slice(1);
      let finalDatas = [];
      for (let i = 0; i < datas.length; i++) {
        try {
          const data = datas[i];
          const splittedData = data.split("|");
          if (splittedData.length === 8) {
            const hr = splittedData[0] == -1 ? null : parseFloat(splittedData[0]);
            const hrv = splittedData[1] == -1 ? null : parseFloat(splittedData[1]);
            // const ecg = splittedData[2] == -1 ? null : parseFloat(splittedData[2]);
            const spo2 = splittedData[2] == -1 ? null : parseFloat(splittedData[2]);
            const temperature =  splittedData[3] == -1 ? null : parseFloat(splittedData[3]);
            const steps = splittedData[4] == -1 ? null : parseFloat(splittedData[4]);
            const sleep = splittedData[5] == -1 ? null : parseFloat(splittedData[5]);
            const calories =  splittedData[6] == -1 ? null : parseFloat(splittedData[6]);
            const timestamp = splittedData[7] == -1 ? null : parseInt(splittedData[7]);
            if (hr != null) await entryVitalData("hr", hr, user.id, timestamp);
            if (hrv != null) await entryVitalData("hrv", hrv, user.id, timestamp);
            // if (ecg != null) await entryVitalData("ecg_reading", ecg, user.id, timestamp);
            if (spo2 != null) await entryVitalData("spo2", spo2, user.id, timestamp);
            if (temperature != null) await entryVitalData("temperature", temperature, user.id, timestamp);
            if (steps != null) await entryVitalData("steps_walked", steps, user.id, timestamp);
            if (sleep != null) await entryVitalData("sleep", sleep, user.id, timestamp);
            if (calories != null) await entryVitalData("calorie", calories, user.id, timestamp);

            finalDatas.push([hr, hrv, spo2, temperature, steps, sleep, calories, timestamp]);
          }
          
        } catch (error) {
            console.log(error);
          console.log("Error in log : " + error);
        }
      }

      if(finalDatas.length > 0){
        const mqManager = await MQManager.getInstance();
        await mqManager.sendMessageToQueue("vital_monitoring", {
          user : user,
          data : finalDatas
        }, true);
      }
    }
    res.status(200).send("ok");
  } catch (error) {
    console.log(error);
    res.status(500).send("failed");
  }
});


router.get("/sos/:hardwareId", async(req, res, next)=>{
  try {
    const user = await prisma.user.findFirstOrThrow({
      where: {
        device: {
          hardwareId: req.params.hardwareId,
        },
      },
      select: {
        id: true
      },
    });

    const instance = await MQManager.getInstance();
    await instance.sendMessageToQueue("sos", {
      "userId": user.id,
    }, true)

    res.status(200).send("ok");
  } catch (error) {
    console.log(error);
    res.status(500).send("failed");
  }
})

module.exports = router;
