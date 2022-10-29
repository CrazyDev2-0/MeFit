const jwt = require('jsonwebtoken');

class JWT{
    static generate(content){
        return jwt.sign({...content, iat: Math.floor(Date.now()/1000)+process.env.JWT_TOKEN_EXPIRATION_DAYS*86400}, process.env.JWT_SECRET_KEY);
    }

    static verify(token){
        try {
            jwt.verify(token, process.env.JWT_SECRET_KEY);
            return true;
        } catch (error) {
            return false;
        }
    }

    static getContent(token){
        try {
            var content = jwt.verify(token, process.env.JWT_SECRET_KEY);
            delete content["iat"];
            return [true, content];
        } catch (error) {
            return [false, {}];
        }
    }

}

module.exports = JWT