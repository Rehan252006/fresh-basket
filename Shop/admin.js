/*
  ============================================================
  ADMIN — js/admin.js
  Handles product management and realtime order tracking
  ============================================================
*/

// ── Current edit product id (null = adding new) ────────────
let editingProductId = null;

// ── Page init ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Protect page — redirect if not admin
  const profile = await requireAdmin();

  // Show admin name in header
  const adminName = document.getElementById("admin-name");
  if (adminName) adminName.textContent = profile.name;

  // Load initial data
  await loadAdminProducts();
  await loadAdminOrders();

  // Start realtime order subscription
  subscribeToOrders();

  // Setup tab switching
  setupTabs();

  // Setup product form
  const productForm = document.getElementById("product-form");
  if (productForm) {
    productForm.addEventListener("submit", handleProductSubmit);
  }
});

// ── Tab switching ──────────────────────────────────────────
function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs and panels
      document.querySelectorAll(".tab-btn").forEach((t) =>
        t.classList.remove("active")
      );
      document.querySelectorAll(".tab-panel").forEach((p) =>
        p.classList.remove("active")
      );

      // Activate clicked tab
      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
}

// ══════════════════════════════════════════════════════════
// PRODUCTS MANAGEMENT
// ══════════════════════════════════════════════════════════

// ── Load all products in admin panel ──────────────────────
async function loadAdminProducts() {
  const list = document.getElementById("admin-product-list");
  if (!list) return;

  list.innerHTML = `<p class="loading-text">Loading products...</p>`;

  const { data: products, error } = await window.sb
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<p class="error-msg">Failed to load products.</p>`;
    return;
  }

  if (products.length === 0) {
    list.innerHTML = `<p class="empty-msg">No products yet. Add your first product above.</p>`;
    return;
  }

  list.innerHTML = "";
  products.forEach((product) => {
    const row = createAdminProductRow(product);
    list.appendChild(row);
  });
}

// ── Create admin product row ───────────────────────────────
function createAdminProductRow(product) {
  const row = document.createElement("div");
  row.className = "admin-product-row fade-up";
  row.id = `product-row-${product.id}`;

  row.innerHTML = `
    <img
      src="${product.image_url || "https://placehold.co/400x400/e8f5e9/2E7D32?text=No+Image"}"
      alt="${product.name}"
      class="admin-product-img"
      onerror="this.src='https://placehold.co/400x400/e8f5e9/2E7D32?text=No+Image'"
    />
    <div class="admin-product-info">
      <p class="admin-product-name">${product.name}</p>
      <p class="admin-product-meta">
        ${product.category} &nbsp;|&nbsp; ₹${Number(product.price).toFixed(2)}
      </p>
      <span class="availability-badge ${product.available ? "available" : "unavailable"}">
        ${product.available ? "Available" : "Unavailable"}
      </span>
    </div>
    <div class="admin-product-actions">
      <button class="btn-edit" onclick="editProduct('${product.id}')">Edit</button>
      <button class="btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
    </div>
  `;

  return row;
}

// ── Handle product form submit (add or update) ─────────────
async function handleProductSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("product-name").value.trim();
  const price = parseFloat(document.getElementById("product-price").value);
  const category = document.getElementById("product-category").value;
  const image_url = document.getElementById("product-image").value.trim();
  const available = document.getElementById("product-available").checked;

  if (!name || !price || !category) {
    showAdminMsg("Please fill in all required fields.", "error");
    return;
  }

  const productData = { name, price, category, image_url, available };

  const submitBtn = document.getElementById("product-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = editingProductId ? "Updating..." : "Adding...";
  }

  if (editingProductId) {
    // Update existing product
    const { error } = await window.sb
      .from("products")
      .update(productData)
      .eq("id", editingProductId);

    if (error) {
      showAdminMsg("Failed to update product.", "error");
    } else {
      showAdminMsg("Product updated successfully!", "success");
      cancelEdit();
      await loadAdminProducts();
    }
  } else {
    // Insert new product
    const { error } = await window.sb
      .from("products")
      .insert(productData);

    if (error) {
      showAdminMsg("Failed to add product.", "error");
    } else {
      showAdminMsg("Product added successfully!", "success");
      resetProductForm();
      await loadAdminProducts();
    }
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = editingProductId ? "Update Product" : "Add Product";
  }
}

// ── Fill form with product data for editing ────────────────
async function editProduct(id) {
  const { data: product, error } = await window.sb
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    showAdminMsg("Failed to load product for editing.", "error");
    return;
  }

  editingProductId = id;

  document.getElementById("product-name").value = product.name;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-image").value = product.image_url || "";
  document.getElementById("product-available").checked = product.available;

  // Update form UI
  document.getElementById("product-form-title").textContent = "Edit Product";
  document.getElementById("product-submit-btn").textContent = "Update Product";
  document.getElementById("cancel-edit-btn").style.display = "inline-block";

  // Scroll to form
  document.getElementById("product-form").scrollIntoView({ behavior: "smooth" });
}

// ── Cancel edit and reset form ─────────────────────────────
function cancelEdit() {
  editingProductId = null;
  resetProductForm();
  document.getElementById("product-form-title").textContent = "Add New Product";
  document.getElementById("product-submit-btn").textContent = "Add Product";
  document.getElementById("cancel-edit-btn").style.display = "none";
}

// ── Reset product form fields ──────────────────────────────
function resetProductForm() {
  document.getElementById("product-form").reset();
}

// ── Delete a product ───────────────────────────────────────
async function deleteProduct(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this product? This cannot be undone."
  );
  if (!confirmed) return;

  const { error } = await window.sb
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    showAdminMsg("Failed to delete product.", "error");
    return;
  }

  showAdminMsg("Product deleted.", "success");
  await loadAdminProducts();
}

// ══════════════════════════════════════════════════════════
// ORDERS MANAGEMENT
// ══════════════════════════════════════════════════════════

// ── Load all orders ────────────────────────────────────────
async function loadAdminOrders() {
  const list = document.getElementById("admin-order-list");
  if (!list) return;

  list.innerHTML = `<p class="loading-text">Loading orders...</p>`;

  const { data: orders, error } = await window.sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<p class="error-msg">Failed to load orders.</p>`;
    return;
  }

  if (orders.length === 0) {
    list.innerHTML = `<p class="empty-msg">No orders yet.</p>`;
    return;
  }

  list.innerHTML = "";
  orders.forEach((order) => {
    const card = createOrderCard(order);
    list.appendChild(card);
  });
}

