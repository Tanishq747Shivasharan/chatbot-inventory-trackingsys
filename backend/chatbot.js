const normalizeText = require("./normalize");
const extractProduct = require("./entityExtractor");
const db = require("./database");
const classifyQuery = require("./llmClassifier");
const casualReply = require("./casualResponder");

// Language-aware fallback responses
const getLanguageFallback = (type, lang, data = null, product = null) => {
  const fallbacks = {
    "en-US": {
      STOCK_RESULT: (product, stock) => stock === null ? "Product not found in inventory." : `${product} has ${stock} units available.`,
      LOW_STOCK: (items) => items.length === 0 ? "No low stock items found." : "Some items are running low in stock.",
      DEAD_STOCK: (items) => items.length === 0 ? "No dead stock found." : "Some products have not sold recently.",
      GREETING: () => "Hello! I can help you check inventory and stock levels.",
      HELP: () => "You can ask about stock levels, low stock items, or dead stock products.",
      UNKNOWN: () => "I can help with inventory questions like stock levels or product availability.",
      OPINION: (topProduct) => topProduct ? `Based on sales data, ${topProduct} is currently performing the best.` : "I don't have enough data yet, but I can help you check stock or sales.",
      ERROR: () => "Sorry, I couldn't process that request."
    },
    "hi-IN": {
      STOCK_RESULT: (product, stock) => stock === null ? "उत्पाद इन्वेंटरी में नहीं मिला।" : `${product} का ${stock} यूनिट उपलब्ध है।`,
      LOW_STOCK: (items) => items.length === 0 ? "कम स्टॉक वाली कोई वस्तु नहीं मिली।" : "कुछ वस्तुओं का स्टॉक कम हो रहा है।",
      DEAD_STOCK: (items) => items.length === 0 ? "कोई डेड स्टॉक नहीं मिला।" : "कुछ उत्पाद हाल ही में नहीं बिके हैं।",
      GREETING: () => "नमस्ते! मैं इन्वेंटरी और स्टॉक लेवल चेक करने में मदद कर सकता हूं।",
      HELP: () => "आप स्टॉक लेवल, कम स्टॉक वाली वस्तुएं, या डेड स्टॉक उत्पादों के बारे में पूछ सकते हैं।",
      UNKNOWN: () => "मैं इन्वेंटरी के सवालों में मदद कर सकता हूं जैसे स्टॉक लेवल या उत्पाद उपलब्धता।",
      OPINION: (topProduct) => topProduct ? `सेल्स डेटा के अनुसार, ${topProduct} फिलहाल सबसे अच्छा प्रदर्शन कर रहा है।` : "अभी तक पर्याप्त डेटा नहीं है, लेकिन मैं स्टॉक या सेल्स चेक करने में मदद कर सकता हूं।",
      ERROR: () => "माफ करें, मैं उस अनुरोध को प्रोसेस नहीं कर पाया।"
    },
    "mr-IN": {
      STOCK_RESULT: (product, stock) => stock === null ? "उत्पादन इन्व्हेंटरीमध्ये सापडले नाही।" : `${product} चे ${stock} युनिट उपलब्ध आहेत।`,
      LOW_STOCK: (items) => items.length === 0 ? "कमी स्टॉक वस्तू सापडल्या नाहीत।" : "काही वस्तूंचा स्टॉक कमी होत आहे।",
      DEAD_STOCK: (items) => items.length === 0 ? "डेड स्टॉक सापडला नाही।" : "काही उत्पादने अलीकडे विकली गेली नाहीत।",
      GREETING: () => "नमस्कार! मी इन्व्हेंटरी आणि स्टॉक लेव्हल तपासण्यात मदत करू शकतो।",
      HELP: () => "तुम्ही स्टॉक लेव्हल, कमी स्टॉक वस्तू, किंवा डेड स्टॉक उत्पादनांबद्दल विचारू शकता।",
      UNKNOWN: () => "मी इन्व्हेंटरी प्रश्नांमध्ये मदत करू शकतो जसे स्टॉक लेव्हल किंवा उत्पादन उपलब्धता।",
      OPINION: (topProduct) => topProduct ? `सेल्स डेटानुसार, ${topProduct} सध्या सर्वोत्तम कामगिरी करत आहे।` : "अजून पुरेसा डेटा नाही, पण मी स्टॉक किंवा सेल्स तपासण्यात मदत करू शकतो।",
      ERROR: () => "माफ करा, मी ती विनंती प्रोसेस करू शकलो नाही।"
    },
    "ta-IN": {
      STOCK_RESULT: (product, stock) => stock === null ? "தயாரிப்பு இன்வென்டரியில் கிடைக்கவில்லை।" : `${product} இல் ${stock} யூனிட் கிடைக்கிறது।`,
      LOW_STOCK: (items) => items.length === 0 ? "குறைந்த ஸ்டாக் பொருட்கள் எதுவும் கிடைக்கவில்லை।" : "சில பொருட்களின் ஸ்டாக் குறைந்து வருகிறது।",
      DEAD_STOCK: (items) => items.length === 0 ? "டெட் ஸ்டாக் எதுவும் கிடைக்கவில்லை।" : "சில தயாரிப்புகள் சமீபத்தில் விற்கப்படவில்லை।",
      GREETING: () => "வணக்கம்! இன்வென்டரி மற்றும் ஸ்டாக் லெவல் சரிபார்க்க நான் உதவ முடியும்।",
      HELP: () => "நீங்கள் ஸ்டாக் லெவல், குறைந்த ஸ்டாக் பொருட்கள், அல்லது டெட் ஸ்டாக் தயாரிப்புகளைப் பற்றி கேட்கலாம்।",
      UNKNOWN: () => "ஸ்டாக் லெவல் அல்லது தயாரிப்பு கிடைக்கும் தன்மை போன்ற இன்வென்டரி கேள்விகளில் நான் உதவ முடியும்।",
      OPINION: (topProduct) => topProduct ? `விற்பனை தரவின் அடிப்படையில், ${topProduct} தற்போது சிறந்த செயல்திறனைக் காட்டுகிறது।` : "இன்னும் போதுமான தரவு இல்லை, ஆனால் ஸ்டாக் அல்லது விற்பனை சரிபார்க்க நான் உதவ முடியும்।",
      ERROR: () => "மன்னிக்கவும், அந்த கோரிக்கையை என்னால் செயல்படுத்த முடியவில்லை।"
    },
    "te-IN": {
      STOCK_RESULT: (product, stock) => stock === null ? "ఉత్పత్తి ఇన్వెంటరీలో కనుగొనబడలేదు।" : `${product} లో ${stock} యూనిట్ అందుబాటులో ఉంది।`,
      LOW_STOCK: (items) => items.length === 0 ? "తక్కువ స్టాక్ వస్తువులు కనుగొనబడలేదు।" : "కొన్ని వస్తువుల స్టాక్ తక్కువగా ఉంది।",
      DEAD_STOCK: (items) => items.length === 0 ? "డెడ్ స్టాక్ ఏదీ కనుగొనబడలేదు।" : "కొన్ని ఉత్పత్తులు ఇటీవల అమ్మకం కాలేదు।",
      GREETING: () => "నమస్కారం! ఇన్వెంటరీ మరియు స్టాక్ లెవల్ తనిఖీ చేయడంలో నేను సహాయం చేయగలను।",
      HELP: () => "మీరు స్టాక్ లెవల్, తక్కువ స్టాక్ వస్తువులు, లేదా డెడ్ స్టాక్ ఉత్పత్తుల గురించి అడగవచ్చు।",
      UNKNOWN: () => "స్టాక్ లెవల్ లేదా ఉత్పత్తి లభ్యత వంటి ఇన్వెంటరీ ప్రశ్నలలో నేను సహాయం చేయగలను।",
      OPINION: (topProduct) => topProduct ? `అమ్మకాల డేటా ఆధారంగా, ${topProduct} ప్రస్తుతం అత్యుత్తమ పనితీరును చూపిస్తోంది।` : "ఇంకా తగినంత డేటా లేదు, కానీ స్టాక్ లేదా అమ్మకాలను తనిఖీ చేయడంలో నేను సహాయం చేయగలను।",
      ERROR: () => "క్షమించండి, ఆ అభ్యర్థనను నేను ప్రాసెస్ చేయలేకపోయాను।"
    }
  };

  const langFallbacks = fallbacks[lang] || fallbacks["en-US"];
  const fallbackFunc = langFallbacks[type];
  
  if (fallbackFunc) {
    if (type === "STOCK_RESULT") return fallbackFunc(product, data);
    if (type === "LOW_STOCK" || type === "DEAD_STOCK") return fallbackFunc(data);
    if (type === "OPINION") return fallbackFunc(data?.name);
    return fallbackFunc();
  }
  
  return langFallbacks.ERROR();
};

