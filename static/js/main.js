document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/cart/', {
            method: 'GET',
            credentials: 'include',
        });
        if (!res.ok) {
            console.error('Failed to fetch CSRF cookie:', res.status, res.statusText);
        } else {
            console.log('CSRF cookie fetch successful');
        }
    } catch (error) {
        console.error('Error fetching CSRF cookie:', error);
    }
function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    console.error('CSRF token not found in cookies.');
    return null;
}

  // Notification utility
  function showNotification(message, bgClass) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-6 right-6 ${bgClass} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 7000);
  }

  // 🌙 Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  if (themeToggle) {
    const themeIcon = themeToggle.querySelector('i');
    themeToggle.addEventListener('click', () => {
      if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        if (themeIcon) {
          themeIcon.classList.remove('fa-sun');
          themeIcon.classList.add('fa-moon');
        }
        localStorage.setItem('theme', 'light');
      } else {
        body.classList.add('dark-theme');
        if (themeIcon) {
          themeIcon.classList.remove('fa-moon');
          themeIcon.classList.add('fa-sun');
        }
        localStorage.setItem('theme', 'dark');
      }
    });
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' && themeIcon) {
      body.classList.add('dark-theme');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    }
  }

  // 📱 Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 🛒 Cart Functionality
  let cart = [];
  const cartBtn = document.getElementById('cart-btn');
  const cartModal = document.getElementById('cart-modal');
  const closeCart = document.getElementById('close-cart');
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartSummary = document.getElementById('cart-summary');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTax = document.getElementById('cart-tax');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  async function fetchCartFromAPI() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/cart/', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      cart = await res.json();
      updateCartCount();
      updateCartDisplay();
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      showNotification('Failed to load cart: ' + error.message, 'bg-red-600');
    }
  }

  function updateCartCount() {
    if (cartCount) {
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      cartCount.textContent = count;
    }
  }

function updateCartDisplay() {
    if (!cartItems || !emptyCartMessage || !cartSummary || !cartSubtotal || !cartTax || !cartTotal) {
        console.error('Cart DOM elements missing');
        return;
    }
    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartSummary.classList.add('hidden');
        emptyCartMessage.classList.remove('hidden');
        emptyCartMessage.innerHTML = `
            <div class="text-center py-10 text-gray-600 dark:text-gray-400">
                <i class="fas fa-shopping-cart text-4xl mb-4"></i>
                <p class="text-lg font-medium mb-4">Your cart is empty.</p>
                <a href="index.html" class="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Continue Shopping
                </a>
            </div>`;
        return;
    }

    emptyCartMessage.classList.add('hidden');
    cartSummary.classList.remove('hidden');
    let subtotal = 0;
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700';
      cartItem.innerHTML = `
        <div class="flex items-center">
          <img src="${item.image_url}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg mr-4">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">${item.name}</h4>
            <p class="text-gray-600 dark:text-gray-300">₹${item.price.toLocaleString()}</p>
            <p class="text-gray-600 dark:text-gray-300">Qty: ${item.quantity}</p>
          </div>
        </div>
        <div class="flex items-center">
          <button class="remove-item ml-4 text-red-500 dark:text-red-400" data-id="${item.product_id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>`;
      cartItems.appendChild(cartItem);
      cartItem.querySelector('.remove-item').addEventListener('click', async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/cart/?product_id=${item.product_id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          await fetchCartFromAPI();
          showNotification(`${item.name} removed from cart`, 'bg-green-600');
        } catch (error) {
          console.error('Failed to remove item:', error);
          // showNotification('Failed to remove item: ' + error.message, 'bg-red-600');
        }
      });
    });
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + tax;
    cartSubtotal.textContent = `₹${subtotal.toLocaleString()}`;
    cartTax.textContent = `₹${tax.toLocaleString()}`;
    cartTotal.textContent = `₹${totalAmount.toLocaleString()}`;
  }
