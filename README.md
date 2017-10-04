# mqtt primer

The demo uses [emqtt](emqtt.io) and [Paho Javascript MQTT Client](https://eclipse.org/paho/clients/js/#) with a python publisher and a browser subscriber.

First, get https://github.com/voxoz/mq up and running (follow its README or use any other MQTT broker that runs `wss` on port 8084.

```
pip install --user paho-mqtt
python -mSimpleHTTPServer 8081
python task.py # run the publisher
open http://localhost:8081
```

``` erlang
% to monitor the queue inside emqtt, use:
{ok, C} = emqttc:start_link([{host, "localhost"}, {client_id, <<"erlang">>}]), emqttc:subscribe(C, <<"optimize">>, qos0).
```

# mqtt + webrtc

You can easily send WebRTC SDPs over MQTT.
