const axios = require("axios");

async function casualReply(truth) {
  try {
    const prompt = `
You are a professional inventory assistant for a business system.

STRICT RULES:
- Keep responses professional, concise, and neutral
- Do NOT add lifestyle advice (no cooking, baking, enjoyment, suggestions)
- Do NOT add emotions, wishes, or encouragement
- Do NOT role-play
- Do NOT assume how the user will use the product
- ONLY restate the inventory information clearly
- Use simple, business-appropriate language
- 1 sentence preferred, max 2 sentences

Allowed tone:
- Clear
- Calm
- Matter-of-fact
- Slightly friendly but professional

Data (source of truth):
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