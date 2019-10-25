"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();

// Run server to listen on port 3000.
const server = app.listen(3000, () => {
  console.log('listening on *:3000');
});

app.use(bodyParser.urlencoded({ extended: false } ));

// Set Express routes.
app.post('/events', (req, res) => {
    let to = req.body.to;
    let fromNumber = req.body.from;
    let callStatus = req.body.CallStatus;
    let callSid = req.body.callSid;
  
  console.log(to, fromNumber, callStatus, callSid);
    res.send('Event received');
  });

app.post('/welcome', (req, res) => {
    // Generate a TwiML response
    let VoiceResponse = new twilio.twiml.VoiceResponse();
    let response = new VoiceResponse();

    let response = new VoiceResponse();
    let gather = response.gather({
        action: '/phonenum',
        method: 'POST'
    });
    gather.say({
        voice: 'alice',
        language: 'jp-JP'
    }, '電話番号を入力して＃を押してください。');

    response.say({
        voice: 'alice',
        language: 'jp-JP'
    }, '何も入力されてません。');

    // for debug    
    console.log(response.toString());

    // Set the response type as XML.
    res.header('Content-Type', 'text/xml');
    // Send the TwiML as the response.
    res.send(twiml.toString());

});

app.post('/phonenum', (req, res) => {
    let phoneNum = req.body.Digits;
    // Generate a TwiML response
    let VoiceResponse = new twilio.twiml.VoiceResponse();
    let response = new VoiceResponse();

    let response = new VoiceResponse();
    let gather = response.gather({
        action: '/confirm',
        numDigits: '1',
        method: 'POST'
    });

    gather.say({
        voice: 'alice',
        language: 'jp-JP'
    }, 'あなたが入力した電話番号は '+phoneNum+'です。\nOKなら1を押してください。\n間違ったら0を押してください。');

    response.say({
        voice: 'alice',
        language: 'jp-JP'
    }, '何も入力されてません。');

    // if num is ok, save to database
    ////////////////////////////////////////////
    ////////////////////////////////////////////
    ////////////////////////////////////////////

    // for debug    
    console.log(response.toString());

    // Set the response type as XML.
    res.header('Content-Type', 'text/xml');
    // Send the TwiML as the response.
    res.send(twiml.toString());
});

app.post('/confirm', (req, res) => {
    let digit = req.body.Digits;
    // Generate a TwiML response
    let VoiceResponse = new twilio.twiml.VoiceResponse();
    let response = new VoiceResponse();
  
    if (digit) {
        if(digit == 1)
            response.say({
                voice: 'alice',
                language: 'jp-JP'
            }, '1の処理を行います。');        

        else if (digit == 0)
            response.say({
                voice: 'alice',
                language: 'jp-JP'
            }, '0の処理を行います。');        

    } else {
        response.say({
            voice: 'alice',
            language: 'jp-JP'
        }, '何も入力されてません。');
    }

    // for debug    
    console.log(response.toString());

    // Set the response type as XML.
    res.header('Content-Type', 'text/xml');
    // Send the TwiML as the response.
    res.send(twiml.toString());
});

