# Lumos.ai
Submission for YUVAI-Phase 2 by Pranet Khetan

<h2>LIVE DEMO</h2>
<a href="https://www.bit.ly/lumosai">bit.ly/lumosai</a><br>
This will take at least 30-40 seconds to load since it is using free hosting from a server in Oregon, USA.

<h2>Problem Statement: </h2>
Teachers can often struggle with checking large piles of worksheets that contain long-answer questions or open-ended answers, which is a tedious and time consuming task. This can take away from valuable lesson planning time and lead to inconsistencies in grading; this is when different teachers with different personalities and backgrounds give different marks to the same answer. This problem is exacerbated in large classrooms with a high student:faculty ratio, which can lead to stress for the teachers. The thematic sectors covered by this project include Education, Productivity and Technology. 

<h2>Idea to Solve this:</h2>
There are two parts to this problem: Computer Vision and Natural Language Processing. Computer Vision gets involved in the form of OCR, where we need to take the worksheets submitted by the students and scan them for the answers. Most online OCR algorithms do not work well with bad handwriting, hence I trained a custom one using Nanonets OCR.

Natural Language Processing is used in 2 places here - The first application is to improve the accuracy of OCR. This involves sending the OCR output to an NLP model (in this case, ChatGPT) that can understand the OCR output and tweak it to match real language. The second application is to actually compare and check the student’s answers against the answer key provided by the teacher and assign it a score (out of 3, in this case) along with some feedback. This will lead to consistent grading (since it is the same NLP checking all the answers) and will greatly increase the speed of the process (less than half a minute to check the answers)

<h2>Technology Used</h2>
To properly showcase my Idea, I have used NodeJS (a backend web development framework involving JavaScript), HTML, CSS and Bootstrap (frontend web designing tools). In NodeJS, I have used Express.ejs as the primary server component and EJS for templating and rendering web pages. I have used libraries like Multer to accept file uploads and OpenAI to communicate with the OpenAI API. 

For Optical Character Recognition, I have a custom Nanonets OCR model trained using a Kaggle Handwriting dataset at <a href="https://www.kaggle.com/datasets/tejasreddy/iam-handwriting-top50" >https://www.kaggle.com/datasets/tejasreddy/iam-handwriting-top50</a> of 138 labelled sentences of text. This Computer Vision model can even understand bad handwriting, etc. For Natural Language Processing, I have used the free ChatGPT API to send prompts and receive the answers back. 

<h2>How it works</h2>
Teachers and students are greeted with a homepage that contains the problem statement and the idea of the project. Next, teachers have to click on the ‘Create Worksheet’ option in the navbar to create a new worksheet that contains a Title, two questions and two answer keys, respectively. The worksheet is also immediately assigned an ID, which the teacher can share with their students. After pressing the submit button, a POST request is sent to the server, which will then store the data so that it can be accessed later. The teacher will then get a message ‘Your Worksheet was Created’. 

Students have to click on the ‘Answer Worksheet’ option in the navbar to answer the worksheet. First, they will be asked for the Worksheet ID. This part of the code also has error handling, since if the students write anything random, the website will tell them to try again. If they have entered a valid ID, the server will load a page containing the questions and the option to answer either via OCR or via typing.

Here, the student can go either of two ways: they can type out the answer or they can choose to write it down and submit via OCR. If they choose to submit via OCR, my NodeJS server will send the file to Nanonets. First, it will use the Multer package to parse the file submitted by the user. Next, it will temporarily save this file in a folder on the server. After that, a package called fs (filestream) is used to access the file. This then calls an HTTP Request to the Nanonets Server which sends over the image and the ID of my model. 

Nanonets uses the Computer Vision model trained with my custom dataset to send back the predictions. This is then immediately sent to the OpenAI API’s ChatGPT to correct the OCR output and make it more accurate. In the prompt, ChatGPT has been instructed to reply only in perfect JSON, so that the code can immediately parse the output and display it.

In this case, the combined output of the OCR is rendered into a page where the student can check the OCR output and edit it in case there are any mistakes remaining. When the student clicks ‘Submit Answers’ (the same applies for students who chose to answer without OCR and directly typed the answers), the question, answer and answer key are sent to ChatGPT for correction, along with a custom prompt that is optimised for long, detailed answers. Again, ChatGPT is instructed to reply in perfect JSON. The reply is then parsed and the scores and feedback for the worksheet are displayed to the student. The worksheet has been checked!

The main AI processing happens in app.js from lines 76 through 160, while all the HTML, CSS, Bootstrap and EJS code is in the views folder. 

<h2>Future Prospects</h2>
Since this is a prototype, everything used to make this is free: free hosting, the free OpenAI API and the free tier of the Nanonets OCR Custom-trained model that only lets you process 100 pages before you need to start paying. Future scope for this project could include upgrading from ChatGPT to LLama2, which is an NLP model powerful enough to be well-suited for this task and will provide greater accuracy and better feedback. We can also increase the dataset size for even better OCR. A Major Future Prospect for this idea could be to tackle the checking of CBSE Class 10 Board Papers, which will greatly simplify the logistics of paper checking for CBSE, and also make checking significantly faster. 

<h4>Upgrade to LLama2</h4>
This is still in the works, as I try to integrate the API into the NodeJS application. According to testing, LLama is <b>a lot better</b> than ChatGPT and provides realitic marking and detailed answers. However, it cannot be relied on for correcting OCR text, for which I will still have to use ChatGPT.

<h2>Prompts Used</h2>
<h4>Prompt used for OCR - </h4> 
You will get an input in the form of a paragraph of text, that is the output of an OCR algorithm. Can you use your understanding of language and text to correct it? After correcting it, you will find that the text is divided into two parts - Answer 1 and Answer 2. You need to separate these. The ONLY format you can reply is - {"answer1":"<the text for answer 1>", "answer2":"<the text for answer 2>"} The text is - <br>
(prediction outputted by OCR algorithm goes here)

<h4>Prompt used for checking answers - </h4>
Read this prompt in detail and be prepared to answer all questions: You will be provided with three values: a question, an answer, and an answer key in the format { question1: <question goes here>, answer1: <answer goes here>, answerkey1: <answer key goes here>, question2:<question goes here>, answer2: <answer goes here>, answerkey2: <answer key goes here> }. You have to compare the answer to the answer key and give it a score out of three along with detailed feedback. A few pointers to keep in mind: 1) The answers are long answers and don\'t necessarily have to be word-to-word similar. They can be paraphrased or written in a different way but MUST CONTAIN ALL IMPORTANT KEYWORDS in the answer key, 2) Also compare the amount of DETAIL in the answer. You CANNOT give it a perfect score if it is missing any important detail or keyword. TO REACH A PERFECT SCORE, THE ANSWER MUST CONTAIN ALL KEYWORDS AND PROCESSES. A ONE-LINER WILL ONLY GET 1 MARK, 3) You are allowed to give DECIMAL scores, 4) Be very STRICT with your correction. If the answer is NOT SATISFACTORY, give a 1. The ONLY format you can use to reply is - {"score1":"<your score for answer 1>","feedback1":"<your feedback for answer 1>","score2":"<your score for answer 2>","feedback2":"<your feedback for answer 2>"}. DO NOT FORGET TO APPLY COMMON SENSE The answers you have to grade are: - <br>
(question, answer and answer key go here)
