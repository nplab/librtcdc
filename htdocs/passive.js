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
var dcPassive = {};
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

	log('incoming datachannel');
};


// handle local ice candidates
pc.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc || !event || !event.candidate) {
		return;
	}
	// send ice candidate to signaling service
	$("#localICE").append("a=" + event.candidate.candidate + "\n");
	log('local ice candidate:' + extractIpFromString(event.candidate.candidate));
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

	// working backup
	remoteSDPofferJson1 = {
		"type" : "offer",
		"sdp" : "v=0\r\no=- 9127031914041095863 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=application 9 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:h9AOxSCCPzu3CKdo\r\na=ice-pwd:aulNwsNzBgRZhitRzVcHhuhx\r\na=fingerprint:sha-256 9B:CA:3B:65:B1:CA:30:9A:EF:82:50:EA:FC:91:40:4E:42:50:05:E6:05:93:01:59:8C:38:B1:7E:FA:ED:A1:F3\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n"
	}

	log(remoteSDPofferJson);
	var sessionDescription = new SessionDescription(remoteSDPofferJson);
	log(sessionDescription);
	pc.setRemoteDescription(sessionDescription);

	log("all fine!");

	dcPassive = pc.createDataChannel('dcPassive');
	bindEventsControl(dcPassive);

	// generate our answer SDP and send it to peer
	pc.createAnswer(function(answer) {
		pc.setLocalDescription(answer);
		log(answer);
		$("#sdpLocalAnswer").text(answer.sdp);
		$("#sdpLocalAnswerBase64").text(window.btoa(answer.sdp));
	}, errorHandler);

	setIceCandidates();
}


function setIceCandidates() {
	var iceCandidates = [
		"candidate:8 1 TCP 1019216383 10.0.1.207 9 typ host tcptype active",
		"candidate:9 1 TCP 1015022079 10.0.1.207 36431 typ host tcptype passive",
		"candidate:10 1 UDP 2013266431 212.201.121.87 51776 typ host",
		"candidate:11 1 TCP 1019216383 212.201.121.87 9 typ host tcptype active",
		"candidate:12 1 TCP 1015022079 212.201.121.87 40823 typ host tcptype passive"
	]

	$.each(iceCandidates, function( index, value ) {
  		//console.log('adding ice: ' + value);

		var iceCandidate = {
			candidate : value,
			sdpMid: "data",
			sdpMLineIndex: 0
		}

		/*iceCandidate = {
			candidate: "candidate:543062689 1 tcp 1518149375 192.168.1.17 0 typ host tcptype active generation 0",
			sdpMid: "data",
			sdpMLineIndex: 0
		}; */

		//console.log(iceCandidate);

		//pc.addIceCandidate(new IceCandidate(iceCandidate));
	});
}

// bind events for control channel
function bindEventsControl(channel) {
	channel.onopen = function() {
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		log("message: " + e.data);
	};
}
