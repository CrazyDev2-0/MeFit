const router = require("express").Router();
const ResponseSchema = require("../models/responseSchema");
const Utils = require("../helper/utils");
const prisma = require("../singletons/db_client").getInstance();
const jwt = require("../helper/jwt");
const passwordHasher = require("../helper/password_hasher");

// Login user
router.post("/login", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["email", "password"])) {
      // Fetch user details
      let user = await prisma.user.findFirstOrThrow({
        where: {
          email: req.body.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
        },
      });

      if(!passwordHasher.matchPassword(req.body.password, user.password)) throw new Error("Invalid credentials");

      // Create payload for JWT token
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        type: "patient",
      };
      // Generate token
      const token = jwt.generate(payload);

      // Save FCM token if provided
      if (req.body.fcmToken) {
        await prisma.userFCMToken.create({
          data: {
            userId: user.id,
            token: req.body.fcmToken,
          },
        });
      }
      // Set token in response
      response.setSuccess(true, "Login successfull");
      response.setStatusCode(200);
      response.setPayload({
        token: token,
        name: user.name,
      });
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "E-mail ID or password wrong");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Register User
router.post("/register", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (
      Utils.checkParamsPresence(req.body, [
        "name",
        "email",
        "phoneNo",
        "password",
        "age",
        "gender",
        "weight",
        "height",
        "bloodGroup",
      ])
    ) {
      // Fetch vital ids for height and weight
      let heightVital = await prisma.vital.findFirst({
        where: {
          code: "height",
        },
        select: {
          id: true,
        },
      });
      let weightVital = await prisma.vital.findFirst({
        where: {
          code: "weight",
        },
        select: {
          id: true,
        },
      });

      // Create user profile
      let user = await prisma.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          phoneNo: req.body.phoneNo || null,
          password: passwordHasher.hashPassword(req.body.password),
          profile: {
            create: {
              age: req.body.age,
              gender: req.body.gender,
              bloodGroup: req.body.bloodGroup,
            },
          },
          vitalData: {
            createMany: {
              data: [
                {
                  val: req.body.height,
                  vitalId: heightVital.id,
                  timestamp: Date.now(),
                },
                {
                  val: req.body.weight,
                  vitalId: weightVital.id,
                  timestamp: Date.now(),
                },
              ],
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Create payload for JWT token
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        type: "patient",
      };
      // Generate token
      const token = jwt.generate(payload);
      // Save FCM token if provided
      if (req.body.fcmToken) {
        await prisma.userFCMToken.create({
          data: {
            userId: user.id,
            token: req.body.fcmToken,
          },
        });
      }
      // Set token in response
      response.setSuccess(true, "Registration Successfull");
      response.setStatusCode(200);
      response.setPayload({
        token: token,
        name: user.name,
      });
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "Registration Failed");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Login doctor
router.post("/login-doctor", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["email", "password"])) {
      // Fetch user details
      let doctor = await prisma.doctor.findFirstOrThrow({
        where: {
          email: req.body.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
        },
      });
      // Check password
      if(!passwordHasher.matchPassword(req.body.password, doctor.password)) throw new Error("Invalid credentials");
      // Create payload for JWT token
      const payload = {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        type: "doctor",
      };
      // Save FCM token if provided
      if (req.body.fcmToken) {
        await prisma.doctorFCMToken.create({
          data: {
            doctorId: doctor.id,
            token: req.body.fcmToken,
          },
        });
      }
      // Generate token
      const token = jwt.generate(payload);
      // Set token in response
      response.setSuccess(true, "Login successfull");
      response.setStatusCode(200);
      response.setPayload({
        token: token,
      });
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "E-mail ID or password wrong");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
});

// Reset password user
router.post("/reset-password", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["email"])) {
      // Fetch user details
      let user = await prisma.user.findFirstOrThrow({
        where: {
          email: req.body.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Generate random password
      let randomPassword = Math.floor(Math.random() * 900000) + 100000;;

      // Set new password
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data:{
          password: passwordHasher.hashPassword(randomPassword.toString())
        }
      })
      // Push notification
      const MQClient = await require("../singletons/mq_manager").getInstance();
      await MQClient.sendMessageToQueue("notification",  {
        "isPatient": true,
        "patientId": user.id,
        "cause": "resetPassword",
        "message" : "Your password has been reset to " + randomPassword
      }, true)

      response.setSuccess(true, "Password reset successfully & sent over email and sms");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "No registered user with this e-mail ID");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
})


// Reset password doctor
router.post("/reset-password-doctor", async (req, res, next) => {
  var response = new ResponseSchema();
  try {
    if (Utils.checkParamsPresence(req.body, ["email"])) {
      // Fetch user details
      let doctor = await prisma.doctor.findFirstOrThrow({
        where: {
          email: req.body.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Generate random password
      let randomPassword = Math.floor(Math.random() * 900000) + 100000;;

      // Set new password
      await prisma.doctor.update({
        where: {
          id: doctor.id,
        },
        data:{
          password: passwordHasher.hashPassword(randomPassword.toString())
        }
      })
      // Push notification
      const MQClient = await require("../singletons/mq_manager").getInstance();
      await MQClient.sendMessageToQueue("notification",  {
        "isPatient": false,
        "doctorId": doctor.id,
        "cause": "resetPassword",
        "message" : "Your password has been reset to " + randomPassword
      }, true)

      response.setSuccess(true, "Password reset successfully & sent over email and sms");
      response.setStatusCode(200);
    } else {
      response.setSuccess(false, "Missing Parameters");
      response.setStatusCode(400);
    }
  } catch (error) {
    if (process.env.DEBUG == 1) console.log(error);
    response.setSuccess(false, "No registered user with this e-mail ID");
    response.setStatusCode(500);
  }
  res.status(response.getStatusCode()).json(response.toJSON());
})

module.exports = router;