module.exports = async function chatbot(req, res) {
  try {
    const message = req.body.message;
    const lang = req.body.lang || "en-US";

    if (!message) {
      return res.json({ reply: getLanguageFallback("ERROR", lang) });
    }

    const text = normalizeText(message);
    const intent = await classifyQuery(text);
    console.log("LLM intent:", intent);

    let reply;
    let data;

    // Route based on LLM-classified intent
    if (intent === "STOCK_QUERY") {
      const product = await extractProduct(text);
      data = await db.getStock(product);
      
      const truth = {
        type: "STOCK_RESULT",
        product,
        stock: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("STOCK_RESULT", lang, data, product);
      }
    }

    else if (intent === "LOW_STOCK") {
      data = await db.getLowStock();
      
      const truth = {
        type: "LOW_STOCK",
        items: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("LOW_STOCK", lang, data);
      }
    }

    else if (intent === "DEAD_STOCK") {
      data = await db.getDeadStock();
      
      const truth = {
        type: "DEAD_STOCK",
        items: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("DEAD_STOCK", lang, data);
      }
    }

    else if (intent === "OPINION") {
      const topProduct = await db.getTopSellingProduct();

      const truth = {
        type: "OPINION",
        bestProduct: topProduct?.name,
        reason: "highest sales"
      };
      
      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("OPINION", lang, topProduct);
      }
    }

    else if (intent === "GREETING") {
      const truth = { type: "GREETING" };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("GREETING", lang);
      }
    }

    else if (intent === "HELP") {
      const truth = { 
        type: "HELP",
        message: "You can ask things like: stock of rice, low stock items, or dead stock products."
      };
      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("HELP", lang);
      }
    }

    else {
      const truth = {
        type: "UNKNOWN",
        message: "I'm not fully sure about that, but I can help you with inventory or stock-related questions."
      };
      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("UNKNOWN", lang);
      }
    }

    res.json({ reply });
  }
   catch (error) {
    console.error("Chatbot error:", error);
    res.json({ reply: getLanguageFallback("ERROR", lang) });
  }
};