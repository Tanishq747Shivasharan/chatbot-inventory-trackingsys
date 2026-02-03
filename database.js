const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "tan3533",
  database: "inventory",
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

module.exports = {
  getStock,
  getLowStock,
  getDeadStock
};