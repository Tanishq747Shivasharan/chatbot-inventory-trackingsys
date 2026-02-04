const axios = require("axios");

async function classifyQuery(text) {
  try {
    const prompt = `You are an inventory management intent classifier. Classify the user query into EXACTLY ONE intent:

STOCK_QUERY - User asks about stock/inventory of a specific product
LOW_STOCK - User asks about items with low stock/inventory
DEAD_STOCK - User asks about unsold/dead stock items
OPINION - User asks for recommendations or opinions
GREETING - User greets or says hello
HELP - User asks for help or what they can do
UNKNOWN - Anything else

Examples:
"चावल का स्टॉक कितना है?" → STOCK_QUERY
"तांदळाचा साठा किती आहे?" → STOCK_QUERY
"How much rice is left?" → STOCK_QUERY
"rice stock" → STOCK_QUERY
"कम स्टॉक वाली चीजें" → LOW_STOCK
"low stock items" → LOW_STOCK
"कमी स्टॉक वस्तू" → LOW_STOCK
"dead stock products" → DEAD_STOCK
"नहीं बिकने वाले उत्पाद" → DEAD_STOCK
"which product is best" → OPINION
"hello" → GREETING
"नमस्ते" → GREETING
"help me" → HELP
"मदद करो" → HELP

Rules:
- Understand ANY language (English, Hindi, Marathi, Tamil, Telugu)
- Focus on MEANING, not keywords
- Respond with ONLY the intent name
- No explanation or extra text

User query: "${text}"

Intent:`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt: prompt,
        stream: false
      }
    );

    const raw = response.data.response.trim().toUpperCase();
    
    const allowed = [
      "STOCK_QUERY",
      "LOW_STOCK", 
      "DEAD_STOCK",
      "OPINION",
      "GREETING",
      "HELP",
      "UNKNOWN"
    ];

    // Extract the intent from response
    for (const intent of allowed) {
      if (raw.includes(intent)) {
        return intent;
      }
    }

    return "UNKNOWN";

  } catch (error) {
    console.error("Local LLM classification failed:", error.message);
    return "UNKNOWN";
  }
}

module.exports = classifyQuery;