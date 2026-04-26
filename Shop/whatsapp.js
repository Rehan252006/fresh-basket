/*
  ============================================================
  NOTIFICATIONS — js/whatsapp.js
  Sends order details to the admin Telegram group
  ============================================================
*/

// ── Telegram Bot Credentials ───────────────────────────────
const TELEGRAM_BOT_TOKEN = "8752726625:AAGPa4Q6R_Y2XKDZv-xthW4lqZHd208-O6w";
const TELEGRAM_CHAT_ID = "-5211384988";

// ── Build the WhatsApp message ─────────────────────────────
function buildOrderMessage(order) {
  const { name, phone, address, pincode, items, total, orderId } = order;

  // Build items list
  const itemsList = items
    .map(
      (item) =>
        `  • ${item.name} x${item.qty} = ₹${(item.price * item.qty).toFixed(2)}`
    )
    .join("\n");

  // Format date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = `
🛒 *NEW ORDER — Fresh Basket Anantapur*
━━━━━━━━━━━━━━━━━━━━━━
🆔 Order ID: ${orderId.slice(0, 8).toUpperCase()}
📅 Date: ${dateStr} at ${timeStr}
━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Details*
Name: ${name}
Phone: ${phone}
Address: ${address}
Pincode: ${pincode}
━━━━━━━━━━━━━━━━━━━━━━
🧺 *Items Ordered*
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━
💰 *Total: ₹${Number(total).toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━━━
📌 Status: Pending
Please confirm the order on the admin dashboard.
  `.trim();

  return message;
}

// ── Send Telegram message ──────────────────────────
async function notifyAdmins(order) {
  const message = buildOrderMessage(order);
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}

// ── Build the WhatsApp cancel message ──────────────────────────
function buildCancelMessage(order) {
  const { name, phone, orderId } = order;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = `
❌ *ORDER CANCELLED — Fresh Basket Anantapur*
━━━━━━━━━━━━━━━━━━━━━━
🆔 Order ID: ${orderId.slice(0, 8).toUpperCase()}
📅 Cancelled On: ${dateStr} at ${timeStr}
━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Details*
Name: ${name || 'N/A'}
Phone: ${phone || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━
📌 Status: Cancelled by Customer
Please update your records.
  `.trim();

  return message;
}

// ── Send Telegram cancel message ───────────────────
async function notifyAdminsCancel(order) {
  const message = buildCancelMessage(order);
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}