"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
var pool = require('./database');
const app = express();
const dotenv = require('dotenv');

/**
 * .env file config
 */
dotenv.config();

/**
 * Run server to listen on port 3000.
 */
const server = app.listen(process.env.PORT, () => {
    console.log('listening on *:' +process.env.PORT);
});

app.use(bodyParser.urlencoded({
    extended: true
}));

global.newContact = {};
app.use(express.static('public'));
app.use(function(req, res, next){
    newContact = {
        call_sid: req.body.CallSid || '',
        from: req.body.From || '',
        to: req.body.To || '',
        created_at: new Date(),
        updated_at: new Date(),
        phone: '',
    };
    console.log(newContact);
    next();
});

/**
 * Message Constants
 */
const MSG_WELCOME = 'お電話ありがとうございます。こちらは、カムイルミナお問い合わせ窓口です。音声ガイダンスに従って、番号を入力してください。はじめに、ご利用の電話回線を確認いたしますので、*を押してください。';
const MSG_STOP_SERVICE = `本日のカムイルミナは、悪天候のため中止とさせていただいております。本日のチケットをご予約いただいておりますお客様に着きましては、近日中にキャンセルの上ご返金のご連絡を、ご購入時のメールアドレスにお送りさせていただきます。\nこの度はお電話誠にありがとうございました。`;
const MSG_1 = '本日の営業のお問い合わせにつきましては「１」を、ご購入されたチケットの日時変更・キャンセルに関しましては「２」を、購入したチケットの再発行に関しましては「３」を、購入したチケットの領収書につきましては「４」を、その他のお問い合わせに関しましては「５」を押してください。';
const MSG_2_1 = '本日のカムイルミナの営業時間は17時から21時半までとなっております。ご予約いただきましたお客様に着きましては、ご予約時間の15分前には入場口へお越しくださいますよう、お願いいたします。\nこの度はお電話誠にありがとうございました。';
const MSG_2_2 = 'ご購入されたチケットの日時変更をご希望のかたは「１」を、ご購入されたチケットのキャンセルをご希望のかたは「２」を押してください。';
const MSG_2_3 = 'WEBでご購入されましたチケットに関しましては、ショートメッセージ送信による再発行が可能です。ごこうにゅうじに登録されたお電話番号をご入力の上、最後に「シャープ」ボタンを押してください。なお、ご購入時と異なるお電話番号を入力されても、再発行はできませんので予めご了承ください。';
const MSG_2_3_p_prefix = 'お電話番号は「';
const MSG_2_3_p_suffix = '」ですね。よろしければ「１」を、再度ご入力される場合は「２」を押してください。';
const MSG_2_3_p_1 = '再発行依頼を承りました。ご入力いただきましたお電話番号の注文が確認できましたら、チケットの再発行を行います。\nこの度はお電話誠にありがとうございました。';
const MSG_2_4 = 'WEBで予約購入されましたチケットの領収書をご希望のお客様は、ご来場当日、カムイルミナの入場窓口までお越しいただきました上、その旨スタッフにお伝えください。\nこの度はお電話誠にありがとうございました。';
const MSG_2_5 = 'その他のお問い合わせにつきましては、こちらから折り返しお電話にてご連絡させていただきます。折り返しご連絡可能なお電話番号をご入力の上、最後に「シャープ」ボタンを押してください。';
const MSG_2_5_p_prefix = 'お電話番号は「';
const MSG_2_5_p_suffix = '」ですね。よろしければ「１」を、再度ご入力される場合は「２」を押してください。';
const MSG_2_5_p_1 = 'ピーというはっしんおんの後に、お問い合わせ内容をお話しください。終了しましたら、「シャープ」を押してください。';
const MSG_2_5_p_1_a = 'お問い合わせを承りました。内容を確認いたしまして、折り返しご連絡させていただきます。この度はお電話誠にありがとうございました。';
const MSG_3_1 = 'WEBで予約購入されましたチケットの予約日時の変更に関しましては、特に事前の手続きは不要です。ご来場当日、カムイルミナの入場窓口までお越しいただきました上、その旨スタッフにお伝えください。\nこの度はお電話誠にありがとうございました。';
const MSG_3_2 = 'WEBで予約購入されましたチケットのキャンセルにつきましては、基本的に承っておりません。天候などの理由にて、カムイルミナの開催が中止になった場合につきましては、後日チケットのキャンセルとご返金のご連絡をメールにてさせていただきます。\nこの度はお電話誠にありがとうございました。';
const MSG_NO_TONE = 'ご入力が確認できません。ダイヤル回線ご利用のかたは、プッシュトーンへの切替えをお願いいたします。';
const MSG_BAD_DIGIT = 'ご入力番号が確認できませんでした。音声ガイダンスに従って、番号を正しく入力してください。';
const MSG_BAD_PHONE = '電話番号を正しく入力してください。';

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
    let response = new VoiceResponse();

    response.gather({
        action: '/section_1',
        method: 'POST',
        numDigits: 1,
        input: 'dtmf',
        timeout: 3600
    }).say({
        voice: 'alice',
        language: 'ja-JP'
    }, MSG_WELCOME);

    response.say({
        voice: 'alice',
        language: 'ja-JP'
    }, MSG_NO_TONE);

    console.log(response.toString()); // for debug
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());

});

app.post('/section_1', (req, res) => {
    let digit = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();
    response.gather({
        action: '/section_2',
        method: 'POST',
        numDigits: 1,            
        input: 'dtmf',
        timeout: 3600      
    }).say({
        voice: 'alice',
        language: 'ja-JP'
    }, MSG_1);
    response.say({
        voice: 'alice',
        language: 'ja-JP'
    }, MSG_NO_TONE);
    console.log(response.toString()); // for debug
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());

});

