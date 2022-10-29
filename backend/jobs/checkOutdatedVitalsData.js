require("dotenv").config();
const RedisClient = require("../singletons/redis_client");
const prisma = require("../singletons/db_client").getInstance();
const axios = require("axios").default;

(async () => {

    // Fetch all personalized records
    let personalized_records = await prisma.personalizedMonitoring.findMany({
        where: {
            isLive: true
        },
        select:{
            id: true,
            userId: true,
            vitalThreshold:{
                select:{
                    vitalId: true
                }
            }
        }
    })

    // Group personalized records by user
    let user_personalized_records = {}
    for(let i=0; i<personalized_records.length; i++){
        let record = personalized_records[i];
        if(user_personalized_records[record.userId] == null){
            user_personalized_records[record.userId] = [];
        }
        record.vitalThreshold[0].vitalId
        user_personalized_records[record.userId].push(record);
    }

    // Iterate over each user
    for(let user_id in user_personalized_records){
        let required_vitals_id_update = [];

        let user_record = user_personalized_records[user_id];
        for (let i = 0; i < user_record.vitalThreshold.length; i++) {
            const vitalId = user_record.vitalThreshold[i].vitalId;
            // If vital is not already present in the list
            if(required_vitals_id_update.indexOf(vitalId) == -1){
                let vital = await prisma.vitalData.findFirst({
                    where: {
                        userId: user_id,
                        vitalId: vitalId,
                        timestamp : {
                            gt: Date.now() - 2 * 24 * 60 * 60 * 1000,
                        }
                    },
                    orderBy:{
                        timestamp: "desc"
                    }
                });
                if (vital == null) {
                    required_vitals_id_update.push(vitalId);
                }
            }
        }

        // If there are any vitals that are not present
        if(required_vitals_id_update.length > 0){
            let tmp = [];
            for (let k = 0; k < required_vitals_id_update.length; k++) {
              if(required_vitals_id_update[k] != ""){
                tmp.push({
                  "id" : required_vitals_id_update[k],
                })
              }
            }

            // Create vital request
            let vitalRequest = await prisma.vitalRequest.create({
                data:{
                    userId: user_id,
                    vitals:{
                        connect:tmp
                    },
                    requestedOn: Date.now()
                }
            });

            // Send notification to patient
            let mqClient = await require("../singletons/mq_manager").getInstance();
            await mqClient.sendMessageToQueue("notification", {
                "isPatient": true,
                "patientId": user_id,
                "cause": "requestVitalUpdate",
                "message" : "Our system has detected that you have not updated your vitals in last 2 days. Please update your vitals to continue monitoring. Form link : " + process.env.SERVER_BASE_URL_CONSUMER_CALLBACK + "/uv/" + vitalRequest.id,
            }, true)
        }
    }

    process.exit(0);
})()