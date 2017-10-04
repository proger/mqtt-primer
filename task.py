import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
import time

def single(payload, topic='optimize'):
    return publish.single(topic, payload=payload, hostname="localhost", protocol=mqtt.MQTTv31)

def run(x):
    single("hello!")
    for i in range(1000):
        single("progress {}".format(i))
        time.sleep(1.2)
    single("kaputt")

if __name__ == '__main__':
    run(42)
