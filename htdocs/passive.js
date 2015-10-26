/*-
* Copyright (c) 2015 Felix Weinrank
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions
* are met:
* 1. Redistributions of source code must retain the above copyright
*    notice, this list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright
*    notice, this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
* OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
* HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
* LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
* OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
* SUCH DAMAGE.
*
*/


// constraints for the offer SDP - here we don't need audio or video...
var sdpConstraints = {
	'mandatory' : {
		'offerToReceiveAudio' : false,
		'offerToReceiveVideo' : false
	}
};

console.log(iceServer);

var pc = new PeerConnection(iceServer);
var dcControl = {};
var offerer;
var signalingInProgress = false;
var signalingId;


function log(string) {
	console.log(string);
}



// generic error handler
function errorHandler(err) {
	console.error(err);
}

// ondatachannel handler
pc.ondatachannel = function(event) {
	if (event.channel.label == "control") {
		dcControl = event.channel;
		bindEventsControl(event.channel);
	} else {
		alert("error: unknown channel!");
	}

	console.log('incoming datachannel');
};


// handle local ice candidates
pc.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc || !event || !event.candidate) {
		return;
	}
	// send ice candidate to signaling service
	$("#localICE").append("a=" + event.candidate.candidate + "\n");
	console.log('local ice candidate:' + extractIpFromString(event.candidate.candidate));
};


function sdpCreateAnswer() {
	sdpRemoteOfferBase64 = $("#sdpRemoteOfferBase64").val();
	sdpRemoteOffer = window.atob(sdpRemoteOfferBase64);

	$("#sdpRemoteOffer").text(sdpRemoteOffer);

	log("remote SDP:\n" + sdpRemoteOffer);

	remoteSDPofferJson = {
		"type" : "offer",
		"sdp" : sdpRemoteOffer
	}

	remoteSDPofferJson1 = {
		"type" : "offer",
		"sdp" : "v=0\r\no=- 9127031914041095863 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:h9AOxSCCPzu3CKdo\r\na=ice-pwd:aulNwsNzBgRZhitRzVcHhuhx\r\na=fingerprint:sha-256 9B:CA:3B:65:B1:CA:30:9A:EF:82:50:EA:FC:91:40:4E:42:50:05:E6:05:93:01:59:8C:38:B1:7E:FA:ED:A1:F3\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n"
	}

	remoteSDPofferJson1 = {
		"type" : "offer",
		"sdp" : "v=0\r\no=- 4883178682354213 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:gC8q\r\na=ice-pwd:U11wQV956+oOfpLbL3C6RQ\r\na=fingerprint:sha-256 88:F2:FD:F1:15:2A:24:08:8B:16:64:88:42:BD:D6:E9:14:ED:8A:71:B6:C3:F0:4B:A6:80:42:D1:64:38:FD:0C\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n"
		//"sdp" : "v=0\r\no=- 9127031914041095863 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:h9AOxSCCPzu3CKdo\r\na=ice-pwd:aulNwsNzBgRZhitRzVcHhuhx\r\na=fingerprint:sha-256 88:F2:FD:F1:15:2A:24:08:8B:16:64:88:42:BD:D6:E9:14:ED:8A:71:B6:C3:F0:4B:A6:80:42:D1:64:38:FD:0C\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n"
	}

	log(remoteSDPofferJson);

	var sessionDescription = new SessionDescription(remoteSDPofferJson);

	pc.setRemoteDescription(new SessionDescription(remoteSDPofferJson));

	log("all fine!");

	// generate our answer SDP and send it to peer
	pc.createAnswer(function(answer) {
		pc.setLocalDescription(answer);
		log(answer);
		$("#sdpLocalAnswer").text(answer.sdp);
		$("#sdpLocalAnswerBase64").text(window.btoa(answer.sdp));
	}, errorHandler);
}


