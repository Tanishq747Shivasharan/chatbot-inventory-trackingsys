module.exports = function extractProduct(text) {
  if (text.includes("stock of")) {
    return text.split("stock of")[1].trim();
  }

  if (text.includes("how much")) {
    return text.split("how much")[1].trim();
  }

  return null;
};