// ── Create order card ──────────────────────────────────────
function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = "order-card fade-up";
  card.id = `order-${order.id}`;

  const itemsList = order.items
    .map((item) => `<li>${item.name} x${item.qty} — ₹${(item.price * item.qty).toFixed(2)}</li>`)
    .join("");

  const date = new Date(order.created_at).toLocaleString("en-IN");

  card.innerHTML = `
    <div class="order-card-header">
      <div>
        <span class="order-id">#${order.id.slice(0, 8).toUpperCase()}</span>
        <span class="order-date">${date}</span>
      </div>
      <select
        class="status-select status-${order.status}"
        onchange="updateOrderStatus('${order.id}', this.value, this)"
      >
        <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>Confirmed</option>
        <option value="out for delivery" ${order.status === "out for delivery" ? "selected" : ""}>Out for Delivery</option>
        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>      </select>
    </div>
    <div class="order-card-body">
      <div class="order-customer">
        <p><strong>${order.customer_name}</strong></p>
        <p>📞 ${order.customer_phone}</p>
        <p>📍 ${order.address}, ${order.pincode}</p>
      </div>
      <div class="order-items">
        <p><strong>Items:</strong></p>
        <ul>${itemsList}</ul>
      </div>
      <div class="order-total">
        <p class="total-label">Total</p>
        <p class="total-amount">₹${Number(order.total).toFixed(2)}</p>
      </div>
    </div>
  `;

  return card;
}

// ── Update order status ────────────────────────────────────
async function updateOrderStatus(id, status, selectEl) {
  const { error } = await window.sb
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    showAdminMsg("Failed to update order status.", "error");
    return;
  }

  // Update select color class
  selectEl.className = `status-select status-${status}`;
  showAdminMsg("Order status updated!", "success");
}

// ── Realtime subscription for new orders ───────────────────
function subscribeToOrders() {
  window.sb
    .channel("orders-channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => {
        handleNewOrder(payload.new);
      }
    )
    .subscribe();
}

// ── Handle incoming new order ──────────────────────────────
function handleNewOrder(order) {
  // Play notification beep
  playNotificationSound();

  // Show banner
  showNewOrderBanner(order);

  // Prepend order card to list
  const list = document.getElementById("admin-order-list");
  if (list) {
    const emptyMsg = list.querySelector(".empty-msg");
    if (emptyMsg) emptyMsg.remove();

    const card = createOrderCard(order);
    card.classList.add("new-order-highlight");
    list.prepend(card);
  }
}

// ── Show sliding new order banner ──────────────────────────
function showNewOrderBanner(order) {
  const existing = document.getElementById("new-order-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "new-order-banner";
  banner.className = "new-order-banner slide-down";
  banner.innerHTML = `
    🛒 New order received from <strong>${order.customer_name}</strong>!
    &nbsp;
    <button onclick="
      document.getElementById('new-order-banner').remove();
      document.querySelector('[data-tab=orders-tab]').click();
    ">View Order</button>
    <button onclick="document.getElementById('new-order-banner').remove()">✕</button>
  `;
  document.body.prepend(banner);

  // Auto remove after 10 seconds
  setTimeout(() => {
    if (banner.parentNode) {
      banner.classList.add("fade-out");
      setTimeout(() => banner.remove(), 400);
    }
  }, 10000);
}

// ── Play soft notification beep using Web Audio API ────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.log("Audio not supported:", e);
  }
}

// ── Show admin message ─────────────────────────────────────
function showAdminMsg(msg, type) {
  const el = document.getElementById("admin-message");
  if (!el) return;
  el.textContent = msg;
  el.className = `admin-message ${type}`;
  setTimeout(() => {
    el.textContent = "";
    el.className = "admin-message";
  }, 3000);
}