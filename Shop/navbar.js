// Load navbar into all pages
document.addEventListener("DOMContentLoaded", async () => {
  // Insert navbar at the top
  const navContainer = document.createElement("div");
  navContainer.id = "navbar-container";
  document.body.insertBefore(navContainer, document.body.firstChild);

  // Fetch and insert navbar HTML
  const navHTML = `
    <nav class="navbar">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">🛒 SMV Daily Needs</a>
        <button class="hamburger" id="hamburger" onclick="toggleMenu()">
          <span></span><span></span><span></span>
        </button>
        <ul class="nav-links" id="nav-links">
          <li><a href="index.html" class="nav-link">Home</a></li>
          <li><a href="cart.html" class="nav-link">Cart</a></li>
          <li><a href="orders.html" class="nav-link">My Orders</a></li>
          <li id="nav-auth"><a href="login.html" class="nav-link">Login</a></li>
        </ul>
        <a href="cart.html" class="cart-btn" id="cart-icon">
          🛍️
          <span class="cart-count" id="cart-count" style="display:none">0</span>
        </a>
      </div>
    </nav>
  `;

  navContainer.innerHTML = navHTML;

  // Setup navbar functions
  setupNavbar();
  updateCartCount();
});

function toggleMenu() {
  const links = document.getElementById("nav-links");
  const burger = document.getElementById("hamburger");
  if (links && burger) {
    links.classList.toggle("open");
    burger.classList.toggle("open");
  }
}