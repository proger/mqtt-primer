function randomstring() {
  return Math.random().toString(36);
}

(function() {
  var client = new Paho.MQTT.Client("localhost", 8083, randomstring());

  client.onConnectionLost = function (responseObject) {
    console.log("connection lost: " + responseObject.errorMessage);
  };

  client.onMessageArrived = function (message) {
    document.write( message.destinationName + ' -- ' + message.payloadString );
    document.write('<br/>');
  };
  var options = {
    useSSL: false, // use port 8084 when true
    timeout: 3,
    onSuccess: function () {
      console.log("mqtt connected");
      client.subscribe('optimize', {qos: 0});
    },
    onFailure: function (message) {
      console.log("Connection failed: " + message.errorMessage);
    }
  };

  client.connect(options);
  window._listener_client = client;
})();
