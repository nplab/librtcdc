#!/usr/bin/env python

import pyrtcdc
import base64
import requests
import random
import json
import pdb
import sys
import optparse

#URL to Firebase db
base_url = "https://sniehus-webrtc-test.firebaseio.com"

def getRandom():
    return random.randint(1000,9999)

def deleteOldData():
    print("Deleting old data..")
    url = base_url + "/" + str(id) + ".json"
    response = requests.delete(url)
    print("Old data deleted")
     

def writeToFirebase(type, data):
    if(type.startswith("ice-candidates")):
        body = '{"' + type + '": "'+ data.decode('utf_8') +'"}'
        url = base_url + "/" + str(id) + "/" + type + ".json"    
        response = requests.post(url, data=body)
    elif(type == "offer"):
        body = '{"offer": "'+ data.decode('utf_8') +'"}'
        url = base_url + "/" + str(id) + "/" + type + ".json"    
        response = requests.put(url, data=body)
    elif(type == "answer"):
        body = '{"answer": "'+ data.decode('utf_8') +'"}'
        url = base_url + "/" + str(id) + "/" + type + ".json"    
        response = requests.put(url, data=body)    
    #print(str(url) + " " + str(body) + " " + str(response))

def readFromFirebase(type):
    returnVal = ""    
    if(type == "offer"):
        url = base_url + "/" + str(id) + "/" + type + ".json"
        response = requests.get(url)        
        jsonVal = json.loads(response.text)
        returnVal = base64.b64decode(jsonVal['offer'])
    elif(type == "answer"):
        returnVal = ""
        while(returnVal == ""):
            try:
                url = base_url + "/" + str(id) + "/" + type + ".json"
                response = requests.get(url)    
                jsonVal = json.loads(response.text)
                returnVal = base64.b64decode(jsonVal['answer'])
            except:
                print("No answer yet. Retrying")
    return returnVal
def readIceCandidates(type):
    url = base_url + "/" + str(id) + "/" + type + ".json"
    response = requests.get(url)
    jsonVal = json.loads(response.text)
    
    for key in jsonVal: 
        peer.parse_candidates(jsonVal[key][type].encode(encoding='utf_8', errors='strict'))
        print(jsonVal[key][type])
# called when connected to remote peer
def on_connect(peer):
    print('on_connect!\n')
    peer.create_data_channel('demo', on_open=on_open)

# called when channel is opened
def on_open(channel):
    print('OPEN!!!!\n')
    channel.on_message = on_message
    channel.send(pyrtcdc.DATATYPE_STRING, 'Hi')

def on_channel(peer, channel):
    print('new channel %s created\n' %(channel.label))
    channel.on_message = on_message

def on_candidate(peer, candidate):
    if(peertype.upper() == "O"):
        writeToFirebase("ice-candidates-offerer", candidate)
    elif(peertype.upper() == "A"):
        writeToFirebase("ice-candidates-answerer", candidate)

def on_message(channel, datatype, data):
    print ('received data from channel %s: %s\n' %(channel.label, data))
    channel.send(pyrtcdc.DATATYPE_STRING, 'hi')


parser = optparse.OptionParser()
parser.add_option("-r", "--role", 
                  help="Sets this instance to be a answerer",
                  type="choice",
                  choices=['answerer', 'offerer'],
                  action="store",
                  dest="role")
parser.add_option("-i", "--remoteid",
                  help="Sets the id ",
                  type="int",
                  action="store",
                  dest="id")
(options, args) = parser.parse_args()
if(options.role is None):
    parser.error("Role not set\nSet it with -r [answerer/offerer]")
elif(options.role == "answerer"):
    if(options.id is None):
        parser.error("Answerer MUST set id")
    else:
        id = options.id
        peertype = "A"
elif(options.role == "offerer"):
    if(options.id is None):
        id = getRandom();
        peertype = "O"
    else:
        id = options.id
        peertype = "O"

print('Local ID: ' + str(id))
print('Local role: ' + str(peertype))
if(peertype.upper() == "O"):
    deleteOldData()
peer = pyrtcdc.PeerConnection(on_channel, on_candidate, on_connect, stun_server='stun.services.mozilla.com'.encode(encoding='utf_8', errors='strict'))
if(peertype.upper() == "O"):    
    print("Generating offer and gathering ICE candidates..")    
    writeToFirebase("offer", base64.b64encode(peer.generate_offer()))
    print("Offer generated and ICE candidates gathered")    
elif(peertype.upper() == "A"):
    print("Generating answer and gathering ICE candidates..")
    writeToFirebase("answer", base64.b64encode(peer.generate_offer()))
    print("Answer generated and ICE candidates gathered")    
    

while True:
    if(peertype.upper() == "O"):
        roffer = readFromFirebase("answer")
    elif(peertype.upper() == "A"):
        roffer = readFromFirebase("offer")
    print ('remote offer sdp:\n%s' %(roffer))
    res = peer.parse_offer(roffer)

    if res >= 0:
        break

if(peertype.upper() == "O"):
    readIceCandidates("ice-candidates-answerer")
elif(peertype.upper() == "A"):    
    readIceCandidates("ice-candidates-offerer")
peer.loop()
