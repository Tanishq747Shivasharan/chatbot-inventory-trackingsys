const normalizeText = require("./normalize");
const extractProduct = require("./entityExtractor");
const { extractDemandEntities } = require("./entityExtractor");
const db = require("./database");
const classifyQuery = require("./llmClassifier");
const casualReply = require("./casualResponder");
const { sendSupplierDemandEmail } = require("./emailService");

// Language-aware fallback responses
const getLanguageFallback = (type, lang, data = null, product = null) => {
  const fallbacks = {
    "en-US": {
      STOCK_RESULT: (product, stock) => stock === null || stock.length === 0 ? "Product not found in inventory." : 
        stock.length === 1 ? `${stock[0].product_name} has ${stock[0].current_stock} ${stock[0].unit} available.` :
        `Found ${stock.length} products: ${stock.map(p => `${p.product_name} (${p.current_stock} ${p.unit})`).join(', ')}`,
      PRODUCT_DETAILS: (products) => products.length === 0 ? "Product not found." : 
        products.map(p => `${p.product_name}: SKU ${p.sku}, Price ₹${p.selling_price}/${p.unit}, Stock: ${p.current_stock} ${p.unit}`).join('\n'),
      CATEGORY_PRODUCTS: (products) => products.length === 0 ? "No products found in this category." :
        `Found ${products.length} products: ${products.map(p => `${p.product_name} (₹${p.selling_price})`).join(', ')}`,
      SUPPLIER_PRODUCTS: (products) => products.length === 0 ? "No products found from this supplier." :
        `Products from supplier: ${products.map(p => `${p.product_name} (Stock: ${p.current_stock})`).join(', ')}`,
      EXPIRING_PRODUCTS: (products) => products.length === 0 ? "No products expiring soon." :
        `Expiring products: ${products.map(p => `${p.product_name} (expires ${p.expiry_date})`).join(', ')}`,
      OVERSTOCKED_PRODUCTS: (products) => products.length === 0 ? "No overstocked products." :
        `Overstocked: ${products.map(p => `${p.product_name} (${p.current_stock}/${p.max_stock_level})`).join(', ')}`,
      PRODUCT_PRICING: (products) => products.length === 0 ? "Product pricing not found." :
        products.map(p => `${p.product_name}: Selling ₹${p.selling_price}, Profit ${p.profit_margin}%`).join('\n'),
      INVENTORY_SUMMARY: (summary) => `Total Products: ${summary.totalProducts}, Total Stock: ${summary.totalStock} units, Inventory Value: ₹${summary.totalValue.toFixed(2)}, Potential Profit: ₹${summary.potentialProfit.toFixed(2)}`,
      LOW_STOCK: (items) => items.length === 0 ? "No low stock items found." : `Low stock items: ${items.map(i => `${i.product_name} (${i.current_stock}/${i.min_stock_level})`).join(', ')}`,
      DEAD_STOCK: (items) => items.length === 0 ? "No dead stock found." : "Some products have not sold recently.",
      GREETING: () => "Hello! I can help you check inventory, stock levels, product details, and more.",
      HELP: () => "You can ask about stock levels, product details, categories, suppliers, expiring products, pricing, or inventory summary.",
      UNKNOWN: () => "I can help with inventory questions like stock levels, product details, or pricing information.",
      OPINION: (topProduct) => topProduct ? `Based on sales data, ${topProduct} is currently performing the best.` : "I don't have enough data yet, but I can help you check stock or sales.",
      ERROR: () => "Sorry, I couldn't process that request."
    },
    "hi-IN": {
      STOCK_RESULT: (product, stock) => stock === null || stock.length === 0 ? "उत्पाद इन्वेंटरी में नहीं मिला।" : 
        stock.length === 1 ? `${stock[0].product_name} का ${stock[0].current_stock} ${stock[0].unit} उपलब्ध है।` :
        `${stock.length} उत्पाद मिले: ${stock.map(p => `${p.product_name} (${p.current_stock} ${p.unit})`).join(', ')}`,
      PRODUCT_DETAILS: (products) => products.length === 0 ? "उत्पाद नहीं मिला।" : 
        products.map(p => `${p.product_name}: SKU ${p.sku}, कीमत ₹${p.selling_price}/${p.unit}, स्टॉक: ${p.current_stock} ${p.unit}`).join('\n'),
      CATEGORY_PRODUCTS: (products) => products.length === 0 ? "इस श्रेणी में कोई उत्पाद नहीं मिला।" :
        `${products.length} उत्पाद मिले: ${products.map(p => `${p.product_name} (₹${p.selling_price})`).join(', ')}`,
      SUPPLIER_PRODUCTS: (products) => products.length === 0 ? "इस आपूर्तिकर्ता से कोई उत्पाद नहीं मिला।" :
        `आपूर्तिकर्ता के उत्पाद: ${products.map(p => `${p.product_name} (स्टॉक: ${p.current_stock})`).join(', ')}`,
      EXPIRING_PRODUCTS: (products) => products.length === 0 ? "कोई उत्पाद जल्दी एक्सपायर नहीं हो रहा।" :
        `एक्सपायर होने वाले उत्पाद: ${products.map(p => `${p.product_name} (${p.expiry_date} को एक्सपायर)`).join(', ')}`,
      OVERSTOCKED_PRODUCTS: (products) => products.length === 0 ? "कोई ओवरस्टॉक उत्पाद नहीं।" :
        `ओवरस्टॉक: ${products.map(p => `${p.product_name} (${p.current_stock}/${p.max_stock_level})`).join(', ')}`,
      PRODUCT_PRICING: (products) => products.length === 0 ? "उत्पाद मूल्य नहीं मिला।" :
        products.map(p => `${p.product_name}: बिक्री ₹${p.selling_price}, लाभ ${p.profit_margin}%`).join('\n'),
      INVENTORY_SUMMARY: (summary) => `कुल उत्पाद: ${summary.totalProducts}, कुल स्टॉक: ${summary.totalStock} यूनिट, इन्वेंटरी मूल्य: ₹${summary.totalValue.toFixed(2)}, संभावित लाभ: ₹${summary.potentialProfit.toFixed(2)}`,
      LOW_STOCK: (items) => items.length === 0 ? "कम स्टॉक वाली कोई वस्तु नहीं मिली।" : `कम स्टॉक वस्तुएं: ${items.map(i => `${i.product_name} (${i.current_stock}/${i.min_stock_level})`).join(', ')}`,
      DEAD_STOCK: (items) => items.length === 0 ? "कोई डेड स्टॉक नहीं मिला।" : "कुछ उत्पाद हाल ही में नहीं बिके हैं।",
      GREETING: () => "नमस्ते! मैं इन्वेंटरी, स्टॉक लेवल, उत्पाद विवरण और अधिक की जांच में मदद कर सकता हूं।",
      HELP: () => "आप स्टॉक लेवल, उत्पाद विवरण, श्रेणियां, आपूर्तिकर्ता, एक्सपायर होने वाले उत्पाद, मूल्य निर्धारण, या इन्वेंटरी सारांश के बारे में पूछ सकते हैं।",
      UNKNOWN: () => "मैं इन्वेंटरी के सवालों में मदद कर सकता हूं जैसे स्टॉक लेवल, उत्पाद विवरण, या मूल्य निर्धारण जानकारी।",
      OPINION: (topProduct) => topProduct ? `सेल्स डेटा के अनुसार, ${topProduct} फिलहाल सबसे अच्छा प्रदर्शन कर रहा है।` : "अभी तक पर्याप्त डेटा नहीं है, लेकिन मैं स्टॉक या सेल्स चेक करने में मदद कर सकता हूं।",
      ERROR: () => "माफ करें, मैं उस अनुरोध को प्रोसेस नहीं कर पाया।"
    }
  };

  const langFallbacks = fallbacks[lang] || fallbacks["en-US"];
  const fallbackFunc = langFallbacks[type];
  
  if (fallbackFunc) {
    if (type === "STOCK_RESULT") return fallbackFunc(product, data);
    if (["PRODUCT_DETAILS", "CATEGORY_PRODUCTS", "SUPPLIER_PRODUCTS", "EXPIRING_PRODUCTS", "OVERSTOCKED_PRODUCTS", "PRODUCT_PRICING"].includes(type)) return fallbackFunc(data);
    if (type === "INVENTORY_SUMMARY") return fallbackFunc(data);
    if (type === "LOW_STOCK" || type === "DEAD_STOCK") return fallbackFunc(data);
    if (type === "OPINION") return fallbackFunc(data?.name);
    return fallbackFunc();
  }
  
  return langFallbacks.ERROR();
};

