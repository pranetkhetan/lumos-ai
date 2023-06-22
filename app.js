const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const fs = require('fs')
const request = require('request')
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config()
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);
const PORT = process.env.PORT || 3030;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
var multer = require('multer');
var path = require('path')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) 
  }
})
var upload = multer({ storage: storage });

let worksheets = []
let wsid = 0

app.get('/', function(req,res){
    res.render('home')
});
app.get('/access', function(req,res){
    res.render('access')
});
app.get('/create', function(req,res){
    console.log(req.socket.remoteAddress)
    let id = wsid + 1
    let emptyplaceholder = {
        id:id,
        title: "",
        q1: "",
        q2: "",
        akey1: "",
        akey2: ""
    }
    worksheets.push(emptyplaceholder)
    wsid += 1
    res.render('create',{ id:id })
});
app.post('/create', function(req,res){
    let id = req.body.wsid
    let worksheet = {
        id: req.body.wsid,
        title: req.body.topic,
        q1: req.body.question1,
        q2: req.body.question2,
        akey1: req.body.answer1,
        akey2: req.body.answer2
    }
    worksheets[id-1] = worksheet
    res.render('message',{ messageTitle: "Your worksheet has been created",messageBody: "It has been saved in a variable on this instance of the server. You can now use the 'Answer Worksheet' option in the navbar to answer the worksheet and check your score!" })
});
app.post('/access', function(req,res){
    let resp = req.body.wsid
    let id = +resp
    if(isNaN(id) || typeof worksheets[id-1] === 'undefined') {
        res.render('message',{ messageTitle: "Cannot find worksheet",messageBody: "Please enter a valid worksheet ID" })
    } else {
        let ws = worksheets[id-1]
        res.render('answer',{ worksheet:ws, id:id })
    }
}); //hello
app.post('/ocr',upload.single('file'), function(req,res){
    ocranswers = ""
    try {
        const form_data = {
            file: fs.createReadStream(req.file.path),
        }
        const options = {
            url : "https://app.nanonets.com/api/v2/OCR/Model/fecc8c52-0752-4f35-8272-2ce494dd4a74/LabelFile/?async=false",
            formData: form_data,
            headers: {
                'Authorization' : 'Basic ' + Buffer.from('c6b8ead3-0ea9-11ee-a77a-46cff35bfcf2' + ':').toString('base64')
            }
        }
        try{    
            request.post(options, function(err, httpResponse, body) {
                let output = JSON.parse(body)
                try {
                    let prediction = output.result[0].prediction[0].ocr_text
                    let firstline = 'You will get an input in the form of a paragraph of text, that is the output of an OCR algorithm. Can you use your understanding of language and text to correct it? After correcting it, you will find that the text is divided into two parts - Answer 1 and Answer 2. You need to separate these. The ONLY format you can reply is - {"answer1":"<the text for answer 1>", "answer2":"<the text for answer 2>"} The text is - '
                    let prompt = firstline + prediction
                    async function runCompletion () {
                        const completion = await openai.createCompletion({
                        "model": "text-davinci-003",
                        "prompt": prompt,
                        "max_tokens": 1000,
                        "n": 1,
                        "temperature": 0.4
                        });
                        try {    
                            let answer = JSON.parse(completion.data.choices[0].text)
                            ocranswers = answer
                            let id = req.body.id
                            let worksheet = worksheets[id - 1]
                            res.render('ocredit',{ worksheet:worksheet, id:id, ocr:ocranswers })
                        } catch(err) {
                            console.log(err)
                            res.render('message',{ messageTitle:"Error uploading your answers", messageBody:"This usually happens very rarely. Please try again." })
                        }
                    }
                    runCompletion();
                } catch(err) {
                    console.log(err)
                    res.render('message',{ messageTitle:"Error uploading your answers", messageBody:"Are you sure it was the right file type?" })
                }
            }); 
        } catch(err){
            console.log(err)
            res.render('message',{ messageTitle:"Error uploading your answers", messageBody:"This usually happens very rarely. Please try again." })
        }
    } catch {
        res.render('message',{messageTitle: "No input given", messageBody: "You have not uploaded any file. Please try again."})
    }
});
app.post('/answer', function(req,res){
    let id = req.body.id
    let package = worksheets[id-1]
    package.a1 = req.body.a1
    package.a2 = req.body.a2
    questionset = "{ question1: '"
    questionset = questionset + package.q1 + "', answer1: '"
    questionset = questionset + package.a1 + "', answerkey1: '"
    questionset = questionset + package.akey1 + "'"
    questionset = questionset + ", question2: '" + package.q2 + "'"
    questionset = questionset + ", answer2: '" + package.a2 + "'"
    questionset = questionset + ", answerkey2: '" + package.akey2 + "' }"
    prompt = 'Read this prompt in detail and be prepared to answer all questions: You will be provided with three values: a question, an answer, and an answer key in the format { question1: <question goes here>, answer1: <answer goes here>, answerkey1: <answer key goes here>, question2:<question goes here>, answer2: <answer goes here>, answerkey2: <answer key goes here> }. You have to compare the answer to the answer key and give it a score out of three along with detailed feedback. A few pointers to keep in mind: 1) The answers are long answers and don\'t necessarily have to be word-to-word similar. They can be paraphrased or written in a different way but MUST CONTAIN ALL IMPORTANT KEYWORDS in the answer key, 2) Also compare the amount of DETAIL in the answer. You CANNOT give it a perfect score if it is missing any important detail or keyword. TO REACH A PERFECT SCORE, THE ANSWER MUST CONTAIN ALL KEYWORDS AND PROCESSES. A ONE-LINER WILL ONLY GET 1 MARK, 3) You are allowed to give DECIMAL scores, 4) Be very STRICT with your correction. If the answer is NOT SATISFACTORY, give a 1. The ONLY format you can use to reply is - {"score1":"<your score for answer 1>","feedback1":"<your feedback for answer 1>","score2":"<your score for answer 2>","feedback2":"<your feedback for answer 2>"}. DO NOT FORGET TO APPLY COMMON SENSE The answers you have to grade are: '
    prompt = prompt + questionset
    async function runCompletion () {
        const completion = await openai.createCompletion({
          "model": "text-davinci-003",
          "prompt": prompt,
          "max_tokens": 1000,
          "n": 1,
          "temperature": 0.4
        });
        try {    
            let answer = JSON.parse(completion.data.choices[0].text)
            res.render('result',{ package:package,scores:answer })
        } catch(err) {
            console.log(err)
            res.render('message',{ messageTitle:"Error uploading your answers", messageBody:"This usually happens very rarely. Please try again." })
        }
        }
    runCompletion();
});
app.listen(PORT, function() {
    console.log("Server started on port " + String(PORT));
});