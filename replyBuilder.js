module.exports = function buildReply(intent, data, product) {

  if (intent === "STOCK_QUERY") {
    if (data === null) return "Invalid product name.";
    return `${product} has ${data} units available.`;
  }

  if (intent === "LOW_STOCK") {
    if (data.length === 0) return "No low stock items found.";
    return "Some items are running low in stock.";
  }

  if (intent === "DEAD_STOCK") {
    if (data.length === 0) return "No dead stock found.";
    return "Some products have not sold recently.";
  }

  if (intent === "HELP") {
    return "Try: stock of rice, low stock items, dead stock products.";
  }

  return "Sorry, I didn't understand your request.";
};
