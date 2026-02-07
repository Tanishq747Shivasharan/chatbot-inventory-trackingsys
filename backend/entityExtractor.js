require("dotenv").config();
const axios = require("axios");

// Language-agnostic product extraction using LLM
async function extractProductLLM(text) {
  // Try RapidAPI first if available
  if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST) {
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
        `https://${process.env.RAPIDAPI_HOST}/chat/completions`,
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0
        },
        {
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": process.env.RAPIDAPI_HOST
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const product = response.data.choices[0].message.content.trim().toLowerCase();
      if (product && product.length > 0) {
        return product;
      }
    } catch (error) {
      console.error("RapidAPI product extraction failed, using fallback:", error.message);
    }
  }

  // Fallback to rule-based extraction
  return fallbackExtractProduct(text);
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

function extractDemandEntitiesFallback(text) {
  const original = text || "";
  const lower = original.toLowerCase();

  const quantityMatch = original.match(/(\d+(?:\.\d+)?)/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : null;

  let supplier = null;
  const supplierPatterns = [
    /(?:from\s+supplier|supplier|vendor|from)\s+([^\d,.;]+)/i,
    /(?:सप्लायर|आपूर्तिकर्ता|से)\s*([^\d,.;]+)/i,
    /(?:पुरवठादार|विक्रेता|कडून)\s*([^\d,.;]+)/i
  ];
  for (const pattern of supplierPatterns) {
    const match = original.match(pattern);
    if (match && match[1]) {
      supplier = match[1].trim();
      break;
    }
  }

  let cleaned = original;
  if (supplier) {
    cleaned = cleaned.replace(supplier, " ");
  }
  cleaned = cleaned.replace(/(\d+(?:\.\d+)?)/g, " ");
  cleaned = cleaned.replace(/\b(order|buy|purchase|send|demand|request|from|supplier|vendor|please)\b/gi, " ");
  cleaned = cleaned.replace(/(मंगवानी|मंगवा|ऑर्डर|ऑर्डर करना|मागवायचे|मागवणे|मागणी|खरेदी|से|कडून|पुरवठादार|विक्रेता)/gi, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  let product = null;
  if (lower.includes(" of ")) {
    const afterOf = original.split(/ of /i)[1];
    if (afterOf) {
      product = afterOf.split(/ from | supplier | vendor /i)[0].trim();
    }
  }

  if (!product && cleaned.length > 0) {
    product = cleaned;
  }

  return {
    product: product && product.length > 0 ? product.trim() : null,
    quantity: Number.isFinite(quantity) ? quantity : null,
    supplier: supplier && supplier.length > 0 ? supplier.trim() : null
  };
}

async function extractDemandEntities(text) {
  if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST) {
    try {
      const prompt = `Extract product name, quantity, and supplier name from the request. Return ONLY a JSON object with keys: product, quantity, supplier.

Examples:
"I want 50 packets of Maggi from supplier Manik" -> {"product":"Maggi","quantity":50,"supplier":"Manik"}
"अमित से 100 चावल मंगवाने हैं" -> {"product":"चावल","quantity":100,"supplier":"अमित"}
"मणिक कडून 50 मॅगी मागवायच्या आहेत" -> {"product":"मॅगी","quantity":50,"supplier":"मणिक"}

Request: "${text}"

JSON:`;

      const response = await axios.post(
        `https://${process.env.RAPIDAPI_HOST}/chat/completions`,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0
        },
        {
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": process.env.RAPIDAPI_HOST
          },
          timeout: 10000
        }
      );

      const raw = response.data.choices[0].message.content.trim();
      let jsonText = raw;
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = raw.slice(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(jsonText);
      return {
        product: parsed.product || null,
        quantity: Number.isFinite(parsed.quantity) ? parsed.quantity : parseInt(parsed.quantity, 10) || null,
        supplier: parsed.supplier || null
      };
    } catch (error) {
      console.error("RapidAPI demand extraction failed, using fallback:", error.message);
    }
  }

  return extractDemandEntitiesFallback(text);
}

module.exports = extractProductLLM;
module.exports.extractDemandEntities = extractDemandEntities;