const getSupplierDemandReply = (type, lang, params = {}) => {
  const { supplier, product, quantity } = params;
  const replies = {
    "en-US": {
      SUCCESS: () => `Order request sent to ${supplier} for ${quantity} units of ${product}.`,
      MISSING_QUANTITY: () => `How many units of ${product} should I request from ${supplier}?`,
      MISSING_PRODUCT: () => `Which product should I request from ${supplier}?`,
      MISSING_SUPPLIER: () => `Which supplier should I send the demand to for ${product}?`,
      SUPPLIER_NOT_FOUND: () => `I couldn't find supplier ${supplier} in the database.`,
      EMAIL_NOT_CONFIGURED: () => "Email is not configured. Please set SMTP settings.",
      EMAIL_FAILED: () => "I couldn't send the email right now. Please try again."
    },
    "hi-IN": {
      SUCCESS: () => `${supplier} को ${quantity} ${product} के लिए ऑर्डर अनुरोध भेज दिया गया है।`,
      MISSING_QUANTITY: () => `${supplier} से ${product} के लिए कितनी मात्रा मंगवानी है?`,
      MISSING_PRODUCT: () => `${supplier} से किस उत्पाद के लिए अनुरोध भेजना है?`,
      MISSING_SUPPLIER: () => `${product} के लिए किस सप्लायर को अनुरोध भेजना है?`,
      SUPPLIER_NOT_FOUND: () => `डेटाबेस में ${supplier} सप्लायर नहीं मिला।`,
      EMAIL_NOT_CONFIGURED: () => "ईमेल कॉन्फ़िगर नहीं है। कृपया SMTP सेटिंग्स सेट करें।",
      EMAIL_FAILED: () => "ईमेल भेजा नहीं जा सका। कृपया बाद में प्रयास करें।"
    },
    "mr-IN": {
      SUCCESS: () => `${supplier} यांना ${quantity} ${product} साठी ऑर्डर विनंती पाठवली आहे.`,
      MISSING_QUANTITY: () => `${supplier} कडून ${product} साठी किती प्रमाणात मागवायचे आहे?`,
      MISSING_PRODUCT: () => `${supplier} कडून कोणत्या उत्पादनासाठी विनंती पाठवायची?`,
      MISSING_SUPPLIER: () => `${product} साठी कोणत्या पुरवठादाराला विनंती पाठवायची?`,
      SUPPLIER_NOT_FOUND: () => `डेटाबेसमध्ये ${supplier} पुरवठादार सापडला नाही.`,
      EMAIL_NOT_CONFIGURED: () => "ईमेल कॉन्फिगर नाही. कृपया SMTP सेटिंग्ज सेट करा.",
      EMAIL_FAILED: () => "ईमेल पाठवता आला नाही. कृपया नंतर प्रयत्न करा."
    }
  };

  const langReplies = replies[lang] || replies["en-US"];
  const replyFunc = langReplies[type] || replies["en-US"][type];
  return replyFunc();
};

