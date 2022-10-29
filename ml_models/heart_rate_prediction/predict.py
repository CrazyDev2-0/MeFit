from mq import MQManager
import json
import pickle
import numpy as np
import requests


class Model:
    def __init__(self, queueName, username, password, host, vhost, baseUrl):
        self.queueName = queueName
        self.baseUrl = baseUrl
        self.mq = MQManager(username, password, host, vhost)
        self.mq.createQueue(queueName)
        self.mq.getChannel().basic_consume(queue=queueName, on_message_callback=self.callback, auto_ack=True)
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
            user_id = json_data['user']['id']

            # Load model
            model = None
            with open(f'./models/{user_id}.pickle', 'rb') as f:
                model = pickle.load(f)

            # Prepare data
            vitalData = self.getVitalsData(user_id)
            meanOfBp = (vitalData["systolic_bp"]["val"] + vitalData["diastolic_bp"]["val"])/2
            data = [vitalData["spo2"]["val"], vitalData["pulse"]["val"], vitalData["resp"]["val"], meanOfBp, vitalData["systolic_bp"]["val"], vitalData["diastolic_bp"]["val"], vitalData["hr"]["val"]]
            
            # check data for negative values
            for val in data:
                if(val < 0):
                    raise Exception("Recieved -1 as one of the vital")


            # Predict 
            npArray = np.array(data)
            predictedHR = model.predict([npArray])[0]
            print(predictedHR)

            # 3 -> 121-130 | 0-40
            # 2 -> 111-120 | 0-40
            # 1 -> 101-110 | 40-50
            riskLevel = "normal"
            if (predictedHR > 121 and predictedHR < 130) or (predictedHR > 0 and predictedHR < 40):
                riskLevel = "high"
            elif (predictedHR > 111 and predictedHR < 120) or (predictedHR > 0 and predictedHR < 40):
                riskLevel = "medium"
            elif (predictedHR > 101 and predictedHR < 110) or (predictedHR > 40 and predictedHR < 50):
                riskLevel = "low"

            # Alert in case of issue
            if riskLevel != "normal":
                payload = {
                    "userId" : user_id,
                    "reoprtedByName" : "Heartrate Anomaly Detection Service",
                    "cause" : ("High " if predictedHR > 50 else "Low ")  + "rate of heart rate predicted",
                    "riskLevel" : riskLevel
                }

                self.submitDetectionReport(payload)

            print(" [x] Received %r" % json_data)
        except Exception as e:
            print("Error: "+str(e))


if __name__ == "__main__":
    model = Model("heart_rate_prediction_model", 'username', 'password', 'rabbitmq_url', 'vhost', "backend_https_url")
    print(" [x] Waiting for messages. To exit press CTRL+C")
