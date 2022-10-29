// ######################################## ACCESS ENVIRABLE VARIABLES #############################################################
require('dotenv').config();

// AMQP Lib
const amqplib = require("amqplib");

// ############################################### RABBITMQ PUBLISHER SUPPORT ######################################################
class MQManager{
    static instance = null;
    static conn /** @type {Bluebird<amqplib.Connection>} */ = null;
    static channel = null;
    static queues = ["notification", "sos", "vital_monitoring", "heart_rate_prediction_model_train"]

    /**
     * @returns {MQManager}
     */
    static async getInstance(){
        if (MQManager.instance == null) {
            MQManager.instance = new MQManager();
            MQManager.conn = await amqplib.connect(process.env.RABBITMQ_URL, {
                setTimeout: 1000,
            });

            
            MQManager.channel = await MQManager.conn.createChannel();
            for(let queue of MQManager.queues){
                await MQManager.channel.assertQueue(queue, {
                    durable: true
                });
            }
        }
        return MQManager.instance;
    }

    async sendMessageToQueue(queue, message, is_json=false){
        if(is_json){
            message = JSON.stringify(message);
        }else{
            message = message.toString()
        }
        while(true){
            try {
                await MQManager.channel.sendToQueue(queue, Buffer.from(message),{
                    persistent: true
                });
                break;
            } catch (error) {
                console.log(error);
            }
        }
    }
}

module.exports = MQManager;