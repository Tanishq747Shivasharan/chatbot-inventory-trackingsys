const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres", 
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "inventory",
  port: 5432
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection failed", err);
  } else {
    console.log("DB connected at:", res.rows[0]);
  }
});


// Stock by product
async function getStock(productName) {
  const result = await pool.query(
    `SELECT i.current_stock
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     WHERE LOWER(p.name) = $1`,
    [productName]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].current_stock;
}

// Low stock
async function getLowStock() {
  const result = await pool.query(
    `SELECT p.name, i.current_stock
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     WHERE i.current_stock <= p.min_stock`
  );

  return result.rows;
}

// Dead stock
async function getDeadStock() {
  const result = await pool.query(
    `SELECT DISTINCT p.name
     FROM products p
     LEFT JOIN stock_logs s ON p.id = s.product_id
     WHERE s.created_at < NOW() - INTERVAL '30 days'`
  );

  return result.rows;
}

// Top selling product
async function getTopSellingProduct() {
  const result = await pool.query(
    `SELECT p.name, SUM(s.quantity) AS total_sold
     FROM stock_logs s
     JOIN products p ON p.id = s.product_id
     WHERE s.quantity > 0
     GROUP BY p.name
     ORDER BY total_sold DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

module.exports = {
  getStock,
  getLowStock,
  getDeadStock,
  getTopSellingProduct
};