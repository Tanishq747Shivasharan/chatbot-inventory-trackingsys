require("dotenv").config();
const nodemailer = require("nodemailer");

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "0", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = (process.env.SMTP_SECURE || "").toLowerCase() === "true";

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

async function sendSupplierDemandEmail({ supplierEmail, supplierName, product, quantity }) {
  const transporter = createTransporter();
  if (!transporter) {
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = "Product Demand Request";
  const body = `Hello ${supplierName},

We would like to place an order for:

Product: ${product}
Quantity: ${quantity}

Please confirm availability.

Regards,
Inventory Management System`;

  try {
    await transporter.sendMail({
      from,
      to: supplierEmail,
      subject,
      text: body
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: "SMTP_FAILED", details: error.message };
  }
}

module.exports = {
  sendSupplierDemandEmail
};
