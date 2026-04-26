/*
  ============================================================
  ORDERS — js/orders.js
  Handles order placement, region lock, and Supabase saving
  ============================================================
*/

// ── Anantapur district pincode range ──────────────────────
const ANANTAPUR_MIN = 515001;
const ANANTAPUR_MAX = 515812;

// ── Check if pincode is within Anantapur district ─────────
function isValidPincode(pincode) {
  const code = parseInt(pincode);
  return code >= ANANTAPUR_MIN && code <= ANANTAPUR_MAX;
}

// ── Place order ────────────────────────────────────────────
async function placeOrder(event) {
  event.preventDefault();

  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const pincode = document.getElementById("checkout-pincode").value.trim();

  // ── Validate all fields ──────────────────────────────────
  if (!name || !phone || !address || !pincode) {
    showOrderError("Please fill in all fields.");
    return;
  }

  // ── Validate phone number ────────────────────────────────
  if (!/^[6-9]\d{9}$/.test(phone)) {
    showOrderError("Please enter a valid 10-digit Indian mobile number.");
    return;
  }

  // ── Validate pincode format ──────────────────────────────
  if (!/^\d{6}$/.test(pincode)) {
    showOrderError("Please enter a valid 6-digit pincode.");
    return;
  }

  // ── Region lock check ────────────────────────────────────
  if (!isValidPincode(pincode)) {
    showOrderError(
      "Sorry, we only deliver within Anantapur district (515001–515812). Please check your pincode."
    );
    return;
  }

  // ── Get cart items ───────────────────────────────────────
  const cart = getCart();
  if (cart.length === 0) {
    showOrderError("Your cart is empty. Please add items before ordering.");
    return;
  }

  const total = getCartTotal();

  // ── Get logged in user ───────────────────────────────────
  const {
    data: { user },
  } = await window.sb.auth.getUser();

  // ── Disable submit button to prevent double order ────────
  const submitBtn = document.getElementById("place-order-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order...";
  }

  // ── Save order to Supabase ───────────────────────────────
  const { data: order, error } = await window.sb
    .from("orders")
    .insert({
      customer_id: user ? user.id : null,
      customer_name: name,
      customer_phone: phone,
      address: address,
      pincode: pincode,
      items: cart,
      total: total,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    showOrderError("Failed to place order. Please try again.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
    return;
  }

  // ── Notify admins via WhatsApp ───────────────────────────
  notifyAdmins({
    name,
    phone,
    address,
    pincode,
    items: cart,
    total,
    orderId: order.id,
  });

  // ── Clear cart ───────────────────────────────────────────
  clearCart();

  // ── Show success message ─────────────────────────────────
  showOrderSuccess(order.id);
}

// ── Show order error message ───────────────────────────────
function showOrderError(msg) {
  const el = document.getElementById("order-message");
  if (!el) return;
  el.textContent = msg;
  el.className = "order-message error";
  el.scrollIntoView({ behavior: "smooth" });
}

// ── Show order success screen ──────────────────────────────
function showOrderSuccess(orderId) {
  const cartContent = document.getElementById("cart-content");
  const successScreen = document.getElementById("order-success");

  if (cartContent) cartContent.style.display = "none";

  if (successScreen) {
    successScreen.style.display = "flex";
    document.getElementById("success-order-id").textContent =
      orderId.slice(0, 8).toUpperCase();
  }
}

// ── Setup checkout form listener ───────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkout-form");
  if (form) {
    form.addEventListener("submit", placeOrder);
  }

  // Live pincode validation feedback
  const pincodeInput = document.getElementById("checkout-pincode");
  if (pincodeInput) {
    pincodeInput.addEventListener("input", () => {
      const val = pincodeInput.value.trim();
      const hint = document.getElementById("pincode-hint");
      if (!hint) return;

      if (val.length === 6) {
        if (isValidPincode(val)) {
          hint.textContent = "✓ Delivery available in your area";
          hint.className = "pincode-hint valid";
        } else {
          hint.textContent = "✗ Sorry, we don't deliver to this pincode";
          hint.className = "pincode-hint invalid";
        }
      } else {
        hint.textContent = "Enter your 6-digit pincode";
        hint.className = "pincode-hint";
      }
    });
  }
});