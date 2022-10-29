require("dotenv").config();

const prisma = require("../singletons/db_client").getInstance();
const axios = require("axios");

/**
 * Load vitals monitoring data on memory to quickly analyze
 */

// data format
// hr|hrv|ecg_reading|spo2|temperature|steps_walked|sleep|calories_burned|timestamp


// Check the vital required to decide disease is available or not
function checkVitalsRequirement(input, requirement){
    for (let i = 0; i < requirement.length; i++) {
        const e = requirement[i];
        if(e === true &&  input[i] === false) return false;
    }
    return  true;
}

function getIndexFromVitalName(vitalName){
    switch(vitalName){
        case "hr":
            return 0;
        case "hrv":
            return 1;
        case "spo2":
            return 2;
        case "temperature":
            return 3;
        case "steps_walked":
            return 4;
        case "sleep":
            return 5;
        case "calories_burned":
            return 6;
    }
}

// Check if vital data available
// Unavailable data will be marked as false
function convertVitalDataArrayToStatusArray(vitalDataArray){
    let statusArray = [];
    for (let i = 0; i < vitalDataArray.length; i++) {
        const e = vitalDataArray[i];
        if(e === null){
            statusArray.push(false);
        }else{
            statusArray.push(true);
        }
    }
    return statusArray;
}


