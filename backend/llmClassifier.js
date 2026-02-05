require("dotenv").config();
const axios = require("axios");

async function classifyQuery(text) {
  console.log("Classifying text:", text);
  
  try {
    const prompt = `You are an inventory management intent classifier. Classify the user query into EXACTLY ONE intent:

      STOCK_QUERY - User asks about stock/inventory of a specific product
      LOW_STOCK - User asks about items with low stock/inventory
      DEAD_STOCK - User asks about unsold/dead stock items
      PRODUCT_DETAILS - User asks for detailed information about a product (price, description, etc.)
      CATEGORY_PRODUCTS - User asks about products in a specific category
      SUPPLIER_PRODUCTS - User asks about products from a specific supplier
      EXPIRING_PRODUCTS - User asks about products that are expiring soon
      OVERSTOCKED_PRODUCTS - User asks about products with too much stock
      PRODUCT_PRICING - User asks about product prices or profit margins
      INVENTORY_SUMMARY - User asks for overall inventory summary or statistics
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
      "tell me about rice product" → PRODUCT_DETAILS
      "rice product details" → PRODUCT_DETAILS
      "show me all dairy products" → CATEGORY_PRODUCTS
      "products from ABC supplier" → SUPPLIER_PRODUCTS
      "which products are expiring" → EXPIRING_PRODUCTS
      "expiring items" → EXPIRING_PRODUCTS
      "overstocked products" → OVERSTOCKED_PRODUCTS
      "too much stock" → OVERSTOCKED_PRODUCTS
      "rice price" → PRODUCT_PRICING
      "profit margin of rice" → PRODUCT_PRICING
      "inventory summary" → INVENTORY_SUMMARY
      "total stock value" → INVENTORY_SUMMARY
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

    // Try RapidAPI first
    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST) {
      try {
        console.log("Attempting RapidAPI classification...");
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
            timeout: 5000 // 5 second timeout
          }
        );

        const raw = response.data.choices[0].message.content.trim().toUpperCase();
        
        const allowed = [
          "STOCK_QUERY", "LOW_STOCK", "DEAD_STOCK", "PRODUCT_DETAILS",
          "CATEGORY_PRODUCTS", "SUPPLIER_PRODUCTS", "EXPIRING_PRODUCTS",
          "OVERSTOCKED_PRODUCTS", "PRODUCT_PRICING", "INVENTORY_SUMMARY",
          "OPINION", "GREETING", "HELP", "UNKNOWN"
        ];

        // Extract the intent from response
        for (const intent of allowed) {
          if (raw.includes(intent)) {
            console.log("RapidAPI classification successful:", intent);
            return intent;
          }
        }
      } catch (apiError) {
        console.log("RapidAPI failed, falling back to rule-based classification:", apiError.message);
      }
    } else {
      console.log("RapidAPI credentials not found, using rule-based classification");
    }

    // Fallback to rule-based classification
    console.log("Using fallback classification for:", text);
    const fallbackResult = fallbackClassification(text);
    console.log("Fallback classification result:", fallbackResult);
    return fallbackResult;

  } catch (error) {
    console.error("LLM classification failed:", error.message);
    console.log("Using fallback classification due to error");
    return fallbackClassification(text);
  }
}

// Rule-based fallback classification
function fallbackClassification(text) {
  const lowerText = text.toLowerCase();
  
  // Greeting patterns (check first)
  if (lowerText.match(/\b(hello|hi|hey|नमस्ते|नमस्कार|வணக்கம்|నమస్కారం)\b/)) {
    return "GREETING";
  }
  
  // Help patterns (check early)
  if (lowerText.match(/\b(help|मदद|सहायता|உதவி|సహాయం)\b/)) {
    return "HELP";
  }
  
  // Low stock patterns (check before general stock)
  if (lowerText.match(/\b(low stock|कम स्टॉक|कमी स्टॉक|குறைந்த ஸ்டாக்|తక్కువ స్టాక్)\b/)) {
    return "LOW_STOCK";
  }
  
  // Dead stock patterns (check before general stock)
  if (lowerText.match(/\b(dead stock|डेड स्टॉक|मृत स्टॉक|டெட் ஸ்டாக்|డెడ్ స్టాక్|unsold|नहीं बिका|विकला नाही|விற்கப்படாத|అమ్మకం కాని)\b/)) {
    return "DEAD_STOCK";
  }
  
  // Expiring patterns (check before general stock)
  if (lowerText.match(/\b(expir|expire|expiry|एक्सपायर|कालबाह्य|मुदत|காலாவதி|గడువు|కాలం చెల్లిన)\b/)) {
    return "EXPIRING_PRODUCTS";
  }
  
  // Overstocked patterns (check before general stock)
  if (lowerText.match(/\b(overstock|too much|excess|अधिक स्टॉक|जास्त स्टॉक|अतिरिक्त|அதிக ஸ்டாக்|అధిక స్టాక్|అదనపు)\b/)) {
    return "OVERSTOCKED_PRODUCTS";
  }
  
  // Summary patterns (check before general queries)
  if (lowerText.match(/\b(summary|total|overall|report|सारांश|कुल|एकूण|रिपोर्ट|சுருக்கம்|மொத்தம்|మొత్తం|నివేదిక)\b/)) {
    return "INVENTORY_SUMMARY";
  }
  
  // Pricing patterns
  if (lowerText.match(/\b(price|pricing|profit|cost|margin|कीमत|मूल्य|लाभ|किंमत|விலை|లాభం|ధర)\b/)) {
    return "PRODUCT_PRICING";
  }
  
  // Product details patterns
  if (lowerText.match(/\b(details|about|tell me|information|info|विवरण|बारे में|विषयी|பற்றி|గురించి|जानकारी)\b/) && 
      lowerText.match(/\b(product|उत्पाद|वस्तु|தயாரிப்பு|ఉత్పత్తి)\b/)) {
    return "PRODUCT_DETAILS";
  }
  
  // Category patterns
  if (lowerText.match(/\b(category|categories|श्रेणी|वर्ग|प्रकार|பிரிவு|வகை|వర్గం|రకం)\b/)) {
    return "CATEGORY_PRODUCTS";
  }
  
  // Supplier patterns
  if (lowerText.match(/\b(supplier|vendor|आपूर्तिकर्ता|पुरवठादार|विक्रेता|சப்ளையர்|விற்பனையாளர்|సప్లయర్|విక్రేత)\b/)) {
    return "SUPPLIER_PRODUCTS";
  }
  
  // Opinion patterns
  if (lowerText.match(/\b(best|recommend|suggest|opinion|सबसे अच्छा|सुझाव|राय|सर्वोत्तम|शिफारस|சிறந்த|பரிந்துரை|ఉత్తమ|సిఫార్సు)\b/)) {
    return "OPINION";
  }
  
  // Stock query patterns (check last, as it's most general)
  if (lowerText.match(/\b(stock|स्टॉक|साठा|ஸ்டாக்|స్టాక్|inventory|इन्वेंटरी|how much|कितना|किती|எவ்வளவு|ఎంత)\b/)) {
    return "STOCK_QUERY";
  }
  
  return "UNKNOWN";
}

module.exports = classifyQuery;