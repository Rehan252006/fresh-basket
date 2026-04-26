async function loadProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading fresh products...</p>
    </div>
  `;

  const { data: products, error } = await window.sb
    .from("products")
    .select("*")
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="error-msg">Failed to load products. Please try again.</p>`;
    return;
  }

  if (products.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No products available right now. Check back soon!</p>`;
    return;
  }

  grid.innerHTML = "";
  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.appendChild(card);
  });
}

function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card fade-up";
  card.style.animationDelay = `${index * 0.1}s`;

  const imgSrc = product.image_url || "https://placehold.co/400x400/e8f5e9/2E7D32?text=No+Image";

  let isWeighable = false;
  let weightSelector = '';

  if (product.category === 'Vegetables' || product.category === 'Fruits' || product.category === 'Grocery') {
    isWeighable = true;

    // Base options for all weighable items
    let options = [
      { label: '1 kg', val: '1kg', mult: 1 },
      { label: '500 g', val: '500g', mult: 0.5 },
      { label: '250 g', val: '250g', mult: 0.25 }
    ];

    // Add heavier options for Groceries
    if (product.category === 'Grocery') {
      options = [
        { label: '10 kg', val: '10kg', mult: 10 },
        { label: '8 kg', val: '8kg', mult: 8 },
        { label: '6 kg', val: '6kg', mult: 6 },
        { label: '5 kg', val: '5kg', mult: 5 },
        { label: '4 kg', val: '4kg', mult: 4 },
        { label: '3 kg', val: '3kg', mult: 3 },
        { label: '2 kg', val: '2kg', mult: 2 },
        ...options
      ];
    }

    const optionsHtml = options.map(opt => 
      `<option value="${opt.val},${opt.mult}">${opt.label} - ₹${(Number(product.price) * opt.mult).toFixed(2)}</option>`
    ).join('');

    weightSelector = `
      <select class="weight-select" id="weight-${product.id}">
        ${optionsHtml}
      </select>
    `;
  }

  card.innerHTML = `
    <div class="card-img-wrap">
      <img
        src="${imgSrc}"
        alt="${product.name}"
        class="product-image"
        onerror="this.src='https://placehold.co/400x400/e8f5e9/2E7D32?text=No+Image'"
      />
      <span class="category-badge">${product.category}</span>
    </div>
    <div class="card-body">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-price">₹${Number(product.price).toFixed(2)}</p>
      ${weightSelector}
      <button
        class="btn-add-cart"
        onclick="addVariantToCart('${product.id}', '${product.name}', ${product.price}, '${imgSrc}', ${isWeighable})"
      >
        Add to Cart
      </button>
    </div>
  `;

  return card;
}

async function filterByCategory(category) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  grid.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;

  let query = window.sb
    .from("products")
    .select("*")
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (category !== "all") {
    query = query.eq("category", category);
  }

  const { data: products, error } = await query;

  if (error || !products) {
    grid.innerHTML = `<p class="error-msg">Failed to load products.</p>`;
    return;
  }

  if (products.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No products in this category.</p>`;
    return;
  }

  grid.innerHTML = "";
  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.appendChild(card);
  });
}

async function searchProducts(query) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  if (query.trim() === "") {
    loadProducts();
    return;
  }

  const { data: products, error } = await window.sb
    .from("products")
    .select("*")
    .eq("available", true)
    .ilike("name", `%${query}%`);

  if (error) {
    grid.innerHTML = `<p class="error-msg">Search failed. Try again.</p>`;
    return;
  }

  if (products.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No products found for "${query}".</p>`;
    return;
  }

  grid.innerHTML = "";
  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.appendChild(card);
  });
}