module.exports = async function chatbot(req, res) {
  try {
    const message = req.body.message;
    const lang = req.body.lang || "en-US";
    const businessId = req.body.businessId || "default-business-id"; // You should get this from user session/auth

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
      data = await db.getStock(product, businessId);
      
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

    else if (intent === "PRODUCT_DETAILS") {
      const product = await extractProduct(text);
      data = await db.getProductDetails(product, businessId);
      
      const truth = {
        type: "PRODUCT_DETAILS",
        products: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("PRODUCT_DETAILS", lang, data);
      }
    }

    else if (intent === "CATEGORY_PRODUCTS") {
      // Extract category from text (you might want to improve this extraction)
      const categoryMatch = text.match(/(?:category|श्रेणी|वर्ग)\s+(\w+)|(\w+)\s+(?:products|उत्पाद)/i);
      const category = categoryMatch ? (categoryMatch[1] || categoryMatch[2]) : text.split(' ')[0];
      
      data = await db.getProductsByCategory(category, businessId);
      
      const truth = {
        type: "CATEGORY_PRODUCTS",
        category,
        products: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("CATEGORY_PRODUCTS", lang, data);
      }
    }

    else if (intent === "SUPPLIER_PRODUCTS") {
      // Extract supplier from text
      const supplierMatch = text.match(/(?:supplier|आपूर्तिकर्ता)\s+(\w+)|(\w+)\s+(?:supplier|आपूर्तिकर्ता)/i);
      const supplier = supplierMatch ? (supplierMatch[1] || supplierMatch[2]) : text.split(' ')[0];
      
      data = await db.getProductsBySupplier(supplier, businessId);
      
      const truth = {
        type: "SUPPLIER_PRODUCTS",
        supplier,
        products: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("SUPPLIER_PRODUCTS", lang, data);
      }
    }

    else if (intent === "EXPIRING_PRODUCTS") {
      // Extract days if mentioned, default to 30
      const daysMatch = text.match(/(\d+)\s*(?:days|दिन|दिवस)/i);
      const days = daysMatch ? parseInt(daysMatch[1]) : 30;
      
      data = await db.getExpiringProducts(businessId, days);
      
      const truth = {
        type: "EXPIRING_PRODUCTS",
        days,
        products: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("EXPIRING_PRODUCTS", lang, data);
      }
    }

    else if (intent === "OVERSTOCKED_PRODUCTS") {
      data = await db.getOverstockedProducts(businessId);
      
      const truth = {
        type: "OVERSTOCKED_PRODUCTS",
        products: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("OVERSTOCKED_PRODUCTS", lang, data);
      }
    }

    else if (intent === "PRODUCT_PRICING") {
      const product = await extractProduct(text);
      data = await db.getProductPricing(product, businessId);
      
      const truth = {
        type: "PRODUCT_PRICING",
        product,
        products: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("PRODUCT_PRICING", lang, data);
      }
    }

    else if (intent === "INVENTORY_SUMMARY") {
      data = await db.getInventorySummary(businessId);
      
      const truth = {
        type: "INVENTORY_SUMMARY",
        summary: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("INVENTORY_SUMMARY", lang, data);
      }
    }

    else if (intent === "LOW_STOCK") {
      data = await db.getLowStock(businessId);
      
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
      data = await db.getDeadStock(businessId);
      
      const truth = {
        type: "DEAD_STOCK",
        items: data
      };

      reply = await casualReply(truth, lang);
      if (!reply) {
        reply = getLanguageFallback("DEAD_STOCK", lang, data);
      }
    }

    else if (intent === "SUPPLIER_DEMAND") {
      const entities = await extractDemandEntities(text);
      const product = entities.product;
      const quantity = entities.quantity;
      const supplier = entities.supplier;

      if (!supplier) {
        const productLabel = product || (lang === "hi-IN" ? "उत्पाद" : lang === "mr-IN" ? "उत्पादन" : "the product");
        reply = getSupplierDemandReply("MISSING_SUPPLIER", lang, { product: productLabel });
        return res.json({ reply });
      }

      if (!product) {
        reply = getSupplierDemandReply("MISSING_PRODUCT", lang, { supplier });
        return res.json({ reply });
      }

      if (!quantity) {
        reply = getSupplierDemandReply("MISSING_QUANTITY", lang, { supplier, product });
        return res.json({ reply });
      }

      const supplierRecord = await db.getSupplierByName(supplier, businessId);
      if (!supplierRecord || !supplierRecord.email) {
        reply = getSupplierDemandReply("SUPPLIER_NOT_FOUND", lang, { supplier });
        return res.json({ reply });
      }

      const supplierName = supplierRecord.name || supplierRecord.supplier_name || supplier;
      const emailResult = await sendSupplierDemandEmail({
        supplierEmail: supplierRecord.email,
        supplierName,
        product,
        quantity
      });

      if (!emailResult.ok) {
        if (emailResult.error === "EMAIL_NOT_CONFIGURED") {
          reply = getSupplierDemandReply("EMAIL_NOT_CONFIGURED", lang, { supplier, product, quantity });
        } else {
          reply = getSupplierDemandReply("EMAIL_FAILED", lang, { supplier, product, quantity });
        }
        return res.json({ reply });
      }

      reply = getSupplierDemandReply("SUCCESS", lang, { supplier: supplierName, product, quantity });
    }

    else if (intent === "OPINION") {
      const topProduct = await db.getTopSellingProduct(businessId);

      const truth = {
        type: "OPINION",
        bestProduct: topProduct?.product,
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
        message: "You can ask about stock levels, product details, categories, suppliers, expiring products, pricing, or inventory summary."
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
    const errorLang = req.body.lang || "en-US";
    res.json({ reply: getLanguageFallback("ERROR", errorLang) });
  }
};