async function addToCart(id, name, price, image) {
    if (!id || !name || isNaN(price) || !image) {
        console.error('Invalid product data:', { id, name, price, image });
        showNotification('Invalid product data.', 'bg-red-600');
        return;
    }
    try {
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            console.error('CSRF token missing');
            showNotification('Failed to add item: CSRF token missing.', 'bg-red-600');
            return;
        }
        const payload = { product_id: id, name, price: parseFloat(price), quantity: 1, image_url: image };
        console.log('Sending POST to /api/cart/ with payload:', payload);
        const res = await fetch('/api/cart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${data.detail || data.error || data.message || res.statusText}`);
        }
        await fetchCartFromAPI();
        showNotification(`${name} added to cart`, 'bg-green-600');
    } catch (error) {
        console.error('Add to cart failed:', error.message);
        showNotification(`Failed to add item: ${error.message}`, 'bg-red-600');
    }
}

// Remove from Cart
async function removeFromCart(productId) {
    if (!productId) {
        console.error('Invalid product ID:', productId);
        showNotification('Invalid product ID.', 'bg-red-600');
        return;
    }
    try {
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            showNotification('Failed to remove item: CSRF token missing.', 'bg-red-600');
            return;
        }
        const res = await fetch(`/api/cart/?product_id=${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${data.detail || data.error || data.message || res.statusText}`);
        }
        await fetchCartFromAPI();
        showNotification('Item removed from cart', 'bg-green-600');
    } catch (error) {
        console.error('Remove from cart failed:', error.message);
        showNotification(`Failed to remove item: ${error.message}`, 'bg-red-600');
    }
}

