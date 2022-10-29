from mq import MQManager
import json
import pickle
import numpy as np
import requests
import datetime
import time
from sklearn.svm import SVR


class Model:
    def __init__(self, queueName, username, password, host, vhost, baseUrl):
        self.PRED_AFTER = 5 
        self.queueName = queueName
        self.baseUrl = baseUrl
        self.mq = MQManager(username, password, host, vhost)
        self.mq.createQueue(queueName)
        self.mq.getChannel().basic_consume(queue=queueName, on_message_callback=self.callback, auto_ack=True)
        self.mq.getChannel().start_consuming()


    def fetchPatientData(self, vitalCodes:list, userId):
        url = f"{self.baseUrl}/services/vital/bulkdata/{userId}/"
        headers = {
            'Content-Type': 'application/json'
        }
        ms = datetime.datetime.now()

        end = int(time.mktime(ms.timetuple())*1000)
        start = int(time.mktime((ms - datetime.timedelta(hours=24)).timetuple())*1000)

        dataReceived = []
        length = 0


        while True:
            try:        
                payload = json.dumps({
                    "vitals": vitalCodes,
                    "skip": length,
                    "start": start,
                    "end": end
                })
                response = requests.request("POST", url, headers=headers, data=payload)
                data = response.json()
                print("fetch", data)
                payload = data['payload']
                if type(payload) == "dict" or len(payload) == 0:
                    break
                else:
                    length += len(payload)
                    dataReceived.extend(payload)
            except Exception as e:
                print(e)
                break

        return dataReceived

    def getAndprocessData(self, userId):
        vitalsCode = ["spo2", "pulse", "resp", "systolic_bp", "diastolic_bp", "hr"]
        data = self.fetchPatientData(vitalsCode, userId)
        finalData = []
        for i in data:
            tmp = []
            tmp.extend(i[0:3])
            mean = (i[3] + i[4])/2
            tmp.append(mean)
            tmp.extend(i[3:])
            finalData.append(tmp)
        return finalData

    def callback(self, ch, method, properties, body):
        
        json_data = json.loads(body)
        print("cb", json_data)
        user_id = json_data['user']['id']

        data = self.getAndprocessData(user_id)
        print("cb data", data)
        SIZE = len(data)

        x = []
        y = []
        for i in range(0, SIZE-self.PRED_AFTER+1):
            tmp = data[i]
            
            x.append(tmp)
            print("cb x", x)
            y.append(data[i+self.PRED_AFTER-1][4])
        
        x = np.array(x)
        y = np.array(y)

        model = SVR(kernel='rbf', gamma=0.1)

        # TODO consider gamma 
        model.fit(x, y)

        with open(f'./models/{user_id}.pickle', 'wb') as f:
            model = pickle.dump(model, f)

        
        print(" [x] Received %r" % json_data)

if __name__ == "__main__":
    model = Model("heart_rate_prediction_model_train", 'username', 'password', 'rabbitmq_url', 'vhost', "backend_https_url")
    print(" [x] Waiting for messages. To exit press CTRL+C")
