const normalizeText = require("./normalize");
const detectIntent = require("./intentDetector");
const extractProduct = require("./entityExtractor");
const db = require("./database");
const buildReply = require("./replyBuilder");

module.exports = async function chatbot(req, res) {
  try {
    const message = req.body.message;

    if (!message) {
      return res.json({ reply: "Message is required" });
    }

    const text = normalizeText(message);
    const intent = detectIntent(text);
    const product = extractProduct(text);

    let data = null;

    if (intent === "STOCK_QUERY") {
      data = await db.getStock(product);
    }

    if (intent === "LOW_STOCK") {
      data = await db.getLowStock();
    }

    if (intent === "DEAD_STOCK") {
      data = await db.getDeadStock();
    }

    const reply = buildReply(intent, data, product);
    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({ reply: "Internal server error" });
  }
};
