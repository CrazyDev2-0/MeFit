const Utils = require("../helper/utils");

class ResponseSchema{
    constructor(){
        this.success = false;
        this.code = 500;
        this.message = "";
        this.error = "";
        this.payload = {};
    }

    // Set data
    setSuccess(success, message){
        this.success = success;
        if(success){
            this.message = message;
        }else{
            this.error = message;
        }
    }

    setPayload(payload){
        this.payload = payload;
    }

    setStatusCode(code){
        this.code = code;
    }

    // Get status code
    getStatusCode(){
        return this.code;
    }

    // Return JSON to send to user
    toJSON(){
        var data = {
            success: this.success,
            code: this.code,
            message: this.success ? this.message : "",
            error: !this.success ? Utils.handleNullString(this.error) === "" ?  "Some error happened ! Try later" : this.error : "",
            payload: this.payload || {}
        }
        return data;
    }
}

module.exports = ResponseSchema;