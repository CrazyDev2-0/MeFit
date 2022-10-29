import pika
import json

class MQManager:
    def __init__(self, username, password, host, vhost ):
        self.mqurl = pika.URLParameters('amqps://%s:%s@%s/%s' % (username, password, host, vhost))
        self.connection = pika.BlockingConnection(self.mqurl)
        self.channel = self.connection.channel()

    def createQueue(self, queue_name):
        self.channel.queue_declare(queue=queue_name, durable=True)

    def getChannel(self):
        return self.channel

    def publishToQueue(self, queue_name, message, isJson = False):
        self.channel.basic_publish(exchange='',
                                   routing_key=queue_name,
                                   body= json.dumps(message) if isJson else message,
                                   properties=pika.BasicProperties(
                                       delivery_mode=2, 
                                   ))


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)
    