const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const mediaConstraints = {'mandatory': {'OfferToReceiveAudio':false, 'OfferToReceiveVideo':true }};

var peerConnection = null;
var waitingOffer = true;

var client = new Paho.MQTT.Client("localhost", 8083, window.location.hash || randomstring());

client.onMessageArrived = (message) => {
  console.log("onMessageArrived: " + message.destinationName);
  const text = message.payloadString;

  if (message.destinationName === mkTopic('answer')) {
    let answer = new RTCSessionDescription({
      type: 'answer',
      sdp: text
    });
    peerConnection.setRemoteDescription(answer);
  } else if (message.destinationName === mkTopic('offer') && waitingOffer) {
    startVideo(stream => {
      peerConnection = prepareNewConnection(stream);
      var offer = new RTCSessionDescription({
       type : 'offer',
       sdp: text
      });
      peerConnection.setRemoteDescription(offer);

      peerConnection.createAnswer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        console.log("Answer SDP: " + sessionDescription);
      }, (error) => {
        console.log("createAnswer error: " + error);
      }, mediaConstraints);
    });

  }
};

client.connect({
  onSuccess: function() {
    console.log("connected");
    subscribe("offer");
  },
  onFailure: function(e) {
    console.log(e);
  }
});

function offer() {
  waitingOffer = false;

  startVideo(localStream => {
    peerConnection = prepareNewConnection(localStream);

    subscribe("answer");
    peerConnection.createOffer(function(sessionDescription) {
      peerConnection.setLocalDescription(sessionDescription);
      console.log("Offer SDP: " + sessionDescription);
    }, function(error) {
      console.log("createOffer error: " + error);
    }, mediaConstraints);
  });
}

function stop() {
  peerConnection.close();
  peerConnection = null;
}

function startVideo(cb) {
  navigator.webkitGetUserMedia({
    video: true,
    audio: false
  }, (stream) => {
    localVideo.src = window.webkitURL.createObjectURL(stream);
    localVideo.play();
    localVideo.volume = 0;
    cb(stream);
  }, (error) => {
    console.error('webkitGetUserMedia error occurred: [CODE ' + error.code + ']');
  });
}

function prepareNewConnection(localStream) {
  let peer = null;
  try {
    peer = new webkitRTCPeerConnection({iceServers: []});
  } catch (e) {
    console.log("Failed to create peerConnection, exception: " + e.message);
    return peer;
  }

  peer.onicecandidate = function (evt) {
    if (evt.candidate) {
      console.log(evt.candidate);
    } else {
      console.log(`ice event phase ${evt.eventPhase}`);
      publish(peer.localDescription.type, peer.localDescription.sdp);
    }
  };

  peer.oniceconnectionstatechange = function() {
    console.log(`ice connection=${peer.iceConnectionState} gathering=${peer.iceGatheringState}`);
  };

  peer.onsignalingstatechange = function() {
    console.log(`signaling state=${peer.signalingState}`);
  };

  peer.addStream(localStream);

  let channel = peer.createDataChannel("messages", {
    ordered: true,
    maxPacketLifeTime: null,
    maxRetransmits: null,
    protocol: "",
    negotiated: true,
    id: 1
  });

  channel.onopen = function(event) {
    channel.send('Hi!');
  };
  channel.onmessage = function(event) {
    console.log("channel.onmessage:", event.data);
  };

  peer.addEventListener("addstream", (event) => {
    remoteVideo.src = window.webkitURL.createObjectURL(event.stream);
  }, false);

  peer.addEventListener("removestream", (event) => {
    remoteVideo.src = "";
  }, false);

  return peer;
}

function mkTopic(signalingType) {
  return '/signaling/' + signalingType;
}

function subscribe(waitType) {
  client.subscribe(mkTopic(waitType));
}

function publish(type, text) {
  let topic = mkTopic(type);
  let message = new Paho.MQTT.Message(text);
  message.destinationName = topic;
  client.send(message);
}

function randomstring() {
  return Math.random().toString(36);
}
