require("dotenv").config();

const prisma = require("../singletons/db_client").getInstance();
const axios = require("axios");


async function SOSConsumer(channel) {
  channel.consume("sos", async(message) =>{
    try {
      const data = JSON.parse(message.content.toString());
      console.log("SOS received from user: " + data.userId);
      const user = await prisma.user.findFirstOrThrow({
        where:{
          id: data.userId,
        },
        select:{
          id: true,
          name: true,
          email: true,
          phoneNo: true,
          emergencyContact:{
            select:{
              name: true,
              email: true,
              phone: true,
            }
          }
        }
      })
      const msgToSend = `This is SOS from ${user.name}. Kindly contact him ASAP. Contact details: ${user.phoneNo}`;
      // Group the mail ids and phone numbers
      let email_ids = [];
      let phoneNo = [];

      for (let i = 0; i < user.emergencyContact.length; i++) {
        const e = user.emergencyContact[i];
        email_ids.push(e.email);
        phoneNo.push(e.phone);
      }

      const emailIdFinal = email_ids.join(",");
      const phoneNoFinal = phoneNo.join(",");

      // Send SMS
      if(phoneNoFinal.length > 0){
        await axios.get(`https://www.fast2sms.com/dev/bulk?authorization=${process.env.FAST2SMS_API_KEY}&sender_id=FSTSMS&message=${msgToSend}&language=english&route=p&numbers=${phoneNoFinal}`);
      }

      // Send email
      if(emailIdFinal.length > 0){
        let mail_client = await require("../singletons/mail_client").getInstance()
        await mail_client.sendMail(emailIdFinal, msgToSend, "SOS : " + user.name+ " needs help");
      }

    } catch (error) {
      if (process.env.DEBUG == 1) console.log(error);
    } finally {
      channel.ack(message);
    }
  });

  console.log("Started Notification consumer on `sos` queue");
}

module.exports = SOSConsumer;
