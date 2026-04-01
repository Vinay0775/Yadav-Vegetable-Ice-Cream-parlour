// Ensure catalog is loaded
let CATALOG = (typeof YADAV_CATALOG !== 'undefined') ? [...YADAV_CATALOG] : [];
window.CATALOG = CATALOG;
window.userWishlist = []; // Global Wishlist cache

// ==========================================
// INJECT PWA MANIFEST & SERVICE WORKER
// ==========================================
const manifestLink = document.createElement('link');
manifestLink.rel = 'manifest';
manifestLink.href = 'manifest.json';
document.head.appendChild(manifestLink);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => console.log('SW setup failed', err));
    });
}

// ==========================================
// GLOBAL SETTINGS LISTENER (SEO & MAINTENANCE)
// ==========================================
if(window.db) {
    window.db.collection('settings').doc('global').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            
            // Apply Dynamic SEO
            if(data.seoTitle && document.title.indexOf('Admin') === -1) {
                document.title = data.seoTitle;
            }
            if(data.seoDesc) {
                let meta = document.querySelector('meta[name="description"]');
                if(!meta) {
                    meta = document.createElement('meta');
                    meta.name = "description";
                    document.head.appendChild(meta);
                }
                meta.content = data.seoDesc;
            }

            // Apply Maintenance Mode
            // if maintenanceMode == true and not on admin.html
            const isAdminPage = window.location.pathname.includes('admin.html');
            if(data.maintenanceMode && !isAdminPage) {
                // Must be Superadmin or Staff to bypass
                const checkBypass = async () => {
                   const currentUser = window.auth.currentUser;
                   if (currentUser && currentUser.email === 'hyadav1317@gmail.com') return;
                   
                   if (currentUser) {
                       try {
                           const staffDoc = await window.db.collection('roles').doc(currentUser.email).get();
                           if(staffDoc.exists) return; // Staff bypasses maintenance
                       } catch(e){}
                   }
                   
                   // Not authorized => Show strict maintenance screen
                   document.body.innerHTML = `
                    <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f9fa;text-align:center;font-family:sans-serif;padding:2rem;">
                        <div>
                            <h1 style="color:#198754;font-size:3rem;margin-bottom:1rem;">🚧 We'll be back soon!</h1>
                            <p style="color:#6c757d;font-size:1.2rem;">Yadav Vegetable & Ice-Cream Parlour is currently undergoing scheduled maintenance to improve your experience.</p>
                        </div>
                    </div>`;
                };
                checkBypass();
            }
        }
    });
}

// ==========================================
// FIREBASE COMPAT INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDtab1OSC2Vahk4yaS_QnjEm0OmDuq8wmQ",
    authDomain: "yadav-vegetable-icecream.firebaseapp.com",
    projectId: "yadav-vegetable-icecream",
    storageBucket: "yadav-vegetable-icecream.firebasestorage.app",
    messagingSenderId: "79124859474",
    appId: "1:79124859474:web:c92c4431c2e37e3ffc6d8b",
    measurementId: "G-ZK21BXH2M3"
};

// Initialize Firebase only if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
window.auth = firebase.auth();
window.db = firebase.firestore();

// Wishlist Function
window.toggleWishlist = async function(prodId) {
    if(!currentUser) {
        window.showToast("Wait!", "Please login to save to favorites", true);
        window.location.href = "login.html";
        return;
    }
    const r = window.db.collection('users').doc(currentUser.uid).collection('wishlist').doc(prodId);
    if(window.userWishlist.includes(prodId)) {
        await r.delete();
        window.showToast("Removed", "Removed from favorites!");
    } else {
        await r.set({ added: new Date().toISOString() });
        window.showToast("Saved", "Added to favorites! ❤️");
    }
};

document.addEventListener('DOMContentLoaded', () => {

    
    // Preloader fadeout logic
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.getElementById('premiumPreloader');
            if(preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.style.display = 'none', 500);
            }
        }, 800);
    });

    // Random Fake Purchase Toasts for premium active feel (Trigger every 45s)
    setInterval(() => {
        const names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali"];
        const products = ["Organic Broccoli", "Vanilla Strawberry Sundae", "Fresh Red Tomatoes", "Dark Choco Cone", "Farm Fresh Apples", "Pure Dairy Milk"];
        const cities = ["Jaipur", "Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme"];
        const name = names[Math.floor(Math.random()*names.length)];
        const product = products[Math.floor(Math.random()*products.length)];
        const city = cities[Math.floor(Math.random()*cities.length)];
        if(window.showToast && !document.hidden && document.visibilityState === 'visible') {
            window.showToast("🛒 Live Purchase", `${name} from ${city} just bought ${product}!`);
        }
    }, 45000);
