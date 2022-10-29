from mq import MQManager
import json
import pickle
import numpy as np
import requests

conv = {
    'sex' : {'m': '1', 'f': '0'},
    'chest_pain_type' : {'1': '000', '2': '100', '3': '010', '4': '001'},
    'resting_ecg' : {'1': '10', '2': '00', '3': '01'},
    'st_slope' : {'1': '01', '2': '10', '3': '00'}
}    

class Model:    
    def __init__(self, queueName, username, password, host, vhost, baseUrl):
        self.queueName = queueName
        self.baseUrl = baseUrl
        print("Establising MQ Connection")
        self.mq = MQManager(username, password, host, vhost)
        self.mq.createQueue(queueName)
        self.mq.getChannel().basic_consume(queue=queueName, on_message_callback=self.callback, auto_ack=True)
        print("Established MQ Connection")
        print("Load model and scaler")
        self.scaler = None
        self.model = None
        with open(f'models/heart_scaler.pickle', 'rb') as f:
            self.scaler = pickle.load(f)
        with open(f'models/heart_failure.pickle', 'rb') as f:
            self.model = pickle.load(f)
        
        print(self.scaler, self.model)
        self.mq.getChannel().start_consuming()
        
        


    def submitDetectionReport(self, payload):
        url = self.baseUrl+"/services/detected"
        payload = json.dumps(payload)
        response = requests.request("POST", url, data=payload, headers={'Content-Type': 'application/json'})
        print("ACK from server "+response.text)

    def getVitalsData(self, userId):
        url = self.baseUrl+"/services/vital/latest/"+userId
        response = requests.request("GET", url)
        data =  response.json()
        if data['success'] == False:
            raise Exception("Error fetching data from server")
        return data['payload']

    def callback(self, ch, method, properties, body):
        try:
            json_data = json.loads(body)
            user = json_data['user']
            user_id = user['id']

            vitalData = self.getVitalsData(user_id)


            #  Add to model
            sc = self.scaler.transform([[user["profile"]["age"], vitalData["systolic_bp"]["val"], vitalData["cholesterol"]["val"], vitalData["fasting_blood_sugar"]["val"],  vitalData["maxhr"]["val"], vitalData["oldpeak"]["val"]]])
            print("sc", sc)
            x = np.zeros(15)
            for i in range(0, 6):
                x[i] = sc[0][i]
            print("x", x)
            
            idx=6
            tmp = conv['sex'][user["profile"]["gender"]]
            for i in tmp:
                x[idx] = int(i)
                idx = idx + 1
            tmp = conv['chest_pain_type'][str(vitalData["chest_pain_type"]["val"])]
            for i in tmp:
                x[idx] = int(i)
                idx = idx + 1
            tmp = conv['resting_ecg'][str(vitalData["resting_ecg_type"]["val"])]
            for i in tmp:
                x[idx] = int(i)
                idx = idx + 1
            x[idx] = vitalData["exercise_angina"]["val"]
            idx = idx + 1
            tmp = conv['st_slope'][str(vitalData["st_slope_type"]["val"])]
            for i in tmp:
                x[idx] = int(i)
                idx = idx + 1

            print("cb", x)
            val = self.model.predict([x])[0]
            # 1 -> heart failure within 2 weeks as per current datset

            # Alert in case of issue
            if val == 1:
                payload = {
                    "userId" : user_id,
                    "reoprtedByName" : "Heart Failure Prediction Service",
                    "cause" : "AI Predicted high risk of heart failure",
                    "riskLevel" : "high",
                    "diseaseId" : "Enter Id for disease"
                }
                self.submitDetectionReport(payload)
        
            

            print(" [x] Received %r" % json_data)
        except Exception as e:
            print("Error in callback "+str(e))
            pass


if __name__ == "__main__":
    model = Model("heart_failure_prediction", 'username', 'password', 'rabbitmq_url', 'vhost',  "backend_https_url")
    print(" [x] Waiting for messages. To exit press CTRL+C")
