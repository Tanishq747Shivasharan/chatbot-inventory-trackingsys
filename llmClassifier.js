const axios = require("axios");

async function classifyQuery(text) {
  try {
    const prompt = `
You are a strict classifier.

Classify the user query into EXACTLY ONE category:
FACTUAL
OPINION
GREETING
HELP
UNKNOWN

Rules:
- Respond with ONLY the category name
- No explanation
- No extra words

User query:
"${text}"
`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt: prompt,
        stream: false
      }
    );

    const raw = response.data.response;

    const category = raw
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .trim();

    const allowed = [
      "FACTUAL",
      "OPINION",
      "GREETING",
      "HELP",
      "UNKNOWN"
    ];

    if (!allowed.includes(category)) {
      return "UNKNOWN";
    }

    return category;

  } catch (error) {
    console.error("Local LLM classification failed:", error.message);
    return "UNKNOWN";
  }
}

module.exports = classifyQuery;
