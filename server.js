const express = require("express");
const cors = require("cors");

const chatbotHandler = require("./chatbot");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chatbot", chatbotHandler);

app.get("/", function(req, res){
    res.send("Chatbot backend server started successsufully.")
});

app.listen(5000, () => {
  console.log("Backend chatbot running on port 5000");
});