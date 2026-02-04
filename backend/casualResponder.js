const axios = require("axios");

// Language-specific base responses that LLM will polish
const getLanguageBaseResponse = (truth, targetLanguage) => {
  const responses = {
    English: {
      STOCK_RESULT: (data) => data.stock === null ? "Product not found in inventory" : `${data.product} has ${data.stock} units in stock`,
      LOW_STOCK: (data) => data.items.length === 0 ? "No low stock items currently" : "Several items are running low on stock",
      DEAD_STOCK: (data) => data.items.length === 0 ? "No dead stock items found" : "Some products haven't sold recently",
      GREETING: () => "Hello! I can help you check inventory and stock levels",
      HELP: () => "I can check stock levels, find low stock items, or identify dead stock products",
      UNKNOWN: () => "I can help with inventory questions like stock levels or product availability",
      UNKNOWN_INTENT: () => "I can help with stock levels, low stock alerts, or dead stock reports",
      NO_DATA: () => "No data available yet, but I can help check current stock levels",
      OPINION: (data) => data.bestProduct ? `Based on sales data, ${data.bestProduct} is currently the top performer` : "No sales data available yet"
    },
    Hindi: {
      STOCK_RESULT: (data) => data.stock === null ? "उत्पाद इन्वेंटरी में नहीं मिला" : `${data.product} का ${data.stock} यूनिट स्टॉक है`,
      LOW_STOCK: (data) => data.items.length === 0 ? "फिलहाल कोई कम स्टॉक वाली वस्तु नहीं" : "कई वस्तुओं का स्टॉक कम हो रहा है",
      DEAD_STOCK: (data) => data.items.length === 0 ? "कोई डेड स्टॉक नहीं मिला" : "कुछ उत्पाद हाल में नहीं बिके हैं",
      GREETING: () => "नमस्ते! मैं इन्वेंटरी और स्टॉक लेवल चेक करने में मदद कर सकता हूं",
      HELP: () => "मैं स्टॉक लेवल चेक कर सकता हूं, कम स्टॉक वाली वस्तुएं ढूंढ सकता हूं, या डेड स्टॉक उत्पाद पहचान सकता हूं",
      UNKNOWN: () => "मैं इन्वेंटरी के सवालों में मदद कर सकता हूं जैसे स्टॉक लेवल या उत्पाद उपलब्धता",
      UNKNOWN_INTENT: () => "मैं स्टॉक लेवल, कम स्टॉक अलर्ट, या डेड स्टॉक रिपोर्ट में मदद कर सकता हूं",
      NO_DATA: () => "अभी तक कोई डेटा उपलब्ध नहीं, लेकिन मैं मौजूदा स्टॉक लेवल चेक करने में मदद कर सकता हूं",
      OPINION: (data) => data.bestProduct ? `सेल्स डेटा के अनुसार, ${data.bestProduct} फिलहाल सबसे अच्छा प्रदर्शन कर रहा है` : "अभी तक सेल्स डेटा उपलब्ध नहीं है"
    },
    Marathi: {
      STOCK_RESULT: (data) => data.stock === null ? "उत्पादन इन्व्हेंटरीमध्ये सापडले नाही" : `${data.product} चा ${data.stock} युनिट स्टॉक आहे`,
      LOW_STOCK: (data) => data.items.length === 0 ? "सध्या कोणत्याही कमी स्टॉक वस्तू नाहीत" : "अनेक वस्तूंचा स्टॉक कमी होत आहे",
      DEAD_STOCK: (data) => data.items.length === 0 ? "कोणता डेड स्टॉक सापडला नाही" : "काही उत्पादने अलीकडे विकली गेली नाहीत",
      GREETING: () => "नमस्कार! मी इन्व्हेंटरी आणि स्टॉक लेव्हल तपासण्यात मदत करू शकतो",
      HELP: () => "मी स्टॉक लेव्हल तपासू शकतो, कमी स्टॉक वस्तू शोधू शकतो, किंवा डेड स्टॉक उत्पादने ओळखू शकतो",
      UNKNOWN: () => "मी इन्व्हेंटरी प्रश्नांमध्ये मदत करू शकतो जसे स्टॉक लेव्हल किंवा उत्पादन उपलब्धता",
      UNKNOWN_INTENT: () => "मी स्टॉक लेव्हल, कमी स्टॉक अलर्ट, किंवा डेड स्टॉक रिपोर्टमध्ये मदत करू शकतो",
      NO_DATA: () => "अजून कोणता डेटा उपलब्ध नाही, पण मी सध्याचे स्टॉक लेव्हल तपासण्यात मदत करू शकतो",
      OPINION: (data) => data.bestProduct ? `सेल्स डेटानुसार, ${data.bestProduct} सध्या सर्वोत्तम कामगिरी करत आहे` : "अजून सेल्स डेटा उपलब्ध नाही"
    },
    Tamil: {
      STOCK_RESULT: (data) => data.stock === null ? "தயாரிப்பு இன்வென்டரியில் கிடைக்கவில்லை" : `${data.product} இல் ${data.stock} யூனிட் ஸ்டாக் உள்ளது`,
      LOW_STOCK: (data) => data.items.length === 0 ? "தற்போது குறைந்த ஸ்டாக் பொருட்கள் எதுவும் இல்லை" : "பல பொருட்களின் ஸ்டாக் குறைந்து வருகிறது",
      DEAD_STOCK: (data) => data.items.length === 0 ? "டெட் ஸ்டாக் எதுவும் கிடைக்கவில்லை" : "சில தயாரிப்புகள் சமீபத்தில் விற்கப்படவில்லை",
      GREETING: () => "வணக்கம்! இன்வென்டரி மற்றும் ஸ்டாக் லெவல் சரிபார்க்க நான் உதவ முடியும்",
      HELP: () => "நான் ஸ்டாக் லெவல் சரிபார்க்க, குறைந்த ஸ்டாக் பொருட்களைக் கண்டறிய, அல்லது டெட் ஸ்டாக் தயாரிப்புகளை அடையாளம் காண முடியும்",
      UNKNOWN: () => "ஸ்டாக் லெவல் அல்லது தயாரிப்பு கிடைக்கும் தன்மை போன்ற இன்வென்டரி கேள்விகளில் நான் உதவ முடியும்",
      UNKNOWN_INTENT: () => "நான் ஸ்டாக் லெவல், குறைந்த ஸ்டாக் அலர்ட், அல்லது டெட் ஸ்டாக் ரிப்போர்ட்டில் உதவ முடியும்",
      NO_DATA: () => "இன்னும் தரவு கிடைக்கவில்லை, ஆனால் தற்போதைய ஸ்டாக் லெவல் சரிபார்க்க நான் உதவ முடியும்",
      OPINION: (data) => data.bestProduct ? `விற்பனை தரவின் அடிப்படையில், ${data.bestProduct} தற்போது சிறந்த செயல்திறனைக் காட்டுகிறது` : "இன்னும் விற்பனை தரவு கிடைக்கவில்லை"
    },
    Telugu: {
      STOCK_RESULT: (data) => data.stock === null ? "ఉత్పత్తి ఇన్వెంటరీలో కనుగొనబడలేదు" : `${data.product} లో ${data.stock} యూనిట్ స్టాక్ ఉంది`,
      LOW_STOCK: (data) => data.items.length === 0 ? "ప్రస్తుతం తక్కువ స్టాక్ వస్తువులు లేవు" : "అనేక వస్తువుల స్టాక్ తక్కువగా ఉంది",
      DEAD_STOCK: (data) => data.items.length === 0 ? "డెడ్ స్టాక్ ఏదీ కనుగొనబడలేదు" : "కొన్ని ఉత్పత్తులు ఇటీవల అమ్మకం కాలేదు",
      GREETING: () => "నమస్కారం! ఇన్వెంటరీ మరియు స్టాక్ లెవల్ తనిఖీ చేయడంలో నేను సహాయం చేయగలను",
      HELP: () => "నేను స్టాక్ లెవల్ తనిఖీ చేయగలను, తక్కువ స్టాక్ వస్తువులను కనుగొనగలను, లేదా డెడ్ స్టాక్ ఉత్పత్తులను గుర్తించగలను",
      UNKNOWN: () => "స్టాక్ లెవల్ లేదా ఉత్పత్తి లభ్యత వంటి ఇన్వెంటరీ ప్రశ్నలలో నేను సహాయం చేయగలను",
      UNKNOWN_INTENT: () => "నేను స్టాక్ లెవల్, తక్కువ స్టాక్ అలర్ట్, లేదా డెడ్ స్టాక్ రిపోర్ట్లో సహాయం చేయగలను",
      NO_DATA: () => "ఇంకా డేటా అందుబాటులో లేదు, కానీ ప్రస్తుత స్టాక్ లెవల్ తనిఖీ చేయడంలో నేను సహాయం చేయగలను",
      OPINION: (data) => data.bestProduct ? `అమ్మకాల డేటా ఆధారంగా, ${data.bestProduct} ప్రస్తుతం అత్యుత్తమ పనితీరును చూపిస్తోంది` : "ఇంకా అమ్మకాల డేటా అందుబాటులో లేదు"
    }
  };

  const langResponses = responses[targetLanguage] || responses.English;
  const responseFunc = langResponses[truth.type];
  
  if (responseFunc) {
    return responseFunc(truth);
  }
  
  return langResponses.UNKNOWN();
};

