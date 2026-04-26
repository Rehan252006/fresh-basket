/*
  ============================================================
  AUTH — js/auth.js
  Handles login, signup, logout, and role-based redirects
  ============================================================
*/

// ── Check if user is logged in and get their role ──────────
async function getProfile() {
  const { data: { user } } = await window.sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await window.sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

// ── Protect admin page ─────────────────────────────────────
async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    window.location.href = "login.html";
  }
  return profile;
}

// ── Protect customer pages (must be logged in) ─────────────
async function requireLogin() {
  const profile = await getProfile();
  if (!profile) {
    window.location.href = "login.html";
  }
  return profile;
}

// ── Show logout button if logged in ───────────────────────
async function setupNavbar() {
  const profile = await getProfile();
  const navAuth = document.getElementById("nav-auth");
  if (!navAuth) return;

  if (profile) {
    navAuth.innerHTML = `
      <span class="nav-username">Hi, ${profile.name.split(" ")[0]}</span>
      <button class="btn-logout" onclick="logout()">Logout</button>
    `;
  } else {
    navAuth.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
  }
}

// ── Logout ─────────────────────────────────────────────────
async function logout() {
  await window.sb.auth.signOut();
  window.location.href = "login.html";
}

// ── Login with email and password ─────────────────────────
async function login(email, password) {
  const { data, error } = await window.sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showAuthError(error.message);
    return;
  }

  // Get role and redirect
  const { data: profile } = await window.sb
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profile && profile.role === "admin") {
    window.location.href = "admin.html";
  } else {
    // Pass login=success and the first name in the URL for the welcome animation
    const firstName = profile ? profile.name.split(" ")[0] : "";
    window.location.href = `index.html?login=success&name=${encodeURIComponent(firstName)}`;
  }
}

// ── Sign up new customer ───────────────────────────────────
async function signup(name, phone, email, password) {
  // Create auth user
  const { data, error } = await window.sb.auth.signUp({ email, password });

  if (error) {
    showAuthError(error.message);
    return;
  }

  // Insert into profiles table as customer
  const { error: profileError } = await window.sb.from("profiles").insert({
    id: data.user.id,
    name: name,
    phone: phone,
    role: "customer",
  });

  if (profileError) {
    showAuthError(profileError.message);
    return;
  }

  showAuthSuccess("Account created! Please login.");
  setTimeout(() => switchToLogin(), 1500);
}

// ── Show error message on login page ──────────────────────
function showAuthError(msg) {
  const el = document.getElementById("auth-message");
  if (!el) return;
  el.textContent = msg;
  el.className = "auth-message error";
}

// ── Show success message on login page ────────────────────
function showAuthSuccess(msg) {
  const el = document.getElementById("auth-message");
  if (!el) return;
  el.textContent = msg;
  el.className = "auth-message success";
}

// ── Toggle between login and signup form ──────────────────
function switchToLogin() {
  document.getElementById("login-form").style.display = "flex";
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("auth-title").textContent = "Welcome Back";
  document.getElementById("auth-message").textContent = "";
}

function switchToSignup() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("signup-form").style.display = "flex";
  document.getElementById("auth-title").textContent = "Create Account";
  document.getElementById("auth-message").textContent = "";
}