const {pbkdf2Sync} = require("crypto");

class PasswordHasher {
  static hashPassword(password) {
    var hash = pbkdf2Sync(password.toString(), process.env.SALT, parseInt(process.env.ITERATIONS), parseInt(process.env.KEYLEN) ,'sha512').toString("hex");
    return hash.toString();
  }

  static matchPassword(password, hashOfPassword){
    return hashOfPassword == this.hashPassword(password.toString());
  }
}

module.exports = PasswordHasher
