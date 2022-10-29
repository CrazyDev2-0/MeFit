require("dotenv").config();
const RedisClient = require("../singletons/redis_client");
const prisma = require("../singletons/db_client").getInstance();
const axios = require("axios").default;

/**
 * Redis data format
 * last_record_timestamp : int : milliseconds
 * Datas
 * -----------
 * timestamp : int : seconds
 * ---- monitoring_id1
 * ---- monitoring_id2
 */

// Check in database if new record found.
// If found add it to redis

// Fetch all personalizedmonitoring record scheduled for current timestamp.
// Send them to MQ
// Remove the old scheduled personalizedmonitoring from redis.
// Add the same records with updated timestamp , current timestamp + monitoring interval

(async () => {
  var instance = await RedisClient.getInstance();
  var mq_manager = await require("../singletons/mq_manager").getInstance();

  // Fetch the last personalizedmonitoring record timestamp from redis
  if (!(await instance.exists("last_record_timestamp"))) {
    await instance.setValue("last_record_timestamp", 0);
  }

  var last_record_timestamp = await instance.getValue("last_record_timestamp");
  last_record_timestamp = parseInt(last_record_timestamp);

  // Fetch new personalizedmonitoring records from database
  var new_personalizedmonitoring_records =
    await prisma.personalizedMonitoring.findMany({
      where: {
        isLive: true,
        registeredOn: {
          gt: last_record_timestamp,
        },
      },
      select: {
        id: true,
        intervalSeconds: true,
      },
    });

  // Current seconds
  var currentSecond = parseInt(new Date().getTime() / 1000);

  // Add new personalizedmonitoring records to redis
  for (var i = 0; i < new_personalizedmonitoring_records.length; i++) {
    var record = new_personalizedmonitoring_records[i];
    var timestamp = currentSecond + record.intervalSeconds;
    await instance.storeValueToList(
      timestamp,
      record.id + "_" + record.intervalSeconds.toString()
    );
  }

  // Fetch all timestamps saved equals or lower than current timestamp
  var timestamps = await instance.getAllTimestamps("timestamps");

  // Fetch all personalizedmonitoring records scheduled for current timestamp and less than current timestamp
  let personalizedmonitoring_records_redis = [];
  for (var i = 0; i < timestamps.length; i++) {
    var timestamp = timestamps[i];
    var records = await instance.getValueFromList(timestamp);
    personalizedmonitoring_records_redis =
      personalizedmonitoring_records_redis.concat(records);
  }

  // ############################ Logical Approach ############################
  // Fetch all personalizedmonitoring records scheduled for current timestamp and less than current timestamp

  for (let i = 0; i < personalizedmonitoring_records_redis.length; i++) {
    const array = personalizedmonitoring_records_redis[i].split("_");
    const id = array[0];
    const intervalSeconds = parseInt(array[1]);
    const record = await prisma.personalizedMonitoring.findUnique({
      where: {
        id: id,
      },
      select: {
        isLive: true,
        name: true,
        user: {
          select: {
            id: true,
            profile:{
              select:{
                gender: true,
                age: true,
              }
            }
          },
        },
        vitalThreshold: {
          select: {
            vital: {
              select: {
                name: true,
                code: true,
              },
            },
            threshold: true,
            isNegativeThreshold: true,
            min: true,
            max: true,
          },
        },
        isPredictionModelAssigned: true,
        predictionModel:{
          select:{
            id: true,
            queueName: true,
          }
        },
      },
    });
    if (record.isLive) {
      // Fetch latest vital of patient
      var config = {
        method: "get",
        url:
          process.env.SERVER_BASE_URL_CONSUMER_CALLBACK +
          "/services/vital/latest/" +
          record.user.id,
        headers: {},
      };
      const latestVitalsResponse = await axios(config);
      const latesVitalData = JSON.parse(latestVitalsResponse.data)["payload"];
      let issueDetected = false;
      let issue = "";
      // Check if vital is in threshold
      for (let j = 0; j < record.vitalThreshold.length; j++) {
        const vitalThreshold = record.vitalThreshold[j];
        const currentVal = latesVitalData[vitalThreshold.vital.code];
        if (
          currentVal >= vitalThreshold.min &&
          currentVal <= vitalThreshold.max
        ) {
          if (
            vitalThreshold.isNegativeThreshold &&
            currentVal < vitalThreshold.threshold
          ) {
            issueDetected = issueDetected || true;
            issue =
              issue +
              vitalThreshold.vital.name +
              " is below expected threshold\n";
          } else if (
            !vitalThreshold.isNegativeThreshold &&
            currentVal > vitalThreshold.threshold
          ) {
            issueDetected = issueDetected || true;
            issue =
              issue +
              vitalThreshold.vital.name +
              " is above expected threshold";
          }
        }
      }
      // Report if issue found
      if (issueDetected) {
        var payload = {
          userId: record.user.id,
          reoprtedByName: record.name,
          cause: issue,
          riskLevel: "low"
        };
        var config = {
          method: "post",
          url: process.env.SERVER_BASE_URL_CONSUMER_CALLBACK + "/services/detected",
          headers: {
            "Content-Type": "application/json",
          },
          data: JSON.stringify(payload),
        };
        await axios(config);
      }else{
        if(record.isPredictionModelAssigned){
          // Send signal to models
          await mq_manager.sendMessageToQueue(record.predictionModel.queueName, {
            "user" : record.user
          }, true);
        }
      }

      // Reschedule
      var _timestamp = currentSecond + intervalSeconds;
      await instance.storeValueToList(_timestamp, id + "_" + intervalSeconds.toString());
      await instance.storeTimestamp("timestamps", _timestamp);
    }
  }


  process.exit(0);
})();
