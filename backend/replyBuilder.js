// Simple translation map for fallback responses
const translations = {
  "en-US": {
    "Invalid product name.": "Invalid product name.",
    "units available": "units available",
    "No low stock items found.": "No low stock items found.",
    "Some items are running low in stock.": "Some items are running low in stock.",
    "No dead stock found.": "No dead stock found.",
    "Some products have not sold recently.": "Some products have not sold recently.",
    "Try: stock of rice, low stock items, dead stock products.": "Try: stock of rice, low stock items, dead stock products.",
    "Sorry, I didn't understand your request.": "Sorry, I didn't understand your request."
  },
  "hi-IN": {
    "Invalid product name.": "अमान्य उत्पाद नाम।",
    "units available": "इकाइयां उपलब्ध",
    "No low stock items found.": "कम स्टॉक वाली कोई वस्तु नहीं मिली।",
    "Some items are running low in stock.": "कुछ वस्तुओं का स्टॉक कम हो रहा है।",
    "No dead stock found.": "कोई डेड स्टॉक नहीं मिला।",
    "Some products have not sold recently.": "कुछ उत्पाद हाल ही में नहीं बिके हैं।",
    "Try: stock of rice, low stock items, dead stock products.": "कोशिश करें: चावल का स्टॉक, कम स्टॉक वाली वस्तुएं, डेड स्टॉक उत्पाद।",
    "Sorry, I didn't understand your request.": "माफ करें, मैं आपका अनुरोध समझ नहीं पाया।"
  },
  "mr-IN": {
    "Invalid product name.": "अवैध उत्पादन नाव।",
    "units available": "युनिट उपलब्ध",
    "No low stock items found.": "कमी स्टॉक वस्तू सापडल्या नाहीत।",
    "Some items are running low in stock.": "काही वस्तूंचा स्टॉक कमी होत आहे।",
    "No dead stock found.": "डेड स्टॉक सापडला नाही।",
    "Some products have not sold recently.": "काही उत्पादने अलीकडे विकली गेली नाहीत।",
    "Try: stock of rice, low stock items, dead stock products.": "प्रयत्न करा: तांदळाचा स्टॉक, कमी स्टॉक वस्तू, डेड स्टॉक उत्पादने।",
    "Sorry, I didn't understand your request.": "माफ करा, मला तुमची विनंती समजली नाही।"
  },
  "ta-IN": {
    "Invalid product name.": "தவறான தயாரிப்பு பெயர்।",
    "units available": "அலகுகள் கிடைக்கின்றன",
    "No low stock items found.": "குறைந்த இருப்பு பொருட்கள் எதுவும் கிடைக்கவில்லை।",
    "Some items are running low in stock.": "சில பொருட்களின் இருப்பு குறைந்து வருகிறது।",
    "No dead stock found.": "டெட் ஸ்டாக் எதுவும் கிடைக்கவில்லை।",
    "Some products have not sold recently.": "சில தயாரிப்புகள் சமீபத்தில் விற்கப்படவில்லை।",
    "Try: stock of rice, low stock items, dead stock products.": "முயற்சி செய்யுங்கள்: அரிசி இருப்பு, குறைந்த இருப்பு பொருட்கள், டெட் ஸ்டாக் தயாரிப்புகள்।",
    "Sorry, I didn't understand your request.": "மன்னிக்கவும், உங்கள் கோரிக்கையை என்னால் புரிந்து கொள்ள முடியவில்லை।"
  },
  "te-IN": {
    "Invalid product name.": "చెల్లని ఉత్పత్తి పేరు।",
    "units available": "యూనిట్లు అందుబాటులో ఉన్నాయి",
    "No low stock items found.": "తక్కువ స్టాక్ వస్తువులు కనుగొనబడలేదు।",
    "Some items are running low in stock.": "కొన్ని వస్తువుల స్టాక్ తక్కువగా ఉంది।",
    "No dead stock found.": "డెడ్ స్టాక్ కనుగొనబడలేదు।",
    "Some products have not sold recently.": "కొన్ని ఉత్పత్తులు ఇటీవల అమ్మకం కాలేదు।",
    "Try: stock of rice, low stock items, dead stock products.": "ప్రయత్నించండి: బియ్యం స్టాక్, తక్కువ స్టాక్ వస్తువులు, డెడ్ స్టాక్ ఉత్పత్తులు।",
    "Sorry, I didn't understand your request.": "క్షమించండి, మీ అభ్యర్థనను నేను అర్థం చేసుకోలేకపోయాను।"
  }
};

function translate(text, lang) {
  if (!translations[lang]) return text;
  return translations[lang][text] || text;
}

module.exports = function buildReply(intent, data, product, lang = "en-US") {

  if (intent === "STOCK_QUERY") {
    if (data === null) return translate("Invalid product name.", lang);
    return `${product} ${data} ${translate("units available", lang)}.`;
  }

  if (intent === "LOW_STOCK") {
    if (data.length === 0) return translate("No low stock items found.", lang);
    return translate("Some items are running low in stock.", lang);
  }

  if (intent === "DEAD_STOCK") {
    if (data.length === 0) return translate("No dead stock found.", lang);
    return translate("Some products have not sold recently.", lang);
  }

  if (intent === "HELP") {
    return translate("Try: stock of rice, low stock items, dead stock products.", lang);
  }

  return translate("Sorry, I didn't understand your request.", lang);
};
