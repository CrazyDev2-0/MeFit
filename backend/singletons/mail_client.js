require("dotenv").config();

const nodemailer = require("nodemailer");


class MailClient {
  static instance = null;
  static transport = null;

  
  static getInstance(){
    if (MailClient.instance == null) {
      MailClient.instance = new MailClient();
      MailClient.transport = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: true,
        auth: {
          user: process.env.MAIL_USERMAIL,
          pass: process.env.MAIL_PASSWORD,
        },
      });
    }
    return MailClient.instance;
  }


  async sendMail(toEmail, message, subject){
    await MailClient.transport.sendMail({
        from: `"Team KrazyDev" <${process.env.MAIL_USERMAIL}>`, // sender address
        to: toEmail, // list of receivers
        subject: subject, // Subject line
        text: message
      });
  }
}

module.exports = MailClient