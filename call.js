var localVid;
var remoteVid;
// var startbutton;
var callbutton;
var hangupbutton;
var peerConnection;

// var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};
 var peerConnectionConfig = null;

function init() {

  // uuid = uuid();

  console.log("Init Called \n");
  localVid = document.getElementById("localVid");
  remoteVid = document.getElementById("remoteVid");

  // startbutton = document.getElementById("start");
  callbutton = document.getElementById("call");
  hangupbutton = document.getElementById("stop");

  URL = "wss://" + window.location.hostname + ":8443";
  serverConnection = new WebSocket(URL);
  trace(URL);

  serverConnection.onmessage = gotServerMessage;

  // startbutton.disabled = true;
  hangupbutton.disabled = false;
  callbutton.disabled = false;

  if (hasgetUserMedia()) {
    var constarints = {
      audio: true,
      video: true
    };
    navigator.mediaDevices.getUserMedia(constarints).then(getUserMediaSuccess).catch(getUserMediaError);
  }
}

function hasgetUserMedia() {
  if (navigator.mediaDevices === undefined || navigator.mediaDevices.getUserMedia === undefined) {
    console.log("Your Doesn't support the getUserMedia");
    return;
  } else {
    console.log("Your Browser Supports getUserMedia");
    return 1;
  }
}


// This will help me to trace out everything.
function trace(text) {
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}


function getUserMediaSuccess(stream) {
  localStream = stream;
  localVid.srcObject = stream;
  localVid.onloadedmetadata = function() {
    localVid.play();
  }
}

function getUserMediaError(error) {
  console.log(error.name + " : " + error.message);
}

function call(isCaller) {

  console.log("Call has been Started!");
  // if(!isCaller) start();

  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.onaddstream = gotRemoteStream;
  peerConnection.addStream(localStream);

  if(isCaller){
      peerConnection.createOffer().then(createdDesc).catch(gotError);
  }

}

function gotIceCandidate(event) {

  if(event.candidate != null){
    console.log("Got ICE candidate : " + event.candidate.candidate);
    // serverConnection.send(JSON.stringify({'ice':event.candidate, 'uuid':uuid} ) );
        serverConnection.send(JSON.stringify({'ice':event.candidate } ) );
  }
}

function gotRemoteStream(event) {
  console.log("gotRemoteStream ");
  // remoteVid.src = window.URL.createObjectURL(event.stream);
  remoteVid.srcObject = event.stream;
}

function gotServerMessage(message) {

  console.log("Got mEssage from Server  : ");
  if(!peerConnection) {
    call(false);
  }

  var recSDP = JSON.parse(message.data);
  console.log( recSDP);
  // Don't process, if it is from ourself.
  // if(recSDP.uuid == uuid) return;

  if(recSDP.sdp) {
    console.log("ABout to set remoteDescription");
    peerConnection.setRemoteDescription( new RTCSessionDescription(recSDP.sdp)).then(function () {
      // now create the Answer and send it to other guy.
      if(recSDP.sdp.type == 'offer'){
        console.log("About create Answer ");
        peerConnection.createAnswer().then(createdDesc).catch(gotError);
      }
    }).catch(gotError);
  }else if (recSDP.ice) {
    console.log("Got the ICE Candidate, Adding it to peerConnection ");
    peerConnection.addIceCandidate(new RTCIceCandidate(recSDP.ice)).catch(gotError);
  }

}

function createdDesc(desc) {
  console.log("Got Created Desc : " );
  console.log(desc.sdp);
  peerConnection.setLocalDescription(desc).then(function () {
    // serverConnection.send(JSON.stringify({'sdp':peerConnection.localDescription, 'uuid' : uuid }))
        serverConnection.send(JSON.stringify({'sdp':peerConnection.localDescription }))
  }).catch(gotError);
}


function gotError(error) {
    console.log(error);
}

function stop() {
  console.log("stop button clicked ");
  peerConnection.close();
  peerConnection = null;
  hangupbutton.disabled = true;
}


// function uuid() {
//   function s4() {
//     return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
//   }
//
//   return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
// }
