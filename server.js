const express = require('express');
const cors = require('cors');

// const chatbotHandler = require("./chatbot");

const app = express();

app.use(cors());
app.use(express.json());

// app.post("/chatbot",chatbotHandler);

app.get("/", function(req,res){
    res.send("Hello World");
});

app.listen(3000, function(){
    console.log("backend server running on port 3000");
});