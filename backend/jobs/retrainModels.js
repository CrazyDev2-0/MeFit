// Find those users that has  requirement of those models
// Prepare the datas as per data format
// Send them to MQ

const prisma = require("../singletons/db_client").getInstance();


(async()=>{
    let model_id = "cl9gtfuyx000g3ac4j7e9a9gn";
    let queue_name = "heart_rate_prediction_model_train";
    let mqInstance = require("../singletons/mq_manager").getInstance();
    
    let predictionModel = await prisma.predictionModel.findUnique({
        where:{
            id: model_id
        },
        select:{
            queue_name: true
        }
    })

    let users = await prisma.personalizedMonitoring.findMany({
        where:{
            predictionModelId:model_id,
        },
        select:{
            user:{
                select:{
                    id: true,
                    profile:{
                        select:{
                            age: true,
                            gender: true
                        }
                    }
                },
            }
        }
    }) 

    for (let i = 0; i < users.length; i++) {
        const user_details = users[i].user;
        await mqInstance.sendMessageToQueue(predictionModel.queueName , user_details, true);
    }
})()