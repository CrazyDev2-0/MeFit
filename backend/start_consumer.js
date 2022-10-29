// ######################################## ACCESS ENVIRABLE VARIABLES #############################################################
require('dotenv').config();

// Import AMQP library
const amqp = require("amqplib");

// AMQP 
const mqManager = require("./singletons/mq_manager");

// Notification Consumer
const NotificationConsumer = require("./consumers/notificationConsumer");
const SOSConsumer = require("./consumers/SOSConsumer");
const VitalMonitoringConsumer = require("./consumers/vitalMonitoring");

async function connectAndStartService(){
    try {
        const instance = await mqManager.getInstance();
        const channel = mqManager.channel;

        NotificationConsumer(channel);
        SOSConsumer(channel);
        VitalMonitoringConsumer(channel);
    }
    catch (ex){
        if(process.env.DEBUG == 1) console.log(amqpServer);
        console.log("Service haulted ! Can't connect to rabbitmq server");
    }
}

connectAndStartService();