app.post('/section_2', (req, res) => {
    let digit = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();

    // 2-1.本日の営業に関して
    if (digit == '1') {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_1 );
    // 2-2.購入チケットに関して
    } else if (digit == '2') {
        response.gather({
            action: '/section_2_2',
            method: 'POST',
            numDigits: 1,            
            input: 'dtmf',
            timeout: 3600
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_2
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);
    // 2-3.購入したチケットの再発行
    } else if (digit == '3') {
        response.gather({
            action: '/section_2_3',
            method: 'POST',
            finishOnKey: '#',            
            timeout: 3600,
            input: 'dtmf'
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_3
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);
    // 2-4.購入したチケットの領収書
    } else if (digit == '4') {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_4 
        );        
    // 2-5.その他のお問い合わせ
    } else if (digit == '5') {
        response.gather({
            action: '/section_2_5',
            method: 'POST',
            finishOnKey: '#',            
            input: 'dtmf',
            timeout: 3600          
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_5
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);
    } else {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_BAD_DIGIT);        
    }
    console.log(response.toString()); // for debug
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.post('/section_2_2', (req, res) => {
    let digit = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();

    if (digit == '1') {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_3_1
        );
    // 3-3.購入したチケットのキャンセル
    } else if (digit == '2') {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_3_2 
        );
    } else {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_BAD_DIGIT);        
    }
    console.log(response.toString());
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.post('/section_2_3', (req, res) => {
    let phoneNumber = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();
    if (phoneNumber) {
        // 電話番号をデータベースに保存する
        console.log(newContact);

        pool.query("INSERT INTO contacts set ?", newContact, function (err, result) {
            if(err) 
                console.log("error: ", err);
            else
                console.log('Inserted new record into contacts:'+result);
        });

        var slowPlay =  phoneNumber.split('').join(', ');

        response.gather({
            action: '/section_2_3_p',
            method: 'POST',
            numDigits: 1,         
            timeout: 3600,
            input: 'dtmf'
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_3_p_prefix + slowPlay + MSG_2_3_p_suffix
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);        
    } else {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_BAD_PHONE);        
    }
    console.log(response.toString());
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.post('/section_2_3_p', (req, res) => {
    let digit = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();
    // よろしければ
    if (digit == '1') {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_3_p_1
        );
    // 再度ご入力される場合
    } else if (digit == '2') {
        // 保存した電話番号を捨てる
        pool.query("DELETE FROM contacts WHERE call_sid = ?", [req.body.CallSid], function (err, result) {
            if(err) 
                console.log("error: ", err);
            else
            console.log('Deleted record, CallSid: '+req.body.CallSid);
        });

        response.gather({
            action: '/section_2_3',
            method: 'POST',
            finishOnKey: '#',            
            timeout: 3600,
            input: 'dtmf'
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_3
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);                 
    } else {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_BAD_DIGIT);            
    }
    console.log(response.toString());
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.post('/section_2_5', (req, res) => {
    let phoneNumber = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();
    // check phone
    if (phoneNumber) {
        // 電話番号をデータベースに保存する
        console.log(newContact);
        pool.query("INSERT INTO contacts set ?", newContact, function (err, result) {
            if(err) 
                console.log("error: ", err);
            else
                console.log('Inserted new record into contacts:'+result);
        });
        var slowPlay =  phoneNumber.split('').join(', ');
        response.gather({
            action: '/section_2_5_p',
            method: 'POST',
            numDigits: 1,
            timeout: 3600,
            input: 'dtmf'
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_5_p_prefix + slowPlay + MSG_2_5_p_suffix
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);        
    } else {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_BAD_PHONE);
    }
    console.log(response.toString());
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.post('/section_2_5_p', (req, res) => {
    let digit = req.body.Digits;
    // Generate a TwiML response
    let response = new VoiceResponse();
    // お問い合わせ内容
    if (digit == '1') {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_5_p_1
        );
        response.record({
            action: '/section_2_5_p_1',
            method: 'POST',
            playBeep: true,
            finishOnKey: '#',
            timeout: 10
        });
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);        
    // 再度ご入力される場合 
    } else if (digit == '2') {
        // 保存した電話番号を捨てる
        pool.query("DELETE FROM contacts WHERE call_sid = ?", [req.body.CallSid], function (err, result) {
            if(err) 
                console.log("error: ", err);
            else
            console.log('Deleted record, CallSid: '+req.body.CallSid);
        });
        response.gather({
            action: '/section_2_5',
            method: 'POST',
            finishOnKey: '#',            
            input: 'dtmf',
            timeout: 3600
        }).say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_2_5
        );
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_NO_TONE);        
    } else {
        response.say({
            voice: 'alice',
            language: 'ja-JP'
        }, MSG_BAD_DIGIT);            
    }
    console.log(response.toString());
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.post('/section_2_5_p_1', (req, res) => {

    let recordingURL = req.body.RecordingURL;
    let recordingDuration = req.body.RecordingDuration;
    let digits = req.body.Digits;

    // Generate a TwiML response
    let response = new VoiceResponse();
    
    // save recording url and attributes
    newContact.recording_url = req.body.RecordingURL;
    newContact.recording_duration = req.body.RecordingDuration;

    pool.query("INSERT INTO contacts set ?", newContact, function (err, result) {
        if(err) 
            console.log("error: ", err);
        else
            console.log('Inserted new record into contacts:'+result);
    });

    response.say({
        voice: 'alice',
        language: 'ja-JP'
    }, MSG_2_5_p_1_a
    );

    // 音声データを保存する
    console.log(response.toString());
    res.header('Content-Type', 'text/xml');
    res.send(response.toString());
});