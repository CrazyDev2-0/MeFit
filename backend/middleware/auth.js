const ResponseSchema = require("../models/responseSchema");
const JWT = require("../helper/jwt");
const prisma = require("../singletons/db_client").getInstance();

class AuthMiddleware {
  static verifyJWT(req, res, next) {
    if (
      !req.headers.authorization ||
      JWT.verify(req.headers.authorization) == false
    ) {
      var response = new ResponseSchema();
      response.setStatusCode(401);
      response.setSuccess(false, "Authentication Failed");
      res.status(response.getStatusCode()).json(response.toJSON());
    } else {
      next();
    }
  }

  static async verifyPatient(req, res, next) {
    var token = req.headers.authorization;
    var decoded = JWT.getContent(token);
    try {
        let user = await prisma.user.findFirstOrThrow({
            where:{
                id: decoded[1].id
            }
        })
        req.user = user;
        next();
    } catch (error) {
        response.setStatusCode(401);
        response.setSuccess(false, "Credentials not matched");
        res.status(response.getStatusCode()).json(response.toJSON());
    }
  }

  static async verifyDoctor(req, res, next) {
    var token = req.headers.authorization;
    var decoded = JWT.getContent(token);
    try {
        if(decoded[1].type != "doctor") throw new Error("Not a doctor");
        let user = await prisma.doctor.findFirstOrThrow({
            where:{
                id: decoded[1].id
            }
        })
        req.user = user;
        next();
    } catch (error) {
        response.setStatusCode(401);
        response.setSuccess(false, "Credentials not matched");
        res.status(response.getStatusCode()).json(response.toJSON());
    }
  }
}

module.exports = AuthMiddleware