async function casualReply(truth, userLanguage = "en-US") {
  try {
    // Map language codes to language names for better LLM understanding
    const languageMap = {
      "en-US": "English",
      "hi-IN": "Hindi", 
      "mr-IN": "Marathi",
      "ta-IN": "Tamil",
      "te-IN": "Telugu"
    };
    
    const targetLanguage = languageMap[userLanguage] || "English";
    
    // Get language-appropriate base response
    const baseResponse = getLanguageBaseResponse(truth, targetLanguage);
    
    const prompt = `You are an inventory management assistant. Make this response sound natural and conversational while keeping the exact same meaning and language.

CRITICAL RULES:
- NEVER change the language from ${targetLanguage}
- NEVER add phrases like "Based on the available information" or "I can provide details"
- NEVER add policy disclaimers or robotic language
- Keep the response short (1-2 sentences maximum)
- Make it sound natural and friendly but professional
- Do NOT add cooking advice, usage suggestions, or lifestyle tips
- ONLY rephrase the inventory information provided
- Do NOT invent or add any data not in the original

Base response to rephrase: "${baseResponse}"

Natural response in ${targetLanguage}:`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "mistral",
        prompt,
        stream: false
      }
    );

    const result = response.data.response.trim();
    
    // Fallback to base response if LLM fails or returns empty
    return result || baseResponse;

  } catch (error) {
    console.error("Casual responder failed:", error.message);
    
    // Return language-appropriate fallback
    const languageMap = {
      "en-US": "English",
      "hi-IN": "Hindi",
      "mr-IN": "Marathi", 
      "ta-IN": "Tamil",
      "te-IN": "Telugu"
    };
    
    const targetLanguage = languageMap[userLanguage] || "English";
    return getLanguageBaseResponse(truth, targetLanguage);
  }
}

module.exports = casualReply;