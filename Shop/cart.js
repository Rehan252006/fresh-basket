/*
  ============================================================
  CART — js/cart.js
  Handles cart logic using localStorage
  ============================================================
*/

// ── Get cart from localStorage ─────────────────────────────
function getCart() {
  const cart = localStorage.getItem("freshbasket_cart");
  return cart ? JSON.parse(cart) : [];
}

// ── Save cart to localStorage ──────────────────────────────
function saveCart(cart) {
  localStorage.setItem("freshbasket_cart", JSON.stringify(cart));
  updateCartCount();
}

// ── Add item variant to cart ─────────────────────────────────
function addVariantToCart(id, name, basePrice, image, isWeighable) {
  let finalId = id;
  let finalName = name;
  let finalPrice = basePrice;

  if (isWeighable) {
    const select = document.getElementById(`weight-${id}`);
    if (select) {
      const [weightLabel, multiplier] = select.value.split(',');
      finalId = `${id}-${weightLabel}`;
      finalName = `${name} (${weightLabel})`;
      finalPrice = basePrice * parseFloat(multiplier);
    }
  }

  addToCart(finalId, finalName, finalPrice, image);
}

// ── Add item to cart ───────────────────────────────────────
function addToCart(id, name, price, image) {
  const cart = getCart();

  // Check if item already exists in cart
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }

  saveCart(cart);
  animateCartIcon();
  showToast(`${name} added to cart!`);
}

// ── Remove item from cart completely ──────────────────────
function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== id);
  saveCart(cart);
  renderCart();
}

// ── Increase item quantity ─────────────────────────────────
function increaseQty(id) {
  const cart = getCart();
  const item = cart.find((item) => item.id === id);
  if (item) item.qty += 1;
  saveCart(cart);
  renderCart();
}

// ── Decrease item quantity ─────────────────────────────────
function decreaseQty(id) {
  const cart = getCart();
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.qty -= 1;
    if (item.qty <= 0) {
      removeFromCart(id);
      return;
    }
  }
  saveCart(cart);
  renderCart();
}

// ── Update cart count badge in navbar ─────────────────────
function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  badge.textContent = totalItems;
  badge.style.display = totalItems > 0 ? "flex" : "none";
}

// ── Animate cart icon on add ───────────────────────────────
function animateCartIcon() {
  const icon = document.getElementById("cart-icon");
  if (!icon) return;
  icon.classList.remove("bounce");
  void icon.offsetWidth;
  icon.classList.add("bounce");
  setTimeout(() => icon.classList.remove("bounce"), 600);
}

// ── Show toast notification ────────────────────────────────
function showToast(message) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = "toast slide-in";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ── Render cart items on cart.html ────────────────────────
function renderCart() {
  const cartList = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("cart-empty");
  const cartContent = document.getElementById("cart-content");

  if (!cartList) return;

  const cart = getCart();

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    if (cartContent) cartContent.style.display = "none";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";
  if (cartContent) cartContent.style.display = "block";

  cartList.innerHTML = "";
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item fade-up";
    row.innerHTML = `
      <img
        src="${item.image}"
        alt="${item.name}"
        class="cart-item-img"
        onerror="this.src='https://placehold.co/400x400/e8f5e9/2E7D32?text=No+Image'"
      />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">₹${Number(item.price).toFixed(2)} each</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="decreaseQty('${item.id}')">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="increaseQty('${item.id}')">+</button>
      </div>
      <p class="cart-item-subtotal">₹${(item.price * item.qty).toFixed(2)}</p>
      <button class="btn-remove" onclick="removeFromCart('${item.id}')">✕</button>
    `;
    cartList.appendChild(row);
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (cartTotal) cartTotal.textContent = `₹${total.toFixed(2)}`;
}

// ── Clear entire cart ──────────────────────────────────────
function clearCart() {
  localStorage.removeItem("freshbasket_cart");
  updateCartCount();
}

// ── Get cart total ─────────────────────────────────────────
function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ── Anantapur district pincode range ──────────────────────
const ANANTAPUR_MIN = 515001;
const ANANTAPUR_MAX = 515812;

// ── Check if pincode is within Anantapur district ─────────
function isValidPincode(pincode) {
  const code = parseInt(pincode);
  return code >= ANANTAPUR_MIN && code <= ANANTAPUR_MAX;
}

// ── Place order (NO LOGIN REQUIRED) ────────────────────────
async function placeOrder(event) {
  event.preventDefault();

  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const pincode = document.getElementById("checkout-pincode").value.trim();

  // ── Validate all fields ──────────────────────────────
  if (!name || !phone || !address || !pincode) {
    showOrderError("Please fill in all fields.");
    return;
  }

  // ── Validate phone number ────────────────────────────
  if (!/^[6-9]\d{9}$/.test(phone)) {
    showOrderError("Please enter a valid 10-digit Indian mobile number.");
    return;
  }

  // ── Validate pincode format ──────────────────────────
  if (!/^\d{6}$/.test(pincode)) {
    showOrderError("Please enter a valid 6-digit pincode.");
    return;
  }

  // ── Region lock check ────────────────────────────────
  if (!isValidPincode(pincode)) {
    showOrderError(
      "Sorry, we only deliver within Anantapur district (515001–515812). Please check your pincode."
    );
    return;
  }

  // ── Get cart items ───────────────────────────────────
  const cart = getCart();
  if (cart.length === 0) {
    showOrderError("Your cart is empty. Please add items before ordering.");
    return;
  }

  const total = getCartTotal();

  // ── Get logged in user (optional - can be null) ──────
  const { data: { user } } = await window.sb.auth.getUser();

  // ── Disable submit button to prevent double order ────
  const submitBtn = document.getElementById("place-order-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order...";
  }

  // ── Save order to Supabase ───────────────────────────
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

  // ── Notify admins via WhatsApp ───────────────────────
  notifyAdmins({
    name,
    phone,
    address,
    pincode,
    items: cart,
    total,
    orderId: order.id,
  });

  // ── Clear cart ───────────────────────────────────────
  clearCart();

  // ── Show success message ─────────────────────────────
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
  updateCartCount();
  renderCart();

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