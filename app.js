const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
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

let worksheets = []
let wsid = 0

app.get('/', function(req,res){
    res.render('home')
});
app.get('/access', function(req,res){
    res.render('access')
});
app.get('/create', function(req,res){
    res.render('create',{ id: wsid+1 })
});
app.post('/create', function(req,res){
    const worksheet = {
        id: wsid + 1,
        title: req.body.topic,
        q1: req.body.question1,
        q2: req.body.question2,
        akey1: req.body.answer1,
        akey2: req.body.answer2
    }
    worksheets.push(worksheet)
    console.log(worksheets)
    res.render('message',{ messageTitle: "Your worksheet has been created",messageBody: "It has been saved in a variable on this instance of the server. You can now use the 'Answer Worksheet' option in the navbar to answer the worksheet and check your score!" })
    wsid += 1
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
});
app.post('/answer', function(req,res){
    let id = req.body.id
    let package = worksheets[id-1]
    package.a1 = req.body.a1
    package.a2 = req.body.a2
    questionset = "{ question 1: '"
    questionset = questionset + package.q1 + "' answer 1: '"
    questionset = questionset + package.a1 + "' answer key 1: '"
    questionset = questionset + package.akey1 + "'"
    questionset = questionset + " question 2: '" + package.q2 + "'"
    questionset = questionset + " answer 2: '" + package.a2 + "'"
    questionset = questionset + " answer key 2: '" + package.akey2 + "' }"
    prompt = 'Read this prompt in detail and be prepared to answer all questions: You will be provided with three values: a question, an answer, and an answer key in the format { question1: <question goes here>, answer1: <answer goes here>, answerkey1: <answer key goes here>, question2:<question goes here>, answer2: <answer goes here>, answerkey2: <answer key goes here> }. You have to compare the answer to the answer key and give it a score out of three (You are being used to compare and grade student answers). A few pointers to keep in mind: 1) The answers are long answers and don\'t necessarily have to be word-to-word similar. They can be paraphrased or written in a different way but MUST CONTAIN ALL IMPORTANT KEYWORDS in the answer key, 2) Also compare the amount of DETAIL in the answer. You CANNOT give it a perfect score if it is missing any important detail or keyword. It also needs to contain all mentions of all the processes or details mentioned in the answer key. A ONE-LINER WILL ONLY GET 1 MARK, 3) You are allowed to give DECIMAL scores, 4) Be very STRICT with your correction. Do not be AFRAID of giving an extremely low score. 5) If the answer key has one (or more) \'OROR\'s in it, then the answer will be considered valid if it conforms to any of the possible answer keys. The ONLY format you can use to reply (and don\'t write anything before or after this) is - {"score1":"<your score for answer 1>","feedback1":"<your feedback for answer 1>","score2":"<your score for answer 2>","feedback2":"<your feedback for answer 2>"} The answers you have to grade are: '
    prompt = prompt + questionset
    async function runCompletion () {
        const completion = await openai.createCompletion({
          "model": "text-davinci-003",
          "prompt": prompt,
          "max_tokens": 1000,
          "n": 1,
          "temperature": 0.7
        });
        let answer = JSON.parse(completion.data.choices[0].text)
        res.render('result',{ package:package,scores:answer })
        }
    runCompletion();
});
app.listen(PORT, function() {
    console.log("Server started on port 3030");
});