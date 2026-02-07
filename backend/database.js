require("dotenv").config();
const supabase = require("./supabaseClient");

/* ------------------ TEST CONNECTION ------------------ */
// Remove the immediate async execution that might be causing the server to exit
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("product_name")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("Supabase connected:", data);
    }
  } catch (err) {
    console.error("Connection test failed:", err);
  }
}

// Test connection when module loads
testConnection();

/* ------------------ PRODUCT MANAGEMENT FUNCTIONS ------------------ */

// Get product details by name or SKU
async function getProductDetails(identifier, businessId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      product_name,
      sku,
      barcode,
      unit,
      purchase_price,
      selling_price,
      current_stock,
      min_stock_level,
      max_stock_level,
      expiry_date,
      description,
      categories(category_name),
      suppliers(supplier_name)
    `)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .or(`product_name.ilike.%${identifier}%,sku.ilike.%${identifier}%,barcode.eq.${identifier}`)
    .limit(5);

  if (error) return [];
  return data;
}

// Search products by category
async function getProductsByCategory(categoryName, businessId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      product_name,
      sku,
      current_stock,
      selling_price,
      unit,
      categories!inner(category_name)
    `)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .ilike("categories.category_name", `%${categoryName}%`);

    return data;
}

// Get products by supplier
async function getProductsBySupplier(supplierName, businessId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      product_name,
      sku,
      current_stock,
      purchase_price,
      selling_price,
      suppliers!inner(supplier_name)
    `)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .ilike("suppliers.supplier_name", `%${supplierName}%`);

  if (error) return [];
  return data;
}

// Get supplier details by name
async function getSupplierByName(supplierName, businessId) {
  try {
    let { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("business_id", businessId)
      .ilike("name", `%${supplierName}%`)
      .limit(1);

    if (error && error.message && error.message.includes("business_id")) {
      const retry = await supabase
        .from("suppliers")
        .select("*")
        .ilike("name", `%${supplierName}%`)
        .limit(1);
      data = retry.data;
      error = retry.error;
    }

    if (error && error.message && error.message.includes("name")) {
      let fallback = await supabase
        .from("suppliers")
        .select("*")
        .eq("business_id", businessId)
        .ilike("supplier_name", `%${supplierName}%`)
        .limit(1);
      if (fallback.error && fallback.error.message && fallback.error.message.includes("business_id")) {
        fallback = await supabase
          .from("suppliers")
          .select("*")
          .ilike("supplier_name", `%${supplierName}%`)
          .limit(1);
      }
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch (err) {
    return null;
  }
}

// Get expiring products (within specified days)
async function getExpiringProducts(businessId, daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  const { data, error } = await supabase
    .from("products")
    .select("product_name, sku, expiry_date, current_stock, unit")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .not("expiry_date", "is", null)
    .lte("expiry_date", futureDate.toISOString().split('T')[0])
    .order("expiry_date", { ascending: true });

  if (error) return [];
  return data;
}

// Get products with high stock (above max level)
async function getOverstockedProducts(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("product_name, sku, current_stock, max_stock_level, unit")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .filter("current_stock", "gt", "max_stock_level");

  if (error) return [];
  return data;
}

// Get product pricing information
async function getProductPricing(productName, businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("product_name, sku, purchase_price, selling_price, unit")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .ilike("product_name", `%${productName}%`);

  if (error) return [];
  return data.map(product => ({
    ...product,
    profit_margin: ((product.selling_price - product.purchase_price) / product.purchase_price * 100).toFixed(2)
  }));
}

// Get inventory summary
async function getInventorySummary(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("current_stock, purchase_price, selling_price")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (error) return null;

  const summary = data.reduce((acc, product) => {
    acc.totalProducts += 1;
    acc.totalStock += product.current_stock;
    acc.totalValue += product.current_stock * product.purchase_price;
    acc.totalSellingValue += product.current_stock * product.selling_price;
    return acc;
  }, {
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    totalSellingValue: 0
  });

  summary.potentialProfit = summary.totalSellingValue - summary.totalValue;
  return summary;
}

/* ------------------ EXISTING INVENTORY LOGIC ------------------ */

// Stock by product
async function getStock(productName, businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("product_name, current_stock, unit, min_stock_level, max_stock_level")
    .ilike("product_name", `%${productName}%`)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .limit(5);

  if (error) return [];
  return data;
}

// Low stock products
async function getLowStock(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("product_name, current_stock, min_stock_level, unit")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .filter("current_stock", "lte", "min_stock_level")
    .order("current_stock", { ascending: true });

  if (error) return [];
  return data;
}

// Dead stock (no movement in 30 days)
async function getDeadStock(businessId) {
  const { data, error } = await supabase.rpc("get_dead_stock", {
    business_id_input: businessId
  });

  if (error) return [];
  return data;
}

// Top selling product
async function getTopSellingProduct(businessId) {
  const { data, error } = await supabase
    .from("stock_logs")
    .select(`
      quantity,
      products!inner(product_name)
    `)
    .eq("products.business_id", businessId)
    .gt("quantity", 0);

  if (error || !data.length) return null;

  const totals = {};
  data.forEach(row => {
    const name = row.products.product_name;
    totals[name] = (totals[name] || 0) + row.quantity;
  });

  const [product, total] =
    Object.entries(totals).sort((a, b) => b[1] - a[1])[0];

  return { product, total };
}

module.exports = {
  // Product management functions
  getProductDetails,
  getProductsByCategory,
  getProductsBySupplier,
  getSupplierByName,
  getExpiringProducts,
  getOverstockedProducts,
  getProductPricing,
  getInventorySummary,
  
  // Existing inventory functions
  getStock,
  getLowStock,
  getDeadStock,
  getTopSellingProduct
};
