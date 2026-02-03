const axios = require("axios");

async function casualReply(truth) {
    const prompt = `
You are a friendly AI inventory assistant.

Rules:
- Be casual and natural (like ChatGPT or Claude)
- Do NOT invent data
- ONLY use the information provided
- Do NOT add opinions unless explicitly allowed

Data:
${JSON.stringify(truth)}

Respond naturally to the user.
`;

    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You rephrase facts casually." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,   
            max_tokens: 80
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    return response.data.choices[0].message.content.trim();
}

module.exports = casualReply;