// ==========================================
    // HYBRID CATALOG FETCH
    // ==========================================
    if (window.db) {
        window.db.collection('products').get().then(snapshot => {
            snapshot.forEach(doc => {
                const p = doc.data(); p.id = doc.id;
                window.CATALOG.push(p);
            });
            if(document.getElementById('productGrid') && typeof window.renderDynamicGrid === 'function') {
                const q = localStorage.getItem('yadavSearchQuery');
                if(new URLSearchParams(window.location.search).get('search') === 'true' && q) {
                    window.renderDynamicGrid(1, q, localStorage.getItem('yadavSearchCat'));
                } else {
                    window.renderDynamicGrid();
                }
            }
        });
    }

    // ==========================================
    // 0. GLOBAL DYNAMIC UI INJECTION & PRELOADER
    // ==========================================
    const dynamicUIHTML = `
        <!-- Preloader -->
        <div id="premiumPreloader" class="premium-preloader">
            <div class="loader-content">
                <img src="assets/images/app_logo.png" alt="Yadav Store" class="loader-img mb-3 fade-pulse">
                <div class="spinner-border text-success" role="status"></div>
                <h5 class="fw-bold mt-3 text-dark tracking-wide">YADAV STORE</h5>
            </div>
        </div>
        
        <!-- Toast Container -->
        <div class="toast-container-global" id="globalToastContainer"></div>
        
        <!-- Live Search Dropdown -->
        <div class="live-search-dropdown" id="liveSearchDropdown"></div>

        <!-- Side Cart Drawer -->
        <div class="side-cart-overlay" id="sideCartOverlay"></div>
        <div class="side-cart-drawer" id="sideCartDrawer">
            <div class="side-cart-header">
                <h5 class="mb-0 fw-bold">Your Cart <span id="sideCartCount" class="badge bg-success ms-2">0</span></h5>
                <button class="btn-close" id="sideCartCloseBtn"></button>
            </div>
            <div class="side-cart-body" id="sideCartBody"></div>
            <div class="side-cart-footer">
                <div class="d-flex justify-content-between mb-3"><span class="fw-bold">Total (incl. Tax)</span><span class="fs-5 fw-bold text-success" id="sideCartTotal">₹0</span></div>
                <a href="cart.html" class="btn btn-outline-success w-100 mb-2 rounded-pill fw-medium">View Cart Page</a>
                <a href="payment.html" class="btn btn-success w-100 rounded-pill fw-medium">Checkout Now</a>
            </div>
        </div>
    `;
    const uiWrapper = document.createElement('div');
    uiWrapper.innerHTML = dynamicUIHTML;
    document.body.appendChild(uiWrapper);

    window.showToast = function(title, msg, isError = false) {
        const container = document.getElementById('globalToastContainer');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `styled-toast ${isError ? 'toast-error' : ''}`;
        toast.innerHTML = `<i class="bi bg-white ${isError ? 'bi-x-circle-fill' : 'bi-check-circle-fill'}"></i>
                           <div><p class="toast-title">${title}</p><p class="toast-msg">${msg}</p></div>`;
        container.appendChild(toast);
        // Animate in
        requestAnimationFrame(() => toast.classList.add('show'));
        // Animate out
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 3000);
    };

    // ==========================================
    // 1. STICKY NAVBAR LOGIC
    // ==========================================
    const navbar = document.getElementById('mainNavbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // ==========================================
    // 2. FIREBASE AUTH STATE (Global Header Updates)
    // ==========================================
    let currentUser = null;

    window.auth.onAuthStateChanged((user) => {
        const loginIconLinks = document.querySelectorAll('a[href="login.html"]');
        if (user) {
            currentUser = user;
            
            // Sync Wishlist collection
            window.db.collection('users').doc(user.uid).collection('wishlist').onSnapshot(snap => {
                window.userWishlist = snap.docs.map(d => d.id);
                document.querySelectorAll('.wishlist-btn').forEach(b => {
                    if (window.userWishlist.includes(b.dataset.id)) b.classList.add('active');
                    else b.classList.remove('active');
                });
            });

            // The user is fully logged in, survive page reloads!
            // Change "Login" icons to go to Profile
            loginIconLinks.forEach(link => {
                link.href = 'profile.html';
                link.title = 'My Profile';
                link.innerHTML = '<i class="bi bi-person-check-fill text-success"></i>';
            });
            // Show Orders tab on Desktop
            const ordersIcon = document.querySelector('a[href="orders.html"]');
            if (ordersIcon) ordersIcon.classList.remove('d-none');

            // Inject Admin Portal Link icon for Owner / Staff
            const headerIconsContainer = document.querySelector('.header-icons');
            if (headerIconsContainer && document.getElementById('adminPortalLink') === null) {
                // Check if admin or staff
                const checkAdmin = async () => {
                   if (user.email === 'hyadav1317@gmail.com') return true;
                   try {
                       const staffDoc = await window.db.collection('roles').doc(user.email).get();
                       return staffDoc.exists;
                   } catch(e){ return false; }
                };
                
                checkAdmin().then(isAdmin => {
                    if (isAdmin) {
                        const adminLink = document.createElement('a');
                        adminLink.href = 'admin.html';
                        adminLink.id = 'adminPortalLink';
                        adminLink.className = 'text-dark text-decoration-none fs-5 icon-link position-relative d-block me-2';
                        adminLink.title = 'Admin Panel';
                        adminLink.innerHTML = '<i class="bi bi-shield-lock-fill text-danger fs-4 drop-shadow-img" style="filter: drop-shadow(0px 2px 5px rgba(220,53,69,0.5));"></i>';
                        // Prepend before the profile icon
                        headerIconsContainer.insertBefore(adminLink, headerIconsContainer.firstChild);
                    }
                });
            }

            // Sync user session details for local quick access if needed
            localStorage.setItem('yadavSession', JSON.stringify({
                name: user.displayName || 'User',
                email: user.email,
                uid: user.uid
            }));

        } else {
            currentUser = null;
            localStorage.removeItem('yadavSession');
            // Revert headers
            loginIconLinks.forEach(link => {
                link.href = 'login.html';
                link.title = 'Login/Profile';
                link.innerHTML = '<i class="bi bi-person"></i>';
            });
            const ordersIcon = document.querySelector('a[href="orders.html"]');
            if (ordersIcon) ordersIcon.classList.add('d-none');
            // Remove Admin link if present
            const adminLink = document.getElementById('adminPortalLink');
            if (adminLink) adminLink.remove();
        }
    });

    window.logoutGlobal = function () {
        window.auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch(err => console.error(err));
    };


    // ==========================================
    // 3. CART MANAGEMENT (LOCALSTORAGE)
    // ==========================================
    let cart = JSON.parse(localStorage.getItem('yadavCart')) || [];

    function saveCart() {
        localStorage.setItem('yadavCart', JSON.stringify(cart));
    }

    function updateCartBadges() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadges = document.querySelectorAll('.cart-total-badge');
        cartBadges.forEach(badge => {
            badge.innerText = totalItems;
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => badge.style.transform = 'scale(1)', 200);
        });
    }

    window.addToCartGlobal = function (productStr) {
        try {
            const product = JSON.parse(decodeURIComponent(productStr));
            const existing = cart.find(item => item.id === product.id || item.title === product.title);
            if (existing) existing.quantity += (product.quantity || 1);
            else cart.push({ ...product, quantity: product.quantity || 1 });

            saveCart();
            updateCartBadges();
            if (typeof renderCartPage === 'function') renderCartPage();
            if (typeof renderSideCart === 'function') renderSideCart();
            
            // Replaced default alert/silence with Toast
            window.showToast('Success', `${product.title} added to cart!`);
        } catch (e) {
            console.error("Error adding to cart", e);
            if(window.showToast) window.showToast('Error', 'Could not add to cart.', true);
        }
    }

    updateCartBadges();

    // ==========================================
    // 3.5 SIDE CART DRAWER LOGIC
    // ==========================================
    const sideOverlay = document.getElementById('sideCartOverlay');
    const sideDrawer = document.getElementById('sideCartDrawer');
    const sideClose = document.getElementById('sideCartCloseBtn');
    
    function toggleSideCart(show) {
        if(show) {
            sideOverlay.classList.add('show');
            sideDrawer.classList.add('open');
            renderSideCart();
        } else {
            sideOverlay.classList.remove('show');
            sideDrawer.classList.remove('open');
        }
    }
    if(sideOverlay && sideClose) {
        sideOverlay.addEventListener('click', () => toggleSideCart(false));
        sideClose.addEventListener('click', () => toggleSideCart(false));
    }

    // Intercept cart icon clicks to open Drawer instead of navigating (except on cart/checkout pages)
    document.querySelectorAll('a[href="cart.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const loc = window.location.pathname;
            if(!loc.includes('cart.html') && !loc.includes('payment.html')) {
                e.preventDefault();
                toggleSideCart(true);
            }
        });
    });

    window.renderSideCart = function() {
        const bodyEl = document.getElementById('sideCartBody');
        const countEl = document.getElementById('sideCartCount');
        const totalEl = document.getElementById('sideCartTotal');
        if(!bodyEl) return;

        let totalItems = cart.reduce((s, i) => s + i.quantity, 0);
        countEl.innerText = totalItems;

        if (cart.length === 0) {
            bodyEl.innerHTML = '<div class="text-center text-muted mt-5"><i class="bi bi-cart-x display-3"></i><p class="mt-3">Cart is Empty</p></div>';
            totalEl.innerText = '₹0';
            return;
        }

        let subtotal = 0;
        let html = '';
        cart.forEach((item, index) => {
            const t = item.price * item.quantity;
            subtotal += t;
            html += `
            <div class="side-cart-item mb-3 border-bottom pb-2">
                <img src="${item.image}" alt="">
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold fs-6">${item.title}</h6>
                    <div class="text-success fw-bold small">₹${item.price}</div>
                    <div class="d-flex align-items-center mt-2">
                        <button class="btn btn-sm btn-light border p-0 px-2 side-qty-btn" data-idx="${index}" data-change="-1">-</button>
                        <span class="mx-2 small fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-light border p-0 px-2 side-qty-btn" data-idx="${index}" data-change="1">+</button>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold mb-2">₹${t}</div>
                    <button class="btn btn-sm text-danger p-0 side-rem-btn" data-idx="${index}"><i class="bi bi-trash"></i></button>
                </div>
            </div>`;
        });
        bodyEl.innerHTML = html;
        const tax = subtotal * 0.05;
        totalEl.innerText = `₹${Math.ceil(subtotal + tax)}`;

        bodyEl.querySelectorAll('.side-qty-btn').forEach(btn => btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.idx);
            const chg = parseInt(this.dataset.change);
            if (cart[idx].quantity + chg <= 0) cart.splice(idx, 1);
            else cart[idx].quantity += chg;
            saveCart(); updateCartBadges(); renderSideCart();
            if (typeof renderCartPage === 'function') renderCartPage();
        }));
        bodyEl.querySelectorAll('.side-rem-btn').forEach(btn => btn.addEventListener('click', function() {
            cart.splice(parseInt(this.dataset.idx), 1);
            saveCart(); updateCartBadges(); renderSideCart();
            if (typeof renderCartPage === 'function') renderCartPage();
        }));
    }

    // ==========================================
    // 4. GLOBAL SEARCH LOGIC
    // ==========================================
    const searchInput = document.getElementById('globalSearchInput');
    const searchBtn = document.getElementById('globalSearchBtn');
    const searchCategory = document.getElementById('globalSearchCategory');

    function performSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim().toLowerCase();
        const cat = searchCategory ? searchCategory.value : 'All';

        if (query === '') return;

        localStorage.setItem('yadavSearchQuery', query);
        localStorage.setItem('yadavSearchCat', cat);

        if (!document.getElementById('productGrid')) {
            if (cat === 'Ice-Creams') window.location.href = 'ice-cream-parlour.html?search=true';
            else if (cat === 'Fruits') window.location.href = 'fresh-fruits.html?search=true';
            else window.location.href = 'fresh-veggies.html?search=true';
        } else {
            if (window.renderDynamicGrid) window.renderDynamicGrid(1, query, cat);
        }
    }

    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => { 
            if (e.key === 'Enter') performSearch(); 
        });

        // Live Search Suggestion Feature
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const searchBarContainer = document.querySelector('.search-bar');
            const dropdown = document.getElementById('liveSearchDropdown');
            
            if(!dropdown || !searchBarContainer) return;
            
            // Move dropdown physically inside search bar container if needed for absolute positioning
            if(dropdown.parentNode !== searchBarContainer) {
                searchBarContainer.style.position = 'relative';
                searchBarContainer.appendChild(dropdown);
            }

            if(query.length < 1) {
                dropdown.classList.remove('show');
                return;
            }

            const cat = searchCategory ? searchCategory.value : 'All';
            const results = window.CATALOG ? window.CATALOG.filter(p => {
                const searchStr = query.toLowerCase();
                const matchQ = p.title.toLowerCase().includes(searchStr) || 
                               p.category.toLowerCase().includes(searchStr) ||
                               (p.desc && p.desc.toLowerCase().includes(searchStr));
                const matchC = cat === 'All' || p.category === cat;
                return matchQ && matchC;
            }).slice(0, 5) : []; // Max 5 suggestions

            if(results.length > 0) {
                let html = '';
                results.forEach(r => {
                    const encodedProd = encodeURIComponent(JSON.stringify(r));
                    html += `
                        <div class="search-suggest-item" onclick="if(window.openModalFromData) { document.getElementById('liveSearchDropdown').classList.remove('show'); window.openModalFromData('${encodedProd}'); }">
                            <img src="${r.image}" alt="">
                            <div>
                                <h6 class="mb-0 fw-bold fs-6 text-dark">${r.title}</h6>
                                <span class="text-success small fw-medium">₹${r.price}</span>
                            </div>
                        </div>
                    `;
                });
                dropdown.innerHTML = html;
                dropdown.classList.add('show');
            } else {
                dropdown.innerHTML = '<div class="p-3 text-muted small text-center">No matching products found</div>';
                dropdown.classList.add('show');
            }
        });

        // Close dropdown when clicked outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('liveSearchDropdown');
            if(dropdown && !e.target.closest('.search-bar')) {
                dropdown.classList.remove('show');
            }
        });
    }


    // ==========================================
    // 5. DYNAMIC CATALOG RENDERING 
    // ==========================================
    const gridEl = document.getElementById('productGrid');
    if (gridEl) {
        const ITEMS_PER_PAGE = 8;
        let currentPage = 1;
        let currentSort = 'default';
        let currentMaxPrice = 9999;
        let currentSubCat = 'All';
        const pageMainCategory = gridEl.dataset.catalogCategory || 'All';
        const paginationNav = document.getElementById('paginationNav');
        const resultsCount = document.getElementById('resultsCount');

        window.renderDynamicGrid = function (page = 1, searchQuery = null, searchCat = 'All') {
            currentPage = page;
            gridEl.innerHTML = '';

            let filteredList = CATALOG.filter(p => pageMainCategory === 'All' || p.category === pageMainCategory);

            if (searchQuery) {
                const searchStr = searchQuery.toLowerCase();
                filteredList = CATALOG.filter(p => {
                    const matchQ = p.title.toLowerCase().includes(searchStr) || 
                                   p.category.toLowerCase().includes(searchStr) ||
                                   (p.desc && p.desc.toLowerCase().includes(searchStr));
                    const matchC = searchCat === 'All' || p.category === searchCat;
                    return matchQ && matchC;
                });
                document.querySelectorAll('.filter-category-checkbox').forEach(cb => cb.checked = false);
            } else {
                if (currentSubCat !== 'All') {
                    filteredList = filteredList.filter(p => p.subCategory === currentSubCat || p.category === currentSubCat);
                }
                filteredList = filteredList.filter(p => p.price <= currentMaxPrice);
            }

            if (currentSort === 'price-asc') filteredList.sort((a, b) => a.price - b.price);
            else if (currentSort === 'price-desc') filteredList.sort((a, b) => b.price - a.price);
            else if (currentSort === 'rating') filteredList.sort((a, b) => b.rating - a.rating);

            const totalItems = filteredList.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
            const pageItems = filteredList.slice(startIndex, endIndex);

            if (resultsCount) resultsCount.innerText = `Showing ${startIndex + (totalItems > 0 ? 1 : 0)}–${endIndex} of ${totalItems} results`;

            if (pageItems.length === 0) {
                gridEl.innerHTML = '<div class="col-12 py-5 text-center text-muted"><h4>No products found!</h4><button class="btn btn-outline-success mt-3" onclick="window.location.reload()">Clear Filters</button></div>';
            } else {
                pageItems.forEach(prod => {
                    const isPink = prod.category === 'Ice-Creams';
                    const colorClass = isPink ? 'pink' : 'success';
                    const bgClass = isPink ? 'bg-light-pink' : 'bg-light-green';
                    let badgeHtml = prod.badge ? `<div class="badge bg-${colorClass === 'pink' ? 'danger' : 'success'} position-absolute top-0 start-0 m-3 z-index-2">${prod.badge}</div>` : '';
                    let originalStr = prod.originalPrice ? `<span class="text-muted text-decoration-line-through small me-2">₹${prod.originalPrice}</span>` : '';
                    let starsHtml = '';
                    for (let i = 1; i <= 5; i++) {
                        if (i <= Math.floor(prod.rating)) starsHtml += '<i class="bi bi-star-fill"></i>';
                        else if (i - 0.5 === prod.rating) starsHtml += '<i class="bi bi-star-half"></i>';
                        else starsHtml += '<i class="bi bi-star"></i>';
                    }
                    const prodJson = encodeURIComponent(JSON.stringify(prod));

                    gridEl.innerHTML += `
                    <div class="col-sm-6 col-md-4 col-xl-3">
                        <div class="card product-card fade-up-custom border-0 ${bgClass} h-100 shadow-sm rounded-4">
                            ${badgeHtml}
                            <div class="px-4 py-4 text-center position-relative overflow-hidden product-image-wrapper">
                                <img src="${prod.image}" alt="${prod.title}" class="img-fluid object-fit-cover rounded-circle shadow-sm" style="width:140px; height:140px;">
                                <div class="product-action-overlay">
                                    <button class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift wishlist-btn ${window.userWishlist && window.userWishlist.includes(prod.id) ? 'active' : ''}" data-id="${prod.id}"><i class="bi bi-heart"></i></button>
                                    <button class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift quick-view-btn" data-prod="${prodJson}"><i class="bi bi-eye"></i></button>
                                </div>
                            </div>
                            <div class="card-body bg-white rounded-bottom-4 p-4 text-center">
                                <p class="text-muted small mb-1">${prod.category}</p>
                                <h6 class="card-title fw-bold text-dark mb-2 text-truncate" title="${prod.title}">${prod.title}</h6>
                                <div class="rating text-warning mb-2 small">${starsHtml}</div>
                                <div class="d-flex justify-content-center align-items-center mb-3">
                                    ${originalStr}
                                    <span class="fs-5 fw-bold text-${colorClass}">₹${prod.price}</span>
                                </div>
                                <button class="btn btn-outline-${colorClass} w-100 rounded-pill fw-medium dynamic-add-cart" data-prod="${prodJson}"><i class="bi bi-cart-plus me-2"></i> Add to Cart</button>
                            </div>
                        </div>
                    </div>`;
                });
            }

            if (paginationNav) {
                let pHTML = `<li class="page-item ${currentPage <= 1 ? 'disabled' : ''}"><a class="page-link border-0 text-muted mx-1" href="#" data-page="${currentPage - 1}">Prev</a></li>`;
                for (let i = 1; i <= totalPages; i++) {
                    pHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link border-0 ${i === currentPage ? 'bg-success text-white' : 'text-dark hover-lift'} rounded-circle mx-1" href="#" data-page="${i}">${i}</a></li>`;
                }
                pHTML += `<li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}"><a class="page-link border-0 text-success mx-1" href="#" data-page="${currentPage + 1}">Next</a></li>`;
                paginationNav.innerHTML = pHTML;

                paginationNav.querySelectorAll('.page-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const p = parseInt(link.dataset.page);
                        if (p && p >= 1 && p <= totalPages) {
                            renderDynamicGrid(p);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                        }
                    });
                });
            }

            gridEl.querySelectorAll('.dynamic-add-cart').forEach(btn => {
                btn.dataset.bound = "true";
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.addToCartGlobal(this.dataset.prod);
                    const origHtml = this.innerHTML;
                    const origClasses = this.className;
                    this.innerHTML = '<i class="bi bi-check2-circle"></i> Added';
                    this.className = origClasses.replace('btn-outline-success', 'btn-success').replace('btn-outline-pink', 'btn-pink');
                    setTimeout(() => { this.innerHTML = origHtml; this.className = origClasses; }, 1000);
                });
            });

            gridEl.querySelectorAll('.quick-view-btn').forEach(btn => {
                btn.dataset.bound = "true";
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.openModalFromData(this.dataset.prod);
                });
            });
        };

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; renderDynamicGrid(1); });

        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                currentMaxPrice = e.target.value;
                document.getElementById('priceValueDisplay').innerText = `₹${currentMaxPrice}`;
            });
            priceRange.addEventListener('change', () => { renderDynamicGrid(1); });
        }

        document.querySelectorAll('.filter-category-checkbox').forEach(radio => {
            radio.addEventListener('change', (e) => { currentSubCat = e.target.value; renderDynamicGrid(1); });
        });

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('search') === 'true' && localStorage.getItem('yadavSearchQuery')) {
            renderDynamicGrid(1, localStorage.getItem('yadavSearchQuery'), localStorage.getItem('yadavSearchCat'));
        } else {
            renderDynamicGrid();
        }
    }


    // ==========================================
    // 6. GLOBAL PRODUCT MODAL LOGIC
    // ==========================================
    const modal = document.getElementById('productModal');
    if (modal) {
        window.openModalFromData = function (prodJsonStr) {
            try {
                const data = JSON.parse(decodeURIComponent(prodJsonStr));
                document.getElementById('modalProductImage').src = data.image;
                document.getElementById('modalProductTitle').innerText = data.title;
                document.getElementById('modalProductDesc').innerText = data.desc || `Fresh and high quality direct from Yadav Store.`;
                document.getElementById('modalProductPrice').innerText = `₹${data.price}`;
                document.getElementById('modalProductQty').value = 1;

                // REVIEWS INJECTION
                let reviewsContainer = document.getElementById('modalReviewsBox');
                if (!reviewsContainer) { 
                    const descParent = document.getElementById('modalProductDesc').parentNode;
                    reviewsContainer = document.createElement('div');
                    reviewsContainer.id = 'modalReviewsBox';
                    reviewsContainer.className = 'mt-3 border-top pt-3 text-start';
                    descParent.appendChild(reviewsContainer);
                }
                
                reviewsContainer.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold mb-0 text-success"><i class="bi bi-star-half me-1"></i> Reviews</h6>
                        <button class="btn btn-sm btn-outline-success rounded-pill px-3 py-1" onclick="document.getElementById('reviewFormWrap').classList.toggle('d-none')">Write</button>
                    </div>
                    <div id="reviewFormWrap" class="d-none bg-light p-3 rounded-4 mb-3 shadow-sm border">
                        <input type="text" id="revName" class="form-control form-control-sm mb-2 shadow-none" placeholder="Your Name" ${currentUser ? `value="${currentUser.displayName || ''}"` : ''}>
                        <div class="mb-2">
                            <select id="revRating" class="form-select form-select-sm shadow-none text-warning fw-bold">
                                <option value="5" selected>⭐⭐⭐⭐⭐ (5/5)</option>
                                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                                <option value="3">⭐⭐⭐ (3/5)</option>
                                <option value="2">⭐⭐ (2/5)</option>
                                <option value="1">⭐ (1/5)</option>
                            </select>
                        </div>
                        <textarea id="revText" class="form-control form-control-sm mb-2 shadow-none" rows="2" placeholder="Your review..."></textarea>
                        <button class="btn btn-success btn-sm w-100 rounded-pill" onclick="window.submitReview('${data.id}')">Submit Review</button>
                    </div>
                    <div id="reviewsList" class="small" style="max-height: 150px; overflow-y: auto;">
                        <div class="text-center text-muted py-2"><div class="spinner-border spinner-border-sm text-success"></div></div>
                    </div>
                `;
                
                if(window.fetchReviews) window.fetchReviews(data.id);

                const btn = document.getElementById('modalAddToCartBtn');
                btn.className = `btn btn-${data.category === 'Ice-Creams' ? 'pink' : 'success'} px-5 rounded-pill fw-bold hover-lift`;

                btn.onclick = () => {
                    window.addToCartGlobal(encodeURIComponent(JSON.stringify({ ...data, quantity: parseInt(document.getElementById('modalProductQty').value) || 1 })));
                    closeModal();
                    // Alert replaced by Toast inside addToCartGlobal!
                };

                modal.classList.remove('d-none');
                setTimeout(() => { modal.classList.add('show'); document.body.classList.add('modal-open'); }, 10);
            } catch (e) { console.error(e); }
        }

        window.submitReview = async function(pid) {
            if(!window.db) return;
            const name = document.getElementById('revName').value.trim();
            const rating = parseInt(document.getElementById('revRating').value);
            const text = document.getElementById('revText').value.trim();
            if(!name || !text) { if(window.showToast) window.showToast('Validation Failed', 'Name and review text required', true); return; }
            
            try {
                await window.db.collection('reviews').add({ productId: pid, name: name, rating: rating, text: text, date: new Date().toISOString() });
                document.getElementById('revText').value = '';
                document.getElementById('reviewFormWrap').classList.add('d-none');
                if(window.showToast) window.showToast('Success', 'Review added for everyone to see!');
            } catch(e) { if(window.showToast) window.showToast('Error', e.message, true); }
        };

        window.fetchReviews = function(pid) {
            if(!window.db) return;
            window.db.collection('reviews').where('productId', '==', pid).onSnapshot(snap => {
                const listEl = document.getElementById('reviewsList');
                if(!listEl) return;
                if(snap.empty) { listEl.innerHTML = '<span class="text-muted d-block text-center mt-3">No reviews yet. Be the first!</span>'; return; }
                let html = '';
                // Since firestore requires an index for orderBy combined with where(), we sort client side
                let sortedDocs = snap.docs.map(d=>d.data()).sort((a,b)=> new Date(b.date) - new Date(a.date));
                sortedDocs.forEach(r => {
                    let stars = ''; for(let i=0;i<r.rating;i++) stars+='⭐';
                    html += `<div class="review-item p-3 mb-2 rounded-3 border-0 shadow-sm bg-white">
                        <div class="d-flex justify-content-between align-items-center mb-1"><span class="fw-bold text-dark">${r.name}</span><span style="font-size:0.6rem">${stars}</span></div>
                        <p class="text-muted mb-0" style="font-size:0.85rem">${r.text}</p>
                    </div>`;
                });
                listEl.innerHTML = html;
            });
        };
        function closeModal() {
            modal.classList.remove('show'); document.body.classList.remove('modal-open');
            setTimeout(() => { modal.classList.add('d-none'); }, 300);
        }
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    }

    // ==========================================
    // 6.5 CUSTOM ORDER REVIEW MODAL
    // ==========================================
    window.openOrderReviewModal = function(productId, productNameEnc) {
        if(!currentUser) {
            window.showToast("Wait", "Please log in to leave a review.", true);
            return;
        }
        const productName = unescape(productNameEnc);
        const existingModal = document.getElementById('customReviewModal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
        <div id="customReviewModal" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style="background: rgba(0,0,0,0.5); z-index: 10005; backdrop-filter: blur(5px);">
            <div class="bg-white p-4 rounded-4 shadow-lg text-center position-relative" style="max-width: 450px; width: 90%; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <button class="btn-close position-absolute top-0 end-0 m-3 shadow-none" onclick="document.getElementById('customReviewModal').remove()"></button>
                <div class="mb-3">
                    <i class="bi bi-star-fill text-warning" style="font-size: 3rem;"></i>
                </div>
                <h4 class="fw-bold text-dark mb-1">Rate Your Purchase</h4>
                <p class="text-muted small mb-4">How was the <strong>\${productName}</strong>?</p>
                
                <div class="star-rating-custom text-muted mb-3 d-flex justify-content-center gap-2" id="orderRevStars">
                    <i class="bi bi-star-fill text-warning active" data-val="1"></i>
                    <i class="bi bi-star-fill text-warning active" data-val="2"></i>
                    <i class="bi bi-star-fill text-warning active" data-val="3"></i>
                    <i class="bi bi-star-fill text-warning active" data-val="4"></i>
                    <i class="bi bi-star-fill text-warning active" data-val="5"></i>
                </div>
                <input type="hidden" id="orderRevRating" value="5">
                
                <textarea id="orderRevText" class="form-control rounded-4 shadow-none border-success mb-3 p-3 bg-light" rows="3" placeholder="Tell us what you loved about it..."></textarea>
                
                <button class="btn btn-success w-100 rounded-pill fw-bold hover-lift py-2" id="orderRevSubmitBtn" onclick="submitOrderReview('\${productId}')">Submit Review</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Star interaction
        const stars = document.querySelectorAll('#orderRevStars i');
        stars.forEach(s => {
            s.addEventListener('click', function() {
                const val = parseInt(this.dataset.val);
                document.getElementById('orderRevRating').value = val;
                stars.forEach(st => {
                    if(parseInt(st.dataset.val) <= val) {
                        st.classList.remove('bi-star', 'text-muted');
                        st.classList.add('bi-star-fill', 'text-warning', 'active');
                    } else {
                        st.classList.remove('bi-star-fill', 'text-warning', 'active');
                        st.classList.add('bi-star', 'text-muted');
                    }
                });
            });
        });
    };

    window.submitOrderReview = async function(pid) {
        if(!window.db) return;
        const rating = parseInt(document.getElementById('orderRevRating').value);
        const text = document.getElementById('orderRevText').value.trim();
        const btn = document.getElementById('orderRevSubmitBtn');
        
        if(!text) { window.showToast('Validation', 'Please write a review message.', true); return; }
        
        btn.disabled = true;
        btn.innerText = 'Submitting...';
        
        try {
            await window.db.collection('reviews').add({ 
                productId: pid, 
                name: currentUser.displayName || 'Customer', 
                uid: currentUser.uid,
                rating: rating, 
                text: text, 
                date: new Date().toISOString() 
            });
            document.getElementById('customReviewModal').remove();
            window.showToast('Success!', 'Thank you! Your review has been submitted. 🎉');
        } catch(e) { 
            window.showToast('Error', e.message, true); 
            btn.disabled = false;
            btn.innerText = 'Submit Review';
        }
    };

    // ==========================================
    // 7. CART PAGE & PAYMENT (FIREBASE SAVING)
    // ==========================================
    const cartContainer = document.getElementById('cartContainer');
    if (cartContainer) {
        window.renderCartPage = function () {
            if (cart.length === 0) {
                cartContainer.innerHTML = '<div class="p-5 text-center text-muted"><i class="bi bi-cart-x display-1 d-block mb-3 opacity-50"></i><h4>Your cart is empty.</h4><a href="index.html" class="btn btn-success mt-3 rounded-pill px-4">Shop Now</a></div>';
                if (document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = '₹0';
                if (document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = '₹0';
                return;
            }
            let subtotal = 0;
            let html = '<div class="list-group list-group-flush">';
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                html += `
                <div class="list-group-item p-4">
                    <div class="row align-items-center">
                        <div class="col-3 col-sm-2 text-center"><img src="${item.image}" class="img-fluid rounded-circle object-fit-cover shadow-sm" style="width:60px; height:60px;"></div>
                        <div class="col-9 col-sm-4 mb-2 mb-sm-0"><h6 class="fw-bold mb-1">${item.title}</h6><span class="text-muted small">₹${item.price} each</span></div>
                        <div class="col-8 col-sm-3">
                            <div class="input-group input-group-sm rounded-pill border overflow-hidden w-100" style="max-width: 120px;">
                                <button class="btn btn-light px-3 border-0 change-qty" data-index="${index}" data-change="-1">-</button>
                                <input type="text" class="form-control border-0 text-center fw-bold bg-white" value="${item.quantity}" readonly>
                                <button class="btn btn-light px-3 border-0 change-qty" data-index="${index}" data-change="1">+</button>
                            </div>
                        </div>
                        <div class="col-4 col-sm-2 text-end"><span class="fw-bold text-dark">₹${itemTotal}</span></div>
                        <div class="col-12 col-sm-1 text-end mt-2 mt-sm-0"><button class="btn btn-sm text-danger remove-item" data-index="${index}"><i class="bi bi-trash fs-5"></i></button></div>
                    </div>
                </div>`;
            });
            html += '</div>';
            cartContainer.innerHTML = html;

            if (document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = `₹${subtotal}`;
            const tax = subtotal * 0.05;
            if (document.getElementById('cartTax')) document.getElementById('cartTax').innerText = `₹${tax.toFixed(2)}`;
            if (document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = `₹${Math.ceil(subtotal + tax)}`;

            cartContainer.querySelectorAll('.change-qty').forEach(btn => btn.addEventListener('click', function () {
                const idx = parseInt(this.dataset.index);
                const chg = parseInt(this.dataset.change);
                if (cart[idx].quantity + chg <= 0) cart.splice(idx, 1);
                else cart[idx].quantity += chg;
                saveCart(); updateCartBadges(); renderCartPage();
            }));
            cartContainer.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', function () {
                cart.splice(parseInt(this.dataset.index), 1);
                saveCart(); updateCartBadges(); renderCartPage();
            }));
        };
        renderCartPage();
    }

    const payBtn = document.getElementById('payNowBtn');
    if (payBtn) {
        let subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal + (subtotal * 0.05));

        let html = '';
        cart.forEach(item => {
            html += `<div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <div class="d-flex align-items-center"><img src="${item.image}" class="img-fluid rounded object-fit-cover shadow-sm me-3" style="width:50px; height:50px;">
                    <div><h6 class="fw-bold mb-0">${item.title}</h6><span class="text-muted small">Qty: ${item.quantity}</span></div></div>
                <span class="fw-bold">₹${item.price * item.quantity}</span></div>`;
        });
        if (document.getElementById('paymentCartItems')) document.getElementById('paymentCartItems').innerHTML = html;
        if (document.getElementById('paymentSubtotal')) document.getElementById('paymentSubtotal').innerText = `₹${subtotal}`;
        if (document.getElementById('paymentTotal')) document.getElementById('paymentTotal').innerText = `₹${total}`;
        payBtn.innerText = `Pay Now ₹${total}`;

        payBtn.addEventListener('click', async () => {
            if (cart.length === 0) {
                window.showToast('Warning', 'Your cart is empty!', true);
                return;
            }
            if (!currentUser) {
                window.showToast('Authentication', 'Please log in first to place a secured order.', true);
                setTimeout(() => window.location.href = "login.html", 1500);
                return;
            }

            payBtn.innerText = "Processing...";
            payBtn.disabled = true;

            const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const orderData = {
                id: orderId,
                uid: currentUser.uid,
                customerEmail: currentUser.email,
                customerName: currentUser.displayName || 'Customer',
                items: cart,
                totalAmount: total,
                status: 'Processing',
                date: new Date().toISOString(),
                createdAt: new Date().getTime() // For sorting easily
            };

            try {
                // Save Order globally in 'orders' collection
                await window.db.collection("orders").doc(orderId).set(orderData);

                // Add reference under user profile tracking
                await window.db.collection(`users/${currentUser.uid}/my_orders`).add({ orderId: orderId, date: orderData.date });

                window.showToast('Success!', `Payment Success! Your order ${orderId} has been placed.`);
                
                cart = [];
                saveCart();
                setTimeout(() => window.location.href = 'orders.html', 2000);
            } catch (e) {
                console.error("Order save sync error:", e);
                window.showToast('Error', 'Error placing order! Check your internet connection or DB Rules.', true);
                payBtn.innerText = `Pay Now ₹${total}`;
                payBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 8. CUSTOMER ORDERS PAGE
    // ==========================================
    const customerOrdersGrid = document.getElementById('customerOrdersGrid');
    if (customerOrdersGrid) {
        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                customerOrdersGrid.innerHTML = `
                    <div class="card border-0 shadow-sm rounded-4 mb-4 skeleton-loader" style="height: 180px;"></div>
                    <div class="card border-0 shadow-sm rounded-4 mb-4 skeleton-loader" style="height: 180px;"></div>
                    <div class="card border-0 shadow-sm rounded-4 mb-4 skeleton-loader" style="height: 180px;"></div>
                `;
                try {
                    // REAL-TIME LISTENER
                    window.db.collection("orders")
                        .where("uid", "==", user.uid)
                        .orderBy("createdAt", "desc")
                        .onSnapshot((querySnapshot) => {
                            let listHtml = '';
                            querySnapshot.forEach((docSnap) => {
                                const o = docSnap.data();
                                let itemsHtml = o.items.map(i => `<div class="d-flex align-items-center justify-content-between mb-2 w-100 pe-3"><div class="d-flex align-items-center"><img src="${i.image}" class="rounded-circle object-fit-cover shadow-sm border me-2" style="width:40px;height:40px;"><span class="small fw-medium">${i.quantity}x ${i.title}</span></div><button class="btn btn-sm btn-outline-warning rounded-pill px-3 py-0 fw-bold hover-lift" onclick="window.openOrderReviewModal('${i.id}', '${escape(i.title)}')"><i class="bi bi-star-fill text-warning me-1"></i>Review</button></div>`).join('');
                                let progWidth = "25%";
                                let sStr = o.status.toLowerCase();
                                if(sStr.includes("pack")) progWidth = "50%";
                                if(sStr.includes("ship") || sStr.includes("out")) progWidth = "75%";
                                if(sStr.includes("deliver")) progWidth = "100%";
                                let s1 = true, s2 = parseInt(progWidth)>=50, s3 = parseInt(progWidth)>=75, s4 = parseInt(progWidth)===100;

                                let trackerHtml = `
                                <div class="order-tracker mt-4">
                                    <div class="tracker-progress" style="width: ${progWidth}"></div>
                                    <div class="tracker-step ${s1 ? 'active' : ''}">
                                        <div class="tracker-icon"><i class="bi bi-cart-check"></i></div>
                                        <div class="tracker-label d-none d-sm-block">Processing</div>
                                    </div>
                                    <div class="tracker-step ${s2 ? 'active' : ''}">
                                        <div class="tracker-icon"><i class="bi bi-box-seam"></i></div>
                                        <div class="tracker-label d-none d-sm-block">Packed</div>
                                    </div>
                                    <div class="tracker-step ${s3 ? 'active' : ''}">
                                        <div class="tracker-icon"><i class="bi bi-truck"></i></div>
                                        <div class="tracker-label d-none d-sm-block">Shipped</div>
                                    </div>
                                    <div class="tracker-step ${s4 ? 'active' : ''}">
                                        <div class="tracker-icon"><i class="bi bi-house-check"></i></div>
                                        <div class="tracker-label d-none d-sm-block">Delivered</div>
                                    </div>
                                </div>`;

                                listHtml += `
                                <div class="card border-0 shadow-sm rounded-4 mb-4">
                                    <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                                        <div><span class="d-block text-muted small mb-1">Order Placed</span><h6 class="fw-bold mb-0">${new Date(o.date).toLocaleDateString()}</h6></div>
                                        <div class="text-end"><span class="d-block text-muted small mb-1">Total Amount</span><h6 class="fw-bold text-success mb-0">₹${o.totalAmount}</h6></div>
                                        <div class="text-end d-none d-md-block"><span class="d-block text-muted small mb-1">Track ID</span><h6 class="fw-bold text-primary font-monospace mb-0">${o.id}</h6></div>
                                    </div>
                                    <div class="card-body p-4">
                                        <div class="d-flex flex-wrap mb-3 border-bottom pb-3">${itemsHtml}</div>
                                        ${trackerHtml}
                                    </div>
                                </div>`;
                            });
                            customerOrdersGrid.innerHTML = listHtml || '<div class="text-center py-5 text-muted"><i class="bi bi-bag-x display-1 d-block mb-3"></i><h4>No order history found</h4><a href="index.html" class="btn btn-success mt-3 rounded-pill">Start Shopping</a></div>';
                        });
                } catch (e) {
                    // It will fail if firestore rules explicitly block access or missing composite index
                    console.error("Firebase err", e);
                    customerOrdersGrid.innerHTML = '<div class="text-center py-5 text-danger"><i class="bi bi-exclamation-triangle display-1 d-block mb-3"></i><h4>Permission Error loading orders</h4><p class="small">Ensure your Realtime DB Rules allow reading where uid matches incoming auth.</p></div>';
                }
            } else {
                customerOrdersGrid.innerHTML = '<div class="text-center py-5"><h4 class="mb-3">Please log in to view your orders</h4><a href="login.html" class="btn btn-success rounded-pill px-4">Log In to Account</a></div>';
            }
        });
    }

    // ==========================================
    // 9. ADMIN DASHBOARD (Fetch Real Firebase Orders)
    // ==========================================
    const adminGrid = document.getElementById('adminOrdersGrid');
    if (adminGrid) {
        async function loadAdminData() {
            try {
                // Warning: In production, grabbing entire "orders" collection requires admin auth rules!
                const querySnapshot = await window.db.collection("orders").orderBy("createdAt", "desc").get();

                let rev = 0;
                let tableHtml = '';
                querySnapshot.forEach((doc) => {
                    const o = doc.data();
                    rev += o.totalAmount;
                    let names = o.items.map(i => `<span class="badge bg-light text-dark border me-1">${i.quantity}x ${i.title}</span>`).join('');
                    let d = new Date(o.date);
                    tableHtml += `
                    <tr>
                        <td class="fw-bold font-monospace text-primary">${o.id}</td>
                        <td class="text-muted small">${d.toLocaleDateString()} ${d.toLocaleTimeString()}</td>
                        <td>${o.customerName}<br><small class="text-muted">${o.customerEmail}</small></td>
                        <td>${names}</td>
                        <td class="fw-bold text-success">₹${o.totalAmount}</td>
                        <td><span class="badge bg-warning text-dark px-3 py-2 rounded-pill">${o.status}</span></td>
                    </tr>`;
                });

                document.getElementById('totalSalesVal').innerText = '₹' + rev;
                document.getElementById('totalOrdersCount').innerText = querySnapshot.size;
                document.getElementById('adminTableBody').innerHTML = tableHtml || '<tr><td colspan="6" class="text-center py-4">No real orders found in Firebase.</td></tr>';
            } catch (e) {
                console.error(e);
                document.getElementById('adminTableBody').innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Firebase Error: ${e.message}. Are your DB rules public/test mode?</td></tr>`;
            }
        }
        loadAdminData();
    }

    // Sticky Floats
    const floatHtml = `<a href="https://wa.me/917232825204" target="_blank" class="sticky-icon whatsapp-icon" title="Chat on WhatsApp"><i class="bi bi-whatsapp"></i></a><button id="scrollToTopBtn" class="sticky-icon scroll-top-icon" title="Go to top"><i class="bi bi-arrow-up"></i></button>`;
    const floatDiv = document.createElement('div'); floatDiv.innerHTML = floatHtml; document.body.appendChild(floatDiv);
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    window.addEventListener('scroll', () => { if (window.scrollY > 300) scrollToTopBtn.classList.add('show'); else scrollToTopBtn.classList.remove('show'); });
    scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    // ==========================================
    // 10. GLOBAL EVENT DELEGATION (Static Elements)
    // ==========================================
    document.addEventListener('click', function(e) {
        // Handle static Add to Cart buttons
        const addBtn = e.target.closest('.dynamic-add-cart');
        if(addBtn && !addBtn.dataset.bound) { // Prevent double-firing if already bound in dynamic grid
            e.preventDefault();
            if(addBtn.dataset.prod) {
                window.addToCartGlobal(addBtn.dataset.prod);
                const origHtml = addBtn.innerHTML;
                const origClasses = addBtn.className;
                addBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Added';
                addBtn.className = origClasses.replace('btn-outline-success', 'btn-success').replace('btn-outline-pink', 'btn-pink');
                setTimeout(() => { addBtn.innerHTML = origHtml; addBtn.className = origClasses; }, 1000);
            }
        }

        // Handle static Quick View buttons
        const viewBtn = e.target.closest('.quick-view-btn');
        if(viewBtn && !viewBtn.dataset.bound) {
            e.preventDefault();
            if(viewBtn.dataset.prod && window.openModalFromData) {
                window.openModalFromData(viewBtn.dataset.prod);
            }
        }
    });
    // ==========================================
    // 11. DARK MODE & AOS INITIALIZATION
    // ==========================================
    const savedTheme = localStorage.getItem('yadavTheme') || 'light';
    if(savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Attach listener to any theme toggle buttons on page
    document.addEventListener('click', (e) => {
        const themeToggleBtn = e.target.closest('.theme-toggle-btn');
        if(themeToggleBtn) {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('yadavTheme', isDark ? 'dark' : 'light');
            
            // Sync all toggle icons on the page
            document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
                if(isDark) {
                    icon.classList.remove('bi-moon', 'text-dark');
                    icon.classList.add('bi-sun', 'text-warning');
                } else {
                    icon.classList.remove('bi-sun', 'text-warning');
                    icon.classList.add('bi-moon', 'text-dark');
                }
            });
        }
    });

    // Initialize initial icon state
    if(savedTheme === 'dark') {
        document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
            icon.classList.remove('bi-moon', 'text-dark');
            icon.classList.add('bi-sun', 'text-warning');
        });
    }

    // Initialize animations if AOS exists
    if(typeof window.AOS !== 'undefined') {
        window.AOS.init({ once: true, duration: 800 });
    }
});