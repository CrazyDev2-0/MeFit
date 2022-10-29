require("dotenv").config();

const prisma = require("../singletons/db_client").getInstance();
const axios = require("axios");

async function InitNotificationConsumer(channel) {
  channel.consume("notification", async(message) => {
    try {
      const data = JSON.parse(message.content.toString());
      // Send notification to user
      // Format
      /*
      *
        {
          "isPatient" : true,
          "patientId": patient.id,
          "cause" : "dataAccess",
          "data" : {}?
          "message": message
        }

        {
          "isPatient" : false,
          "doctorId": doctor.id,
          "cause" : "",
          "data" : {}?
          "message": message
        }
      */
     let email_ids = [];
     let phoneNo = [];
     let fcm_tokens = [];

      if (data.isPatient) {
        // Fetch patient details
        const patient = await prisma.user.findFirstOrThrow({
          where: {
            id: data.patientId,
          },
          select:{
            email: true,
            phoneNo: true,
            FCMToken:{
              select:{
                token: true
              }
            }
          }
        });
        email_ids.push(patient.email);
        phoneNo.push(patient.phoneNo);
        fcm_tokens.push(...patient.FCMToken.map((token) => token.token));
      }else{
        const doctor = await prisma.doctor.findFirstOrThrow({
          where:{
            id: data.doctorId
          },
          select:{
            email: true,
            FCMToken:{
              select:{
                token: true
              }
            }
          }
        });

        email_ids.push(doctor.email);
        fcm_tokens.push(...doctor.FCMToken.map((token) => token.token));
      }

      /// ################# PROCESS ####################

      // Send sms
      let phoneNos = phoneNo.join(",");

      if(phoneNos.length > 0){
        let msg = ""
        if(data.cause == "dataAccessRequestDoctor"){
          msg = "Doctor has requested access to data. Check mail"
        }

        if(data.cause == "detectionAlert"){
          msg = "You have been detected with " + data.data.disease.name + " with risk level " + data.data.riskLevel
        }

        if(data.cause == "resetPassword"){
          msg = data.message
        }

        if(data.cause == "requestVitalUpdate"){
          msg = "You have mailed to update your vitals. Please check mail"
        }

        if(msg != "")
         await axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&sender_id=TXTIND&message=${msg}&route=v3&numbers=${phoneNos}`);
      }

      // Send email
      let emails = email_ids.join(",");
      if(emails.length > 0){
        let subject = "";
        if(data.cause == "dataAccessRequestDoctor"){
          subject = "Data access request";
        }
        if(data.cause == "detectionAlert"){
          subject = "There is some risk of disease"; 
        }
        if(data.cause == "resetPassword"){
          subject = "Password reset";
        }
        if(data.cause == "requestVitalUpdate"){
          subject = "Vital update request";
        }

        let mail_client = await require("../singletons/mail_client").getInstance()
        await mail_client.sendMail(emails, data.message, subject);
      }

      // Send notification
      if(fcm_tokens.length > 0 && data.cause != "resetPassword"){
        let firebase_client = await require("../singletons/firebase_client").getInstance();
        let notficationData = data.data;

        if(notficationData != null && notficationData != undefined){
          let tmp_data = {
            "payload" : JSON.stringify(notficationData)
          };
          // notficationData = JSON.parse(JSON.stringify(notficationData, (key, value) => value ? value.toString() : value));
          // console.log(JSON.stringify(notficationData));
          firebase_client.sendNotifications(data.message, "For more details you can check your mail", fcm_tokens, tmp_data);
        }
        else
        firebase_client.sendNotifications(data.message, "For more details you can check your mail", fcm_tokens);
      }

    } catch (error) {
      if (process.env.DEBUG == 1) console.log(error);
    } finally {
      channel.ack(message);
    }
  });

  console.log("Started Notification consumer on `notification` queue");
}

module.exports = InitNotificationConsumer
