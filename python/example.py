#!/usr/bin/env python

import pyrtcdc
import base64
import requests
import random
import json
import pdb

''' 
    URL to Firebase db
'''
base_url = "https://sniehus-webrtc-test.firebaseio.com"

def getRandom():
    return random.randint(1000,9999)

id = getRandom();

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
    else:
        body = {'N_A': data}    
    print(str(url) + " " + str(body) + " " + str(response))

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

peertype = input('[O]fferer / [A]nswerer: ')
if(peertype.upper() == "A"):
    id = input('Remote ID: ')
peer = pyrtcdc.PeerConnection(on_channel, on_candidate, on_connect, stun_server='stun.services.mozilla.com'.encode(encoding='utf_8', errors='strict'))

if(peertype.upper() == "O"):
    writeToFirebase("offer", base64.b64encode(peer.generate_offer()))
elif(peertype.upper() == "A"):
    writeToFirebase("answer", base64.b64encode(peer.generate_offer()))
    
#print ('base64 encoded local offer sdp:\n%s\n' %(base64.b64encode(offer)))
#print ('enter base64 encoded remote offer sdp:')

while True:
    if(peertype.upper() == "O"):
        roffer = readFromFirebase("answer")
    elif(peertype.upper() == "A"):
        roffer = readFromFirebase("offer")
    #roffer64 = input('Remote: > ')
    #roffer = base64.b64decode(roffer64)
    print ('remote offer sdp:\n%s' %(roffer))
    res = peer.parse_offer(roffer)

    if res >= 0:
        offer = peer.generate_offer()
        print ('new base64 encoded local offer sdp:\n%s\n' %(base64.b64encode(offer)))
        break

    print ('invalid remote offer sdp')
    print ('enter base64 encoded remote offer sdp:')


if(peertype.upper() == "O"):
    readIceCandidates("ice-candidates-answerer")
elif(peertype.upper() == "A"):    
    readIceCandidates("ice-candidates-offerer")
peer.loop()