async function VitalMonitoringConsumer(channel) {
    
    // Pre-process database of diseases and cache 
    const diseases = await prisma.disease.findMany({
        select:{
            id: true,
            name: true,
            vitalThresholds:{
                select:{
                    id: true,
                    gender: true,
                    minAge: true,
                    maxAge: true,
                    min: true,
                    max: true,
                    threshold: true,
                    isNegativeThreshold: true,
                    vital:{
                        select:{
                            code: true
                        }
                    }
                }
            }
        }
    });

    let serialized_disease_database = {
        "m" : [],
        "f" : []
    };

    for(let i = 0; i < diseases.length; i++){
        var disease = {
            id: diseases[i].id,
            name: diseases[i].name,
        };

        let vitalThresholdsMale = {
            "dependentOn" : [false, false, false, false, false, false, false, false],
            "positiveThresholds" : [],
            "negativeThresholds" : [],
            "thresholdsData" : {}
        };
        let vitalThresholdsFemale = {
            "dependentOn" : [false, false, false, false, false, false, false, false],
            "positiveThresholds" : [],
            "negativeThresholds" : [],
            "thresholdsData" : {}
        };

        for(let j = 0; j < diseases[i].vitalThresholds.length; j++){
            let vitalThreshold = diseases[i].vitalThresholds[j];
            if(vitalThreshold.gender == "m"){
                vitalThresholdsMale.dependentOn[getIndexFromVitalName(vitalThreshold.vital.code)] = true;
                if(vitalThreshold.isNegativeThreshold){
                    vitalThresholdsMale.negativeThresholds.push(vitalThreshold.vital.code);
                }else{
                    vitalThresholdsMale.positiveThresholds.push(vitalThreshold.vital.code);
                }

                vitalThresholdsMale.thresholdsData[vitalThreshold.vital.code] = {
                    "minAge": vitalThreshold.minAge,
                    "maxAge": vitalThreshold.maxAge,
                    "min": vitalThreshold.min,
                    "max": vitalThreshold.max,
                    "threshold": vitalThreshold.threshold
                }
            }
            
            if(vitalThreshold.gender == "f"){
                vitalThresholdsFemale.dependentOn[getIndexFromVitalName(vitalThreshold.vital.code)] = true;
                if(vitalThreshold.isNegativeThreshold){
                    vitalThresholdsFemale.negativeThresholds.push(vitalThreshold.vital.code);
                }else{
                    vitalThresholdsFemale.positiveThresholds.push(vitalThreshold.vital.code);
                }

                vitalThresholdsFemale.thresholdsData[vitalThreshold.vital.code] = {
                    "minAge": vitalThreshold.minAge,
                    "maxAge": vitalThreshold.maxAge,
                    "min": vitalThreshold.min,
                    "max": vitalThreshold.max,
                    "threshold": vitalThreshold.threshold
                }
            }
        }


        if(vitalThresholdsFemale.positiveThresholds.length + vitalThresholdsFemale.negativeThresholds.length > 0){
            serialized_disease_database["f"].push({
                "disease" : disease,
                "vitalThresholds" : vitalThresholdsFemale
            })
        }

        if(vitalThresholdsMale.positiveThresholds.length + vitalThresholdsMale.negativeThresholds.length > 0){
            serialized_disease_database["m"].push({
                "disease" : disease,
                "vitalThresholds" : vitalThresholdsMale
            })
        }
    }

    // Consume
    channel.consume("vital_monitoring", async(message) => {
      try {
        const data = JSON.parse(message.content.toString());
        const user = data.user;
        const gender = user.profile.gender;
        const age = user.profile.age;
        const vitalDataArray = data.data;

        // Selected database
        let selectedDatabase = serialized_disease_database[gender];

        // Detected diseases
        let detectedDiseases = [];

        for (let i = 0; i < vitalDataArray.length; i++) {
            let vitalData = vitalDataArray[i];
            vitalData = vitalData.slice(0, -1);
            // Generate status array
            const vitalAvailableStatus = convertVitalDataArrayToStatusArray(vitalData);
            // Check of there is any disease which matches for gender, age, vital requiement
            for (let j = 0; j < selectedDatabase.length; j++) {
                const disease = selectedDatabase[j];
                if(checkVitalsRequirement(vitalAvailableStatus, disease.vitalThresholds.dependentOn)){
                    let flag = true;
                    // Check for positive thresholds
                    for (let k = 0; k < disease.vitalThresholds.positiveThresholds.length; k++) {
                        const vitalName = disease.vitalThresholds.positiveThresholds[k];
                        const vitalThresholdData = disease.vitalThresholds.thresholdsData[vitalName];
                        const vitalValueRecorded = vitalData[getIndexFromVitalName(vitalName)];
                        if(age > vitalThresholdData.minAge && age < vitalThresholdData.maxAge &&
                            vitalValueRecorded >= vitalThresholdData.min && vitalValueRecorded <= vitalThresholdData.max){                            
                            if(vitalValueRecorded > vitalThresholdData.threshold){
                                flag = true;
                            }else{
                                flag = false;
                                break;
                            }
                        }
                    }
                    // Check for negative thresholds
                    for (let k = 0; k < disease.vitalThresholds.negativeThresholds.length; k++) {
                        const vitalName = disease.vitalThresholds.negativeThresholds[k];
                        const vitalThresholdData = disease.vitalThresholds.thresholdsData[vitalName];
                        const vitalValueRecorded = vitalData[getIndexFromVitalName(vitalName)];
                        if(age > vitalThresholdData.minAge && age < vitalThresholdData.maxAge &&
                            vitalValueRecorded >= vitalThresholdData.min && vitalValueRecorded <= vitalThresholdData.max){                            
                            if(vitalValueRecorded < vitalThresholdData.threshold){
                                flag = true;
                            }else{
                                flag = false;
                                break;
                            }
                        }
                    }
                    if(flag){
                        detectedDiseases.push(disease.disease);
                    }
                }
            }
        }
        
        // Remove duplicate diseases
        let uniqueDisease = [];
        for (let i = 0; i < detectedDiseases.length; i++) {
            const _disease = detectedDiseases[i];
            if(!uniqueDisease.includes(_disease)){
                uniqueDisease.push(_disease);
            }
        }

        if(uniqueDisease.length > 0){
            for (let i = 0; i < uniqueDisease.length; i++) {
                const disease = uniqueDisease[i];
                var _payload = JSON.stringify({
                    "userId": user.id,
                    "reoprtedByName": "General Disease Prediction System",
                    "cause": "Disorder in vitals",
                    "riskLevel": "low",
                    "diseaseId": disease.id
                });  
                var config = {
                    method: 'post',
                    url: process.env.SERVER_BASE_URL_CONSUMER_CALLBACK+'/services/detected',
                    headers: { 
                      'Content-Type': 'application/json'
                    },
                    data : _payload
                };               
                await axios(config);   
            }            
        }       
      } catch (error) {
        if (process.env.DEBUG == 1) console.log(error);
      } finally {
        channel.ack(message);
      }
    });
  
    console.log("Started Notification consumer on `vital_monitoring` queue");
  }
  
  module.exports = VitalMonitoringConsumer;
  