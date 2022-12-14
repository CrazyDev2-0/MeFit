const pako = require('pako');

class Utils {
  static handleNullString(str) {
    if (!str || str === null || str === undefined) {
      return "";
    }
    return str;
  }
  static checkParamsPresence(json_obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (!json_obj[keys[i]] && json_obj[keys[i]] != 0) {
        return false;
      }
    }
    return true;
  }
  static getRandomPassword() {
    return Math.floor(Math.random() * 900000) + 100000;
  }

  static parseToInt(val) {
    var x = parseInt(val);
    if (
      x == null ||
      x == undefined ||
      x.toString() == "undefined" ||
      x.toString() == "NaN" ||
      x == NaN
    )
      return 0;
    return x;
  }

  static getCurrentAndTomorrowDate() {
    var now_date = Date.now();
    var current_date = new Date(new Date().setHours(0, 0, 0, 0));
    var tomorrow_date_only = new Date(new Date().setHours(24, 0, 0, 0));
    return [current_date, tomorrow_date_only];
  }

  /**
   * @param {String} text
   */
  static parseBool(text) {
    text = text == undefined || text == null ? "undefined" : text.toString();
    if (
      text == undefined ||
      text == null ||
      text == "undefined" ||
      text == "null"
    )
      return false;
    text = text.trim();
    if (text == "true" || text == "TRUE") return true;
    if (text == "1") return true;
    else false;
  }

  static formatDate(date) {
    if (date == null) return "---";
    date = new Date(date);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  }

  static formatAMPM(date) {
    if (date == null) return "---";
    date = new Date(date);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  }

  static getCurrentFormattedAMPM() {
    var date = new Date(Date.now());
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  }

  static getMonthNameFromNumber(monthNumber) {
    return Utils.months_name[monthNumber];
  }
  static getUnixTimestampOfBeginingOfToday() {
    const startDay = new Date(Date.now());
    startDay.setHours(0, 0, 0, 0);
    return startDay.getTime();
  }

  static getUnixTimestampOfEndOfToday() {
    const endDay = new Date(Date.now());
    endDay.setHours(23, 59, 59, 999);
    return endDay.getTime();
  }

  static stringToBase64(str) {
    return Buffer.from(str).toString("base64");
  }

  static base64ToString(str) {
    return Buffer.from(str, "base64").toString("ascii");
  }
  
  static decodeBase64GzippedString(base64Data) {
    var strData     = atob(base64Data);
    // Convert binary string to character-number array
    var charData    = strData.split('').map(function(x){return x.charCodeAt(0);});
    // Turn number array into byte-array
    var binData     = new Uint8Array(charData);
    // Pako magic
    var data        = pako.inflate(binData);
    // Convert gunzipped byteArray back to ascii string:
    var strData     = String.fromCharCode.apply(null, new Uint16Array(data));
    // Return the decompressed string:
    return strData;
  }

  static compareArray(arr1, arr2) {
    if (arr1.length != arr2.length) return false;
    for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] != arr2[i]) return false;
    }
    return true;
  }
}


module.exports = Utils;
