const normalizeText = require("./normalize");
const detectIntent = require("./intentDetector");
const extractProduct = require("./entityExtractor");
const db = require("./database");
const buildReply = require("./replyBuilder");
const classifyQuery = require("./llmClassifier");
const casualReply = require("./casualResponder");

module.exports = async function chatbot(req, res) {
  try {
    const message = req.body.message;

    if (!message) {
      return res.json({ reply: "Message is required" });
    }

    const text = normalizeText(message);
    const category = await classifyQuery(text);
    console.log("LLM category:", category);

    let reply;
    let data;

    // 1. FACTUAL QUERIES (numbers, stock, inventory)
    if (category === "FACTUAL") {

      const intent = detectIntent(text);   
      const product = extractProduct(text);

      if (intent === "STOCK_QUERY") {
        data = await db.getStock(product);
        
        const truth = {
          type: "STOCK_RESULT",
          product,
          stock: data
        };

        reply =
          (await casualReply(truth)) ||
          buildReply("STOCK_QUERY", data, product);
      }

      else if (intent === "LOW_STOCK") {
        data = await db.getLowStock();
        
        const truth = {
          type: "LOW_STOCK",
          items: data
        };

        reply =
          (await casualReply(truth)) ||
          buildReply("LOW_STOCK", data);
      }

      else if (intent === "DEAD_STOCK") {
        data = await db.getDeadStock();
        
        const truth = {
          type: "DEAD_STOCK",
          items: data
        };

        reply =
          (await casualReply(truth)) ||
          buildReply("DEAD_STOCK", data);
      }

      else {
        reply = "I can help with stock levels, low stock, or dead stock items.";
      }
    }

    // 2. OPINION-STYLE QUESTIONS
    else if (category === "OPINION") {
      const topProduct = await db.getTopSellingProduct();

      if (!topProduct) {
        reply = "I don't have enough data yet, but I can help you check stock or sales.";
      } 
      else {
        const truth = {
          type: "OPINION",
          bestProduct: topProduct.name,
          reason: "highest sales"
        };
        reply =
          (await casualReply(truth)) ||
          `I don't have personal preferences, but based on your sales data, ${topProduct.name} is currently performing the best.`;
      }
    }

    // 3. GREETINGS
    else if (category === "GREETING") {
      const truth = { type: "GREETING" };

      reply =
        (await casualReply(truth)) ||
        "Hey! 👋 I'm here to help you manage your inventory. What would you like to check?";
    }

    // 4. HELP
    else if (category === "HELP") {
      reply = "You can ask things like: stock of rice, low stock items, or dead stock products.";
    }

    // 5. UNKNOWN
    else {
      reply = "I'm not fully sure about that, but I can help you with inventory or stock-related questions.";
    }

    // Final response
    res.json({ reply });
  }
   catch (error) {
    console.error("Chatbot error:", error);
    res.json({ reply: "Internal server error" });
  }
};