function setIceCandidates() {
	var iceCandidate1 = {
		candidate : "candidate:10 1 UDP 2013266431 212.201.121.87 40619 typ host",
		//sdpMid : "data",
		//sdpMLineIndex : "0"
		// candidate: "candidate:543062689 1 tcp 1518149375 192.168.1.17 0 typ host tcptype active generation 0", sdpMid: "data", sdpMLineIndex: 0
		//"candidate" : "candidate:10 1 UDP 2013266431 212.201.121.87 40619 typ host"
	}

	var iceCandidates = [
		//"candidate:10 1 UDP 2013266431 212.201.121.87 40619 typ host",
		//"candidate:11 1 TCP 1019216383 212.201.121.87 9 typ host tcptype active",
		//"candidate:12 1 TCP 1015022079 212.201.121.87 44650 typ host tcptype passive",
		"candidate:1456924780 1 udp 2122260223 10.0.1.25 63074 typ host generation 0",
		"candidate:1 1 UDP 1694179327 178.251.11.127 59999 typ srflx raddr 192.168.1.17 rport 59999",
		"candidate:7 1 UDP 100343807 212.201.121.93 53463 typ relay raddr 212.201.121.93 rport 53463",

	]

	$.each(iceCandidates, function( index, value ) {
  		console.log('adding: ' + value);

		var iceCandidate = {
			candidate : value
		}

		iceCandidate = {candidate: "candidate:543062689 1 tcp 1518149375 192.168.1.17 0 typ host tcptype active generation 0", sdpMid: "data", sdpMLineIndex: 0};

		console.log(iceCandidate);

		pc.addIceCandidate(new IceCandidate(iceCandidate));
	});
}

// gather local ice candidates



// establish connection to remote peer via webrtc
function connect(active) {
	signalingInProgress = true;

	if(active == true) {
		console.log('connecting actively');
		offerer = true;
		signalingId = generateSignalingId();
	} else {
		console.log('connecting passively');
		offerer = false;
		signalingId = $("#signalingId").val();
	}

	if(signalingId.length === 0) {
		console.log('signalingId empty');
		return;
	}

	// join room
	socket.emit('roomJoin', appIdent + signalingId);
	$("#rowInit").slideUp();

	if (offerer == true) {
		$(".spinnerStatus").html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');
		//new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);

		// create data channel
		dcControl = pc.createDataChannel('control');
		bindEventsControl(dcControl);
		console.log("connect - role: offerer");
	} else {
		// request SDP from offerer
		socket.emit('signaling', {type:'sdpRequest'});
		// answerer must wait for the data channel
		pc.ondatachannel = function(event) {
			// bin incoming control channel
			if (event.channel.label == "control") {
				dcControl = event.channel;
				bindEventsControl(event.channel);
			} else {
				alert("error: unknown channel!");
			}
			console.log('incoming datachannel');
		};

		$(".spinnerStatus").text("connecting to peer id: " + signalingId);
		console.log('connect - role answerer');
	}
	$("#rowSpinner").hide().removeClass('hidden').slideDown();
}

// bind events for control channel
function bindEventsControl(channel) {
	channel.onopen = function() {
		$("#rowSpinner").slideUp();
		$("#rowChat").hide().removeClass('hidden').slideDown();
		$('#chatMessages').append('<div class="alert alert-warning" role="alert">Connection up - HTML enabled!</div>');
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
		$('#chatMessages').append('<div class="alert alert-warning" role="alert">Connection lost!</div>');
		$("#chatControl").slideUp();
	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		$('#chatMessages').append('<div class="alert alert-info text-right" role="alert">' + e.data + '</div>');
	};
}

// Send message to peer
$('#chatInput').keypress(function (e) {
	if (e.which == 13) {
	  	var text = $(this).val();
		dcControl.send(text);
		$('#chatMessages').append('<div class="alert alert-success" role="alert">' + text + '</div>');
    	$(this).val('');
  	}
});
