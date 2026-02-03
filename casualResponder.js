const axios = require("axios");

async function casualReply(truth) {
  try {
    const prompt = `
You are a friendly AI inventory assistant.

Rules:
- Sound casual and helpful (like ChatGPT or Claude)
- Do NOT invent facts
- ONLY use the data provided below
- If data is missing, say so politely

Data:
${JSON.stringify(truth)}

Reply naturally in 1–2 sentences.
`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt,
        stream: false
      }
    );

    return response.data.response.trim();

  } catch (error) {
    console.error("Casual responder failed:", error.message);
    return null; // fail-safe
  }
}

module.exports = casualReply;