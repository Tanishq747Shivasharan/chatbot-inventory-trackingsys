module.exports = function detectIntent(text) {
  if (text.includes("low stock")) return "LOW_STOCK";
  if (text.includes("dead stock") || text.includes("unsold")) return "DEAD_STOCK";
  if (text.includes("stock of") || text.includes("how much")) return "STOCK_QUERY";
  if (text.includes("help")) return "HELP";
  return "UNKNOWN";
};