// Update other fetch calls (e.g., login, logout, fetchCartFromAPI) to use relative URLs
async function fetchCartFromAPI() {
    try {
        const res = await fetch('/api/cart/', {
            credentials: 'include',
        });
        cart = await res.json();
        updateCartCount();
        updateCartDisplay();
    } catch (error) {
        console.error('Failed to fetch cart:', error);
    }
}


  if (cartBtn && cartModal && closeCart) {
    cartBtn.addEventListener('click', () => {
      cartModal.style.display = 'flex';
      fetchCartFromAPI();
    });
    closeCart.addEventListener('click', () => {
      cartModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
      if (event.target === cartModal) {
        cartModal.style.display = 'none';
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (cart.length === 0) {
        showNotification('Your cart is empty', 'bg-red-600');
        return;
      }
      let currentUser;
      try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
      } catch {
        showNotification('Please login to continue', 'bg-red-600');
        cartModal.style.display = 'none';
        loginModal.style.display = 'flex';
        return;
      }
      if (!currentUser) {
        showNotification('Please login to continue', 'bg-red-600');
        cartModal.style.display = 'none';
        loginModal.style.display = 'flex';
        return;
      }
      try {
        const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        const totalAmount = subtotal + subtotal * 0.18;
        const res = await fetch('http://127.0.0.1:8000/api/orders/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ items: JSON.stringify(cart), total: totalAmount }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        showNotification(`Order placed! Order ID: ${data.id}`, 'bg-green-600');
        await fetchCartFromAPI();
        cartModal.style.display = 'none';
      } catch (error) {
        console.error('Failed to place order:', error);
        showNotification('Failed to place order: ' + error.message, 'bg-red-600');
      }
    });
  }

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');
      const price = parseInt(button.getAttribute('data-price'), 10);
      const image = button.getAttribute('data-image');
      console.log('Add to cart button clicked:', { id, name, price, image });
      addToCart(id, name, price, image);
    });
  });

  // 🔐 Account Functionality
  const accountBtn = document.getElementById('account-btn');
  const loginModal = document.getElementById('login-modal');
  const closeLogin = document.getElementById('close-login');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const accountInfo = document.getElementById('account-info');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userPhone = document.getElementById('user-phone');

  function checkLogin() {
    let currentUser;
    try {
      currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch {
      console.warn('Invalid currentUser in localStorage');
    }
    if (currentUser && loginForm && registerForm && accountInfo) {
      loginForm.classList.add('hidden');
      registerForm.classList.add('hidden');
      accountInfo.classList.remove('hidden');
      if (userName) userName.textContent = currentUser.username || 'N/A';
      if (userEmail) userEmail.textContent = currentUser.email || 'N/A';
      if (userPhone) userPhone.textContent = currentUser.phone || 'N/A';
    } else if (loginForm && registerForm && accountInfo) {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      accountInfo.classList.add('hidden');
    }
  }

  if (accountBtn && loginModal) {
    accountBtn.addEventListener('click', () => {
      loginModal.style.display = 'flex';
      checkLogin();
    });
  }

  if (closeLogin && loginModal) {
    closeLogin.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  if (showRegister && loginForm && registerForm) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });
  }

  if (showLogin && loginForm && registerForm) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });
  }

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        if (!username || !password) {
            console.error('Missing login fields:', { username, password });
            showNotification('Please fill in both username and password.', 'bg-red-600');
            return;
        }
        try {
            const csrfToken = getCSRFToken();
            if (!csrfToken) {
                console.error('CSRF token missing');
                // showNotification('Failed to login: CSRF token missing.', 'bg-red-600');
                return;
            }
            console.log('Sending POST to /api/login/ with:', { username });
            const res = await fetch('/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${data.error || data.message || res.statusText}`);
            }
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            checkLogin();
            showNotification(`Welcome back, ${data.user.username}`, 'bg-green-600');
            loginModal.style.display = 'none';
        } catch (error) {
            console.error('Login failed:', error.message);
            // showNotification(`Failed to login: ${error.message}`, 'bg-red-600');
        }
    });
}
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(), // Add CSRF token
                },
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionCart'); // Clear session cart
            cart = []; // Clear frontend cart
            updateCartCount();
            updateCartDisplay();
            checkLogin();
            showNotification('Logged out successfully', 'bg-green-600');
            loginModal.style.display = 'none';
        } catch (error) {
            console.error('Logout failed:', error);
            // showNotification('Logout failed: ' + error.message, 'bg-red-600');
        }
    });
}

  // 🧠 Category Filtering
  const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
  const categoryCards = document.querySelectorAll('.category-card');
  const products = document.querySelectorAll('.product-card');

  if (categoryFilterBtns.length && products.length) {
    categoryFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        categoryFilterBtns.forEach(b => {
          b.classList.remove('bg-blue-600', 'text-white');
          b.classList.add('bg-gray-200', 'text-gray-800');
        });
        btn.classList.remove('bg-gray-200', 'text-gray-800');
        btn.classList.add('bg-blue-600', 'text-white');
        products.forEach(product => {
          product.style.display = (filter === 'all' || product.getAttribute('data-category') === filter) ? '' : 'none';
        });
      });
    });
  }

  if (categoryCards.length) {
    categoryCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const category = card.getAttribute('data-category');
        categoryFilterBtns.forEach(btn => {
          if (btn.getAttribute('data-filter') === category) {
            btn.click();
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    });
  }

  // 🔍 Search Functionality
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchFormMobile = document.getElementById('search-form-mobile');
  const searchInputMobile = searchFormMobile?.querySelector('input');

  function performSearch(query) {
    if (!products.length) return;
    query = query.toLowerCase().trim();
    products.forEach(product => {
      const productName = product.querySelector('h3')?.textContent.toLowerCase() || '';
      const productDesc = product.querySelector('p')?.textContent.toLowerCase() || '';
      product.style.display = (!query || productName.includes(query) || productDesc.includes(query)) ? '' : 'none';
    });
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    categoryFilterBtns.forEach(btn => {
      btn.classList.toggle('bg-blue-600', btn.getAttribute('data-filter') === 'all');
      btn.classList.toggle('text-white', btn.getAttribute('data-filter') === 'all');
      btn.classList.toggle('bg-gray-200', btn.getAttribute('data-filter') !== 'all');
      btn.classList.toggle('text-gray-800', btn.getAttribute('data-filter') !== 'all');
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch(searchInput.value);
    });
  }

  if (searchFormMobile && searchInputMobile) {
    searchFormMobile.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch(searchInputMobile.value);
      mobileMenu?.classList.add('hidden');
    });
  }

  // Initialize
  fetchCartFromAPI();
  checkLogin();
});