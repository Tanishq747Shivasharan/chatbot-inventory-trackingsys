const axios = require("axios");

// Language-agnostic product extraction using LLM
async function extractProductLLM(text) {
  try {
    const prompt = `Extract the product name from this inventory query. Return ONLY the product name, nothing else.

Examples:
"चावल का स्टॉक कितना है?" → rice
"तांदळाचा साठा किती आहे?" → rice  
"How much wheat is left?" → wheat
"sugar stock" → sugar
"दाल कितनी है?" → dal

Query: "${text}"

Product:`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt: prompt,
        stream: false
      }
    );

    const product = response.data.response.trim().toLowerCase();
    return product || null;

  } catch (error) {
    console.error("LLM product extraction failed:", error.message);
    return fallbackExtractProduct(text);
  }
}

// Fallback extraction for when LLM fails
function fallbackExtractProduct(text) {
  const lowerText = text.toLowerCase();
  
  // English patterns
  if (lowerText.includes("stock of")) {
    return lowerText.split("stock of")[1].trim().split(" ")[0];
  }
  if (lowerText.includes("how much")) {
    const after = lowerText.split("how much")[1].trim();
    return after.split(" ")[0];
  }
  
  // Common products in multiple languages
  const products = {
    'चावल': 'rice', 'rice': 'rice',
    'तांदळ': 'rice', 'तांदळा': 'rice',
    'गेहूं': 'wheat', 'wheat': 'wheat',
    'दाल': 'dal', 'dal': 'dal',
    'चीनी': 'sugar', 'sugar': 'sugar',
    'तेल': 'oil', 'oil': 'oil'
  };
  
  for (const [key, value] of Object.entries(products)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }
  
  return null;
}

module.exports = extractProductLLM;
