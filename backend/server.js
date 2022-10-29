// ######################################## ACCESS ENVIRABLE VARIABLES #############################################################
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DEBUG = process.env.DEBUG || false;

// ############################################### IMPORT PACKAGES #################################################################
// Express
const express = require('express');
// HTTP Logger
const morgan = require('morgan');
// Express Security plugin
const helmet = require("helmet");
// Responseschema
const ResponseSchema = require('./models/responseSchema');
// Utils
const Utils = require('./helper/utils');
const AuthMiddleware = require('./middleware/auth');
// Database ORM Client
const prisma = require("./singletons/db_client").getInstance();
// json bigint
const JsonBigInt = require('json-bigint');
// Cors
const cors = require('cors');
// ################################# Override JSON Parse and Stringify For Bigint support ########################################################
JSON.parse = JsonBigInt.parse;
JSON.stringify = JsonBigInt.stringify;
// ################################################ EXPRESS SETUP ##################################################################
const app = express();
// app.use(helmet());
app.set('view engine', 'ejs');
app.disable('x-powered-by')
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}))

if (DEBUG) app.use(morgan('dev'));

// ####################################### Middleware that resolves School details ###################################################
// ######################################## API Routes ####### TOP LEVEL #############################################################
app.use("/auth", require("./routes/auth.route"))
app.use("/patient", AuthMiddleware.verifyJWT, AuthMiddleware.verifyPatient, require("./routes/patient.route"))
app.use("/doctor", AuthMiddleware.verifyJWT, AuthMiddleware.verifyDoctor, require("./routes/doctor.route"))
app.use("/device", require("./routes/device.route"))
app.use("/services", require("./routes/services.route"))
app.use("", require("./routes/other.route"))

// ################################################ START LISTENING ON PORT ############################################################
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));

