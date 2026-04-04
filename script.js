// Ensure catalog is loaded
let CATALOG = (typeof YADAV_CATALOG !== 'undefined') ? [...YADAV_CATALOG] : [];
window.CATALOG = CATALOG;
window.userWishlist = []; // Global Wishlist cache
window.favoriteUnsubscribe = null;

window.getFavoritePageHref = function () {
    return window.auth?.currentUser ? 'favorites.html' : 'login.html';
};

window.updateFavoriteBadges = function (count = 0) {
    document.querySelectorAll('[data-favorites-badge="true"], a[title="Favorites"] .badge-count, a[title="Saved Favorites"] .badge-count, a[title="Login to save favorites"] .badge-count').forEach((badge) => {
        badge.innerText = String(count);
        badge.classList.toggle('d-none', count <= 0);
    });
};

window.ensureFavoriteNavigation = function () {
    document.querySelectorAll('.navbar-nav').forEach((nav) => {
        if (nav.closest('#adminSidebar') || nav.querySelector('[data-favorites-nav="true"]')) return;

        const navItem = document.createElement('li');
        navItem.className = 'nav-item d-lg-none';
        navItem.innerHTML = `
            <a class="nav-link text-dark d-flex align-items-center justify-content-between" href="${window.getFavoritePageHref()}" title="Favorites" data-favorites-link="true" data-favorites-nav="true">
                <span><i class="bi bi-heart me-2 text-success"></i>Favorites</span>
                <span class="badge rounded-pill bg-success favorites-total-badge d-none" data-favorites-badge="true">0</span>
            </a>
        `;

        const downloadItem = nav.querySelector('.nav-item.d-lg-none.mt-4');
        if (downloadItem) nav.insertBefore(navItem, downloadItem);
        else nav.appendChild(navItem);
    });

    document.querySelectorAll('.main-header .d-flex.d-lg-none.align-items-center.gap-3.ms-auto').forEach((bar) => {
        if (bar.querySelector('[data-favorites-mobile="true"]')) return;

        const favoriteLink = document.createElement('a');
        favoriteLink.href = window.getFavoritePageHref();
        favoriteLink.title = 'Favorites';
        favoriteLink.dataset.favoritesLink = 'true';
        favoriteLink.dataset.favoritesMobile = 'true';
        favoriteLink.className = 'text-dark text-decoration-none fs-5 position-relative icon-link mobile-favorites-link';
        favoriteLink.innerHTML = `
            <i class="bi bi-heart"></i>
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success badge-count favorites-total-badge d-none" data-favorites-badge="true">0</span>
        `;

        const cartLink = bar.querySelector('a[title="Cart"]');
        const toggleBtn = bar.querySelector('.navbar-toggler');
        if (cartLink) bar.insertBefore(favoriteLink, cartLink);
        else if (toggleBtn) bar.insertBefore(favoriteLink, toggleBtn);
        else bar.appendChild(favoriteLink);
    });

    document.querySelectorAll('a[data-favorites-link="true"]').forEach((link) => {
        link.href = window.getFavoritePageHref();
        link.title = window.auth?.currentUser ? 'Saved Favorites' : 'Login to save favorites';
    });
};

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

// PWA: Store the install prompt event for manual triggering
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar from appearing automatically
    e.preventDefault();
    // Stash the event so it can be triggered later.
    window.deferredPrompt = e;
});

// PWA: Function to trigger the actual app installation
window.installApp = async function () {
    if (window.deferredPrompt) {
        // Show the native install prompt
        window.deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            if (window.showToast) window.showToast("Success", "App is installing to your device! 🎉");
        }
        // We've used the prompt, and can't use it again, throw it away
        window.deferredPrompt = null;
    } else {
        // If the PWA is already installed or browser prevents it
        if (window.showToast) window.showToast("Information", "App is already installed or your browser requires you to use 'Add to Home screen' manually from options.");
    }

    // Close the sidebar if it's open
    const sidebar = document.getElementById('mainNav');
    if (sidebar) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebar);
        if (bsOffcanvas) bsOffcanvas.hide();
    }
};

// ==========================================
// GLOBAL SETTINGS LISTENER (SEO & MAINTENANCE)
// ==========================================
if (window.db) {
    window.db.collection('settings').doc('global').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();

            // Apply Dynamic SEO
            if (data.seoTitle && document.title.indexOf('Admin') === -1) {
                document.title = data.seoTitle;
            }
            if (data.seoDesc) {
                let meta = document.querySelector('meta[name="description"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = "description";
                    document.head.appendChild(meta);
                }
                meta.content = data.seoDesc;
            }

            // Apply Maintenance Mode
            // if maintenanceMode == true and not on admin.html
            const isAdminPage = window.location.pathname.includes('admin.html');
            if (data.maintenanceMode && !isAdminPage) {
                // Must be Superadmin or Staff to bypass
                const checkBypass = async () => {
                    const currentUser = window.auth.currentUser;

                    if (currentUser) {
                        try {
                            const staffDoc = await window.db.collection('roles').doc(currentUser.email).get();
                            if (staffDoc.exists) return; // Staff bypasses maintenance
                        } catch (e) { }
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
window.YADAV_OWNER_EMAIL = 'hyadav1317@gmail.com';

window.normalizeEmail = function (email) {
    return String(email || '').trim().toLowerCase();
};

window.normalizeCatalogCategory = function (category) {
    const normalizedCategory = String(category || '').trim();
    if (normalizedCategory === 'Fresh Fruits') return 'Fruits';
    if (normalizedCategory === 'Veggies') return 'Vegetables';
    return normalizedCategory;
};

window.getUserEmail = function (userOrEmail) {
    if (!userOrEmail) return '';
    return window.normalizeEmail(typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email);
};

window.isOwnerEmail = function (userOrEmail) {
    return window.getUserEmail(userOrEmail) === window.YADAV_OWNER_EMAIL;
};

window.getRoleDocumentRef = function (userOrEmail) {
    const email = window.getUserEmail(userOrEmail);
    if (!email || !window.db) return null;
    return window.db.collection('roles').doc(email);
};

window.ensureOwnerAdminAccess = async function (userOrEmail) {
    const email = window.getUserEmail(userOrEmail);
    if (!email || email !== window.YADAV_OWNER_EMAIL || !window.db) return null;

    const roleRef = window.getRoleDocumentRef(email);
    const roleSnap = await roleRef.get();
    const currentRole = roleSnap.exists ? roleSnap.data() : null;

    if (!currentRole || currentRole.role !== 'superadmin' || currentRole.owner !== true) {
        const ownerPayload = {
            role: 'superadmin',
            owner: true,
            label: 'Primary Owner',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!roleSnap.exists) {
            ownerPayload.addedAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        await roleRef.set(ownerPayload, { merge: true });
    }

    return {
        email,
        role: 'superadmin',
        owner: true,
        label: 'Primary Owner'
    };
};

window.fetchAccessRole = async function (userOrEmail) {
    const rawEmail = String(typeof userOrEmail === 'string' ? userOrEmail : (userOrEmail?.email || '')).trim();
    const email = window.getUserEmail(userOrEmail);
    if (!email || !window.db) return null;

    if (window.isOwnerEmail(email)) {
        return window.ensureOwnerAdminAccess(email);
    }

    const roleRef = window.getRoleDocumentRef(email);
    let roleSnap = await roleRef.get();

    if (!roleSnap.exists && rawEmail && rawEmail !== email) {
        roleSnap = await window.db.collection('roles').doc(rawEmail).get();
    }

    if (!roleSnap.exists) return null;

    return {
        email,
        ...roleSnap.data()
    };
};

window.getPostLoginRedirect = async function (user) {
    const roleData = await window.fetchAccessRole(user);
    return roleData ? 'admin.html' : 'profile.html';
};

window.applySiteQrCode = function (url) {
    const u = String(url || '').trim();
    document.querySelectorAll('[data-site-qr="img"]').forEach((img) => {
        const fallbackSrc = img.getAttribute('data-default-src') || '';
        const finalSrc = u || fallbackSrc;
        if (finalSrc) {
            img.src = finalSrc;
            img.classList.remove('d-none');
        } else {
            img.removeAttribute('src');
            img.classList.add('d-none');
        }
    });
    document.querySelectorAll('[data-site-qr="block"]').forEach((block) => {
        const hasVisibleQr = !!(u || block.querySelector('[data-site-qr="img"][data-default-src]'));
        block.classList.toggle('d-none', !hasVisibleQr);
    });
};

function attachGlobalSettingsListener() {
    if (!window.db || window.globalSettingsUnsubscribe) return;

    window.globalSettingsUnsubscribe = window.db.collection('settings').doc('global').onSnapshot(doc => {
        if (!doc.exists) return;

        const data = doc.data();

        if (data.seoTitle && document.title.indexOf('Admin') === -1) {
            document.title = data.seoTitle;
        }

        if (data.seoDesc) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = "description";
                document.head.appendChild(meta);
            }
            meta.content = data.seoDesc;
        }

        if (typeof window.applySiteQrCode === 'function') {
            window.applySiteQrCode(data.qrCodeUrl);
        }
        
        // Apply UPI settings to payment page if on payment page
        if (window.location.pathname.includes('payment.html')) {
            // Update UPI ID
            const upiIdElement = document.getElementById('upiId');
            if (upiIdElement && data.upiId) {
                upiIdElement.textContent = data.upiId;
            }
            
            // Toggle QR Code visibility
            const qrSection = document.getElementById('paymentQrSection');
            if (qrSection) {
                qrSection.style.display = (data.showQrCode === false) ? 'none' : 'block';
            }
            
            // Toggle Quick Pay buttons visibility
            const quickPaySection = document.getElementById('paymentQuickPaySection');
            if (quickPaySection) {
                quickPaySection.style.display = (data.showQuickPayButtons === false) ? 'none' : 'block';
            }
            
            // Toggle UPI ID visibility
            const upiIdSection = document.getElementById('paymentUpiIdSection');
            if (upiIdSection) {
                upiIdSection.style.display = (data.showUpiId === false) ? 'none' : 'block';
            }
            
            console.log('Payment settings updated:', { upiId: data.upiId, showQrCode: data.showQrCode, showQuickPay: data.showQuickPayButtons, showUpiId: data.showUpiId });
        }

        const isAdminPage = window.location.pathname.includes('admin.html');
        if (data.maintenanceMode && !isAdminPage) {
            const checkBypass = async () => {
                const currentUser = window.auth.currentUser;

                if (currentUser) {
                    try {
                        const roleData = await window.fetchAccessRole(currentUser);
                        if (roleData) return;
                    } catch (e) { }
                }

                document.body.innerHTML = `
                    <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f9fa;text-align:center;font-family:sans-serif;padding:2rem;">
                        <div>
                            <h1 style="color:#198754;font-size:3rem;margin-bottom:1rem;">We'll be back soon!</h1>
                            <p style="color:#6c757d;font-size:1.2rem;">Yadav Vegetable & Ice-Cream Parlour is currently undergoing scheduled maintenance to improve your experience.</p>
                        </div>
                    </div>`;
            };
            checkBypass();
        }
    });
}

attachGlobalSettingsListener();

// Wishlist Function
window.toggleWishlist = async function (prodId) {
    const activeUser = window.auth?.currentUser;
    if (!activeUser) {
        window.showToast("Wait!", "Please login to save to favorites", true);
        window.location.href = "login.html";
        return;
    }
    const r = window.db.collection('users').doc(activeUser.uid).collection('wishlist').doc(prodId);
    if (window.userWishlist.includes(prodId)) {
        await r.delete();
        window.showToast("Removed", "Removed from favorites!");
    } else {
        await r.set({ added: new Date().toISOString() });
        window.showToast("Saved", "Added to favorites! ❤️");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
    window.formatCurrency = formatCurrency;


    // Preloader fadeout logic
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.getElementById('premiumPreloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.style.display = 'none', 500);
            }
        }, 200);
    });

    // Random Fake Purchase Toasts for premium active feel (Trigger every 45s)
    setInterval(() => {
        const names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali"];
        const products = ["Organic Broccoli", "Vanilla Strawberry Sundae", "Fresh Red Tomatoes", "Dark Choco Cone", "Farm Fresh Apples", "Pure Dairy Milk"];
        const cities = ["Jaipur", "Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme"];
        const name = names[Math.floor(Math.random() * names.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        if (window.showToast && !document.hidden && document.visibilityState === 'visible') {
            window.showToast("🛒 Live Purchase", `${name} from ${city} just bought ${product}!`);
        }
    }, 45000);
    // ==========================================
    // HYBRID CATALOG FETCH
    // ==========================================
    if (window.db) {
        window.db.collection('products').get().then(snapshot => {
            const mergedCatalog = new Map(window.CATALOG.map(item => [item.id || item.title, {
                ...item,
                category: window.normalizeCatalogCategory(item.category)
            }]));

            snapshot.forEach(doc => {
                const product = {
                    ...doc.data(),
                    id: doc.id
                };
                if (product.archived) {
                    mergedCatalog.delete(product.id || product.title);
                    return;
                }
                product.category = window.normalizeCatalogCategory(product.category);
                mergedCatalog.set(product.id || product.title, product);
            });

            CATALOG = Array.from(mergedCatalog.values());
            window.CATALOG = CATALOG;

            if (document.getElementById('productGrid') && typeof window.renderDynamicGrid === 'function') {
                const q = localStorage.getItem('yadavSearchQuery');
                if (new URLSearchParams(window.location.search).get('search') === 'true' && q) {
                    window.renderDynamicGrid(1, q, localStorage.getItem('yadavSearchCat'));
                } else {
                    window.renderDynamicGrid();
                }
            }

            if (typeof window.renderFavoritesPage === 'function') {
                window.renderFavoritesPage();
            }
        });
    }

    // ==========================================
    // 0. GLOBAL DYNAMIC UI INJECTION & PRELOADER
    // ==========================================
    const dynamicUIHTML = `
        <!-- Preloader -->
        <div id="premiumPreloader" class="preloader">
            <div class="position-relative d-flex justify-content-center align-items-center mb-4" style="width: 130px; height: 130px;">
                <div class="spinner-border text-success position-absolute w-100 h-100" style="border-width: 4px;" role="status"></div>
                <span class="logo-text fw-bold fs-4 m-0 text-center lh-sm text-dark" style="z-index: 1;">Yadav<br><span class="text-success">Store</span></span>
            </div>
            <p class="text-muted fw-medium pulse-text">Preparing fresh catalogue...</p>
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

    window.showToast = function (title, msg, isError = false) {
        const container = document.getElementById('globalToastContainer');
        if (!container) return;
        const toastIcon = isError ? 'bi-x-circle-fill' : (String(title).toLowerCase().includes('cart') ? 'bi-bag-check-fill' : 'bi-stars');
        const toast = document.createElement('div');
        toast.className = `styled-toast ${isError ? 'toast-error' : ''}`;
        toast.innerHTML = `
            <div class="toast-accent"></div>
            <div class="toast-icon-wrap">
                <i class="bi ${toastIcon}"></i>
            </div>
            <div class="toast-copy">
                <p class="toast-title">${title}</p>
                <p class="toast-msg">${msg}</p>
            </div>
            <button class="toast-close-btn" type="button" aria-label="Close notification">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="toast-progress"></div>
        `;
        container.appendChild(toast);
        const dismissToast = () => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        };
        let autoDismiss = setTimeout(dismissToast, 3600);
        requestAnimationFrame(() => toast.classList.add('show'));
        toast.querySelector('.toast-close-btn').addEventListener('click', dismissToast);
        toast.addEventListener('mouseenter', () => clearTimeout(autoDismiss));
        toast.addEventListener('mouseleave', () => {
            clearTimeout(autoDismiss);
            autoDismiss = setTimeout(dismissToast, 1800);
        });
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
    window.ensureFavoriteNavigation();

    // ==========================================
    // 2. FIREBASE AUTH STATE (Global Header Updates)
    // ==========================================
    let currentUser = null;

    window.auth.onAuthStateChanged((user) => {
        window.ensureFavoriteNavigation();
        const loginIconLinks = document.querySelectorAll('a[title="Login/Profile"], a[title="My Profile"], a[data-auth-link="true"]');
        const favoriteIconLinks = document.querySelectorAll('a[title="Favorites"], a[title="Saved Favorites"], a[title="Login to save favorites"], a[data-favorites-link="true"]');

        if (typeof window.favoriteUnsubscribe === 'function') {
            window.favoriteUnsubscribe();
            window.favoriteUnsubscribe = null;
        }

        if (user) {
            currentUser = user;

            // Sync Wishlist collection
            window.favoriteUnsubscribe = window.db.collection('users').doc(user.uid).collection('wishlist').onSnapshot(snap => {
                window.userWishlist = snap.docs.map(d => d.id);
                window.updateFavoriteBadges(window.userWishlist.length);
                document.querySelectorAll('.wishlist-btn').forEach(b => {
                    if (window.userWishlist.includes(b.dataset.id)) b.classList.add('active');
                    else b.classList.remove('active');
                });
                if (typeof window.renderFavoritesPage === 'function') {
                    window.renderFavoritesPage();
                }
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
            favoriteIconLinks.forEach(link => {
                link.href = 'favorites.html';
                link.title = 'Saved Favorites';
            });

            // Inject Admin Portal Link icon for Owner / Staff
            const headerIconsContainer = document.querySelector('.header-icons');
            if (headerIconsContainer && document.getElementById('adminPortalLink') === null) {
                // Check if admin or staff
                const checkAdmin = async () => {
                    try {
                        const roleData = await window.fetchAccessRole(user);
                        return !!roleData;
                    } catch (e) { return false; }
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
            window.userWishlist = [];
            window.updateFavoriteBadges(0);
            localStorage.removeItem('yadavSession');
            // Revert headers
            loginIconLinks.forEach(link => {
                link.href = 'login.html';
                link.title = 'Login/Profile';
                link.innerHTML = '<i class="bi bi-person"></i>';
            });
            const ordersIcon = document.querySelector('a[href="orders.html"]');
            if (ordersIcon) ordersIcon.classList.add('d-none');
            favoriteIconLinks.forEach(link => {
                link.href = 'login.html';
                link.title = 'Login to save favorites';
            });
            document.querySelectorAll('.wishlist-btn').forEach(b => b.classList.remove('active'));
            // Remove Admin link if present
            const adminLink = document.getElementById('adminPortalLink');
            if (adminLink) adminLink.remove();
            if (typeof window.renderFavoritesPage === 'function') {
                window.renderFavoritesPage();
            }
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
            if (window.showToast) window.showToast('Error', 'Could not add to cart.', true);
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
        if (show) {
            sideOverlay.classList.add('show');
            sideDrawer.classList.add('open');
            renderSideCart();
        } else {
            sideOverlay.classList.remove('show');
            sideDrawer.classList.remove('open');
        }
    }
    if (sideOverlay && sideClose) {
        sideOverlay.addEventListener('click', () => toggleSideCart(false));
        sideClose.addEventListener('click', () => toggleSideCart(false));
    }

    // Intercept cart icon clicks to open Drawer instead of navigating (except on cart/checkout pages)
    document.querySelectorAll('a[href="cart.html"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const loc = window.location.pathname;
            if (!loc.includes('cart.html') && !loc.includes('payment.html')) {
                e.preventDefault();
                toggleSideCart(true);
            }
        });
    });

    window.renderSideCart = function () {
        const bodyEl = document.getElementById('sideCartBody');
        const countEl = document.getElementById('sideCartCount');
        const totalEl = document.getElementById('sideCartTotal');
        if (!bodyEl) return;

        let totalItems = cart.reduce((s, i) => s + i.quantity, 0);
        countEl.innerText = totalItems;

        if (cart.length === 0) {
            bodyEl.innerHTML = '<div class="text-center text-muted mt-5"><i class="bi bi-cart-x display-3"></i><p class="mt-3">Cart is Empty</p></div>';
            totalEl.innerText = formatCurrency(0);
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
                    <div class="text-success fw-bold small">${formatCurrency(item.price)}</div>
                    <div class="d-flex align-items-center mt-2">
                        <button class="btn btn-sm btn-light border p-0 px-2 side-qty-btn" data-idx="${index}" data-change="-1">-</button>
                        <span class="mx-2 small fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-light border p-0 px-2 side-qty-btn" data-idx="${index}" data-change="1">+</button>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold mb-2">${formatCurrency(t)}</div>
                    <button class="btn btn-sm text-danger p-0 side-rem-btn" data-idx="${index}"><i class="bi bi-trash"></i></button>
                </div>
            </div>`;
        });
        bodyEl.innerHTML = html;
        const tax = subtotal * 0.05;
        totalEl.innerText = formatCurrency(Math.ceil(subtotal + tax));

        bodyEl.querySelectorAll('.side-qty-btn').forEach(btn => btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            const chg = parseInt(this.dataset.change);
            if (cart[idx].quantity + chg <= 0) cart.splice(idx, 1);
            else cart[idx].quantity += chg;
            saveCart(); updateCartBadges(); renderSideCart();
            if (typeof renderCartPage === 'function') renderCartPage();
        }));
        bodyEl.querySelectorAll('.side-rem-btn').forEach(btn => btn.addEventListener('click', function () {
            cart.splice(parseInt(this.dataset.idx), 1);
            saveCart(); updateCartBadges(); renderSideCart();
            if (typeof renderCartPage === 'function') renderCartPage();
        }));
    }

    // ==========================================
    // 4. GLOBAL SEARCH LOGIC
    // ==========================================
    const searchInputs = [document.getElementById('globalSearchInput'), document.getElementById('globalSearchInputMobile')].filter(Boolean);
    const searchBtns = [document.getElementById('globalSearchBtn'), document.getElementById('globalSearchBtnMobile')].filter(Boolean);
    const searchCategory = document.getElementById('globalSearchCategory');

    function performSearch(query) {
        if (!query) return;
        const cat = searchCategory ? searchCategory.value : 'All';

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

    searchBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            const currentInput = searchInputs[idx];
            if (currentInput) performSearch(currentInput.value.trim().toLowerCase());
        });
    });

    searchInputs.forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') performSearch(e.target.value.trim().toLowerCase());
        });

        // Live Search Suggestion Feature
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const searchBarContainer = e.target.closest('.search-bar') || e.target.closest('.input-group');
            const dropdown = document.getElementById('liveSearchDropdown');

            if (!dropdown || !searchBarContainer) return;

            // Move dropdown physically inside search bar container if needed for absolute positioning
            if (dropdown.parentNode !== searchBarContainer) {
                searchBarContainer.style.position = 'relative';
                searchBarContainer.appendChild(dropdown);
            }

            if (query.length < 1) {
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

            if (results.length > 0) {
                let html = '';
                results.forEach(r => {
                    const encodedProd = encodeURIComponent(JSON.stringify(r));
                    html += `
                        <div class="search-suggest-item" onclick="if(window.openModalFromData) { document.getElementById('liveSearchDropdown').classList.remove('show'); window.openModalFromData('${encodedProd}'); }">
                            <img src="${r.image}" alt="">
                            <div>
                                <h6 class="mb-0 fw-bold fs-6 text-dark">${r.title}</h6>
                                <span class="text-success small fw-medium">${formatCurrency(r.price)}</span>
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
    });

    // Close dropdown when clicked outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('liveSearchDropdown');
        if (dropdown && !e.target.closest('.search-bar') && !e.target.closest('.input-group')) {
            dropdown.classList.remove('show');
        }
    });


    // ==========================================
    // 5. DYNAMIC CATALOG RENDERING 
    // ==========================================
    window.buildStorefrontProductCard = function (prod, options = {}) {
        const prodId = prod.id || prod.title;
        const normalizedCategory = window.normalizeCatalogCategory(prod.category);
        const isPink = normalizedCategory === 'Ice-Creams';
        const colorClass = isPink ? 'pink' : 'success';
        const bgClass = isPink ? 'bg-light-pink' : 'bg-light-green';
        const columnClass = options.columnClass || 'col-6 col-md-4 col-xl-3';
        const badgeHtml = prod.badge ? `<div class="badge bg-${colorClass === 'pink' ? 'danger' : 'success'} position-absolute top-0 start-0 m-3 z-index-2">${prod.badge}</div>` : '';
        const originalStr = prod.originalPrice ? `<span class="text-muted text-decoration-line-through small me-2">${formatCurrency(prod.originalPrice)}</span>` : '';

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(prod.rating)) starsHtml += '<i class="bi bi-star-fill"></i>';
            else if (i - 0.5 === prod.rating) starsHtml += '<i class="bi bi-star-half"></i>';
            else starsHtml += '<i class="bi bi-star"></i>';
        }

        const prodJson = encodeURIComponent(JSON.stringify(prod));

        return `
            <div class="${columnClass}">
                <div class="card product-card fade-up-custom border-0 ${bgClass} h-100 shadow-sm rounded-4">
                    ${badgeHtml}
                    <div class="px-4 py-4 text-center position-relative overflow-hidden product-image-wrapper">
                        <img src="${prod.image}" alt="${prod.title}" class="img-fluid object-fit-cover shadow-sm product-card-image" style="width:140px; height:140px;">
                        <div class="product-action-overlay">
                            <button class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift wishlist-btn ${window.userWishlist && window.userWishlist.includes(prodId) ? 'active' : ''}" data-id="${prodId}" aria-label="Save ${prod.title}"><i class="bi bi-heart"></i></button>
                            <button class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift quick-view-btn" data-prod="${prodJson}" aria-label="Quick view ${prod.title}"><i class="bi bi-eye"></i></button>
                        </div>
                    </div>
                    <div class="card-body bg-white rounded-bottom-4 p-4 product-card-body">
                        <p class="text-muted small mb-1 product-card-meta">${normalizedCategory}</p>
                        <h6 class="card-title fw-bold text-dark mb-2 product-card-title" title="${prod.title}">${prod.title}</h6>
                        <div class="rating text-warning mb-2 small product-card-rating">${starsHtml}</div>
                        <div class="d-flex justify-content-center align-items-center mb-3 product-price-row">
                            ${originalStr}
                            <span class="fs-5 fw-bold text-${colorClass}">${formatCurrency(prod.price)}</span>
                        </div>
                        <button class="btn btn-outline-${colorClass} w-100 rounded-pill fw-medium dynamic-add-cart" data-prod="${prodJson}"><i class="bi bi-cart-plus me-2"></i><span>Add to Cart</span></button>
                    </div>
                </div>
            </div>
        `;
    };

    window.bindStoreProductCardActions = function (containerEl) {
        if (!containerEl) return;

        containerEl.querySelectorAll('.dynamic-add-cart').forEach(btn => {
            btn.dataset.bound = "true";
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                window.addToCartGlobal(this.dataset.prod);
                const origHtml = this.innerHTML;
                const origClasses = this.className;
                this.innerHTML = '<i class="bi bi-check2-circle"></i><span>Added</span>';
                this.className = origClasses.replace('btn-outline-success', 'btn-success').replace('btn-outline-pink', 'btn-pink');
                setTimeout(() => { this.innerHTML = origHtml; this.className = origClasses; }, 1000);
            });
        });

        containerEl.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.dataset.bound = "true";
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                window.openModalFromData(this.dataset.prod);
            });
        });
    };

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

            const normalizedPageCategory = window.normalizeCatalogCategory(pageMainCategory);
            const normalizedSearchCategory = window.normalizeCatalogCategory(searchCat);
            let filteredList = CATALOG.filter(p => normalizedPageCategory === 'All' || window.normalizeCatalogCategory(p.category) === normalizedPageCategory);

            if (searchQuery) {
                const searchStr = searchQuery.toLowerCase();
                filteredList = filteredList.filter(p => {
                    const matchQ = p.title.toLowerCase().includes(searchStr) ||
                        window.normalizeCatalogCategory(p.category).toLowerCase().includes(searchStr) ||
                        (p.desc && p.desc.toLowerCase().includes(searchStr));
                    const matchC = normalizedSearchCategory === 'All' || window.normalizeCatalogCategory(p.category) === normalizedSearchCategory;
                    return matchQ && matchC;
                });
                document.querySelectorAll('.filter-category-checkbox').forEach(cb => cb.checked = false);
            } else {
                if (currentSubCat !== 'All') {
                    filteredList = filteredList.filter(p => p.subCategory === currentSubCat || window.normalizeCatalogCategory(p.category) === currentSubCat);
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
                gridEl.innerHTML = '<div class="col-12 py-5 text-center text-muted"><h4>No products found!</h4><button class="btn btn-outline-success mt-3" onclick="window.clearCatalogFilters && window.clearCatalogFilters()">Clear Filters</button></div>';
            } else {
                pageItems.forEach(prod => {
                    gridEl.innerHTML += window.buildStorefrontProductCard(prod);
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

            window.bindStoreProductCardActions(gridEl);
        };

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; renderDynamicGrid(1); });

        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                currentMaxPrice = e.target.value;
                document.getElementById('priceValueDisplay').innerText = formatCurrency(currentMaxPrice);
            });
            priceRange.addEventListener('change', () => { renderDynamicGrid(1); });
        }

        window.clearCatalogFilters = function () {
            currentSort = 'default';
            currentSubCat = 'All';
            if (sortSelect) sortSelect.value = 'default';
            if (priceRange) {
                priceRange.value = priceRange.max || 9999;
                currentMaxPrice = Number(priceRange.value);
            } else {
                currentMaxPrice = 9999;
            }
            document.querySelectorAll('.filter-category-checkbox').forEach(cb => {
                cb.checked = cb.value === 'All';
            });
            const priceValueDisplay = document.getElementById('priceValueDisplay');
            if (priceValueDisplay) priceValueDisplay.innerText = formatCurrency(currentMaxPrice);
            renderDynamicGrid(1);
            window.showToast('Filters Reset', 'All products are visible again.');
        };

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

    window.renderFavoritesPage = async function () {
        const favoritesGrid = document.getElementById('favoritesGrid');
        if (!favoritesGrid) return;

        const summaryEl = document.getElementById('favoritesSummary');
        const user = window.auth?.currentUser;

        if (!user) {
            if (summaryEl) summaryEl.innerText = 'Log in to see your saved favorites.';
            favoritesGrid.innerHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center product-grid-state">
                        <i class="bi bi-heart display-4 text-success mb-3"></i>
                        <h4 class="fw-bold mb-2">Your favorites will appear here</h4>
                        <p class="text-muted mb-4">Login karke jo products save karoge, woh yahan instantly dikh jayenge.</p>
                        <div class="d-flex flex-column flex-sm-row justify-content-center gap-2">
                            <a href="login.html" class="btn btn-success rounded-pill px-4">Login</a>
                            <a href="fresh-veggies.html" class="btn btn-outline-success rounded-pill px-4">Browse Products</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const wishlistIds = Array.isArray(window.userWishlist) ? [...window.userWishlist] : [];
        if (!wishlistIds.length) {
            if (summaryEl) summaryEl.innerText = 'You have not saved any products yet.';
            favoritesGrid.innerHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center product-grid-state">
                        <i class="bi bi-heart display-4 text-success mb-3"></i>
                        <h4 class="fw-bold mb-2">No favorites yet</h4>
                        <p class="text-muted mb-4">Product cards par heart icon dabao, aur aapke saved items yahan aa jayenge.</p>
                        <a href="fresh-veggies.html" class="btn btn-success rounded-pill px-4">Start Shopping</a>
                    </div>
                </div>
            `;
            return;
        }

        const catalogMap = new Map((window.CATALOG || []).map(item => {
            const key = item.id || item.title;
            return [key, {
                ...item,
                id: key,
                category: window.normalizeCatalogCategory(item.category)
            }];
        }));

        const missingIds = wishlistIds.filter(id => !catalogMap.has(id));
        if (missingIds.length && window.db) {
            const missingDocs = await Promise.all(missingIds.map(id => window.db.collection('products').doc(id).get()));
            missingDocs.forEach((doc) => {
                if (!doc.exists) return;
                const liveData = doc.data();
                if (liveData.archived) return;
                catalogMap.set(doc.id, {
                    ...liveData,
                    id: doc.id,
                    category: window.normalizeCatalogCategory(liveData.category)
                });
            });
        }

        const favoriteItems = wishlistIds.map(id => catalogMap.get(id)).filter(Boolean);
        if (summaryEl) {
            summaryEl.innerText = `${favoriteItems.length} product${favoriteItems.length === 1 ? '' : 's'} saved in your favorites.`;
        }

        favoritesGrid.innerHTML = favoriteItems.length
            ? favoriteItems.map(item => window.buildStorefrontProductCard(item)).join('')
            : `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-4 text-center product-grid-state">
                        <h4 class="fw-bold mb-2">Some saved products are no longer available</h4>
                        <p class="text-muted mb-0">Aapke purane saved items live catalog se remove ho chuke hain.</p>
                    </div>
                </div>
            `;

        window.bindStoreProductCardActions(favoritesGrid);
    };


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
                document.getElementById('modalProductPrice').innerText = formatCurrency(data.price);
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

                if (window.fetchReviews) window.fetchReviews(data.id);

                const btn = document.getElementById('modalAddToCartBtn');
                btn.className = `btn btn-${data.category === 'Ice-Creams' ? 'pink' : 'success'} px-5 rounded-pill fw-bold hover-lift`;

                btn.onclick = () => {
                    window.addToCartGlobal(encodeURIComponent(JSON.stringify({ ...data, quantity: parseInt(document.getElementById('modalProductQty').value) || 1 })));
                    closeModal();
                    // Alert replaced by Toast inside addToCartGlobal!
                };

                modal.classList.remove('d-none');
                setTimeout(() => { modal.classList.add('show'); document.body.classList.add('product-modal-open'); }, 10);
            } catch (e) { console.error(e); }
        }

        window.submitReview = async function (pid) {
            if (!window.db) return;
            const name = document.getElementById('revName').value.trim();
            const rating = parseInt(document.getElementById('revRating').value);
            const text = document.getElementById('revText').value.trim();
            if (!name || !text) { if (window.showToast) window.showToast('Validation Failed', 'Name and review text required', true); return; }

            try {
                await window.db.collection('reviews').add({ productId: pid, name: name, rating: rating, text: text, date: new Date().toISOString() });
                document.getElementById('revText').value = '';
                document.getElementById('reviewFormWrap').classList.add('d-none');
                if (window.showToast) window.showToast('Success', 'Review added for everyone to see!');
            } catch (e) { if (window.showToast) window.showToast('Error', e.message, true); }
        };

        window.fetchReviews = function (pid) {
            if (!window.db) return;
            window.db.collection('reviews').where('productId', '==', pid).onSnapshot(snap => {
                const listEl = document.getElementById('reviewsList');
                if (!listEl) return;
                if (snap.empty) { listEl.innerHTML = '<span class="text-muted d-block text-center mt-3">No reviews yet. Be the first!</span>'; return; }
                let html = '';
                // Since firestore requires an index for orderBy combined with where(), we sort client side
                let sortedDocs = snap.docs.map(d => d.data()).sort((a, b) => new Date(b.date) - new Date(a.date));
                sortedDocs.forEach(r => {
                    let stars = ''; for (let i = 0; i < r.rating; i++) stars += '⭐';
                    html += `<div class="review-item p-3 mb-2 rounded-3 border-0 shadow-sm bg-white">
                        <div class="d-flex justify-content-between align-items-center mb-1"><span class="fw-bold text-dark">${r.name}</span><span style="font-size:0.6rem">${stars}</span></div>
                        <p class="text-muted mb-0" style="font-size:0.85rem">${r.text}</p>
                    </div>`;
                });
                listEl.innerHTML = html;
            });
        };
        function closeModal() {
            modal.classList.remove('show'); document.body.classList.remove('product-modal-open');
            setTimeout(() => { modal.classList.add('d-none'); }, 300);
        }
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    }

    // ==========================================
    // 6.5 CUSTOM ORDER REVIEW MODAL
    // ==========================================
    window.openOrderReviewModal = function (productId, productNameEnc) {
        if (!currentUser) {
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
            s.addEventListener('click', function () {
                const val = parseInt(this.dataset.val);
                document.getElementById('orderRevRating').value = val;
                stars.forEach(st => {
                    if (parseInt(st.dataset.val) <= val) {
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

    window.submitOrderReview = async function (pid) {
        if (!window.db) return;
        const rating = parseInt(document.getElementById('orderRevRating').value);
        const text = document.getElementById('orderRevText').value.trim();
        const btn = document.getElementById('orderRevSubmitBtn');

        if (!text) { window.showToast('Validation', 'Please write a review message.', true); return; }

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
        } catch (e) {
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

    function sortOrdersByLatest(orders = []) {
        return [...orders].sort((a, b) => {
            const aTime = Number(a?.createdAt) || new Date(a?.date || 0).getTime() || 0;
            const bTime = Number(b?.createdAt) || new Date(b?.date || 0).getTime() || 0;
            return bTime - aTime;
        });
    }

    function normalizeOrderData(rawOrder = {}, fallbackId = '') {
        const createdAt = Number(rawOrder.createdAt) || new Date(rawOrder.date || Date.now()).getTime();
        return {
            ...rawOrder,
            id: rawOrder.id || rawOrder.orderId || fallbackId,
            items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
            totalAmount: Number(rawOrder.totalAmount) || 0,
            status: rawOrder.status || 'Processing',
            date: rawOrder.date || new Date(createdAt).toISOString(),
            createdAt
        };
    }

    async function mirrorOrdersToUserCollection(uid, orders = []) {
        if (!uid || !orders.length) return;
        const batch = window.db.batch();

        orders.forEach(order => {
            const normalizedOrder = normalizeOrderData(order, order?.id || order?.orderId || '');
            if (!normalizedOrder.id) return;
            const userOrderRef = window.db.collection('users').doc(uid).collection('my_orders').doc(normalizedOrder.id);
            batch.set(userOrderRef, normalizedOrder, { merge: true });
        });

        await batch.commit();
    }

    async function fetchGlobalOrdersForUser(uid) {
        if (!uid) return [];
        const snap = await window.db.collection('orders').where('uid', '==', uid).get();
        return sortOrdersByLatest(snap.docs.map(docSnap => normalizeOrderData(docSnap.data(), docSnap.id)));
    }

    async function hydrateCustomerOrders(user, orderDocs) {
        const hydratedOrders = await Promise.all(orderDocs.map(async (docSnap) => {
            const rawOrder = docSnap.data() || {};
            const orderId = rawOrder.id || rawOrder.orderId || docSnap.id;

            if (Array.isArray(rawOrder.items) && rawOrder.items.length) {
                return normalizeOrderData(rawOrder, orderId);
            }

            try {
                const globalOrderDoc = await window.db.collection('orders').doc(orderId).get();
                if (globalOrderDoc.exists) {
                    const fullOrder = normalizeOrderData(globalOrderDoc.data(), orderId);
                    await mirrorOrdersToUserCollection(user.uid, [fullOrder]);
                    return fullOrder;
                }
            } catch (e) {
                console.warn(`Could not hydrate legacy order ${orderId}:`, e);
            }

            return normalizeOrderData(rawOrder, orderId);
        }));

        return sortOrdersByLatest(hydratedOrders);
    }

    function buildCustomerOrderCard(order) {
        const itemList = Array.isArray(order.items) ? order.items : [];
        const itemsHtml = itemList.length
            ? itemList.map(item => `
                <div class="d-flex align-items-center justify-content-between mb-2 w-100 pe-3">
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" class="rounded-circle object-fit-cover shadow-sm border me-2" style="width:40px;height:40px;">
                        <span class="small fw-medium">${item.quantity}x ${item.title}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-warning rounded-pill px-3 py-0 fw-bold hover-lift" onclick="window.openOrderReviewModal('${item.id}', '${escape(item.title || 'Product')}')"><i class="bi bi-star-fill text-warning me-1"></i>Review</button>
                </div>
            `).join('')
            : '<div class="text-muted small">Items details are being synced. Your order is still saved.</div>';

        let progWidth = '25%';
        const statusString = String(order.status || 'Processing').toLowerCase();
        if (statusString.includes('pack')) progWidth = '50%';
        if (statusString.includes('ship') || statusString.includes('out')) progWidth = '75%';
        if (statusString.includes('deliver')) progWidth = '100%';
        const step1 = true;
        const step2 = parseInt(progWidth, 10) >= 50;
        const step3 = parseInt(progWidth, 10) >= 75;
        const step4 = parseInt(progWidth, 10) === 100;

        const trackerHtml = `
            <div class="order-tracker mt-4">
                <div class="tracker-progress" style="width: ${progWidth}"></div>
                <div class="tracker-step ${step1 ? 'active' : ''}">
                    <div class="tracker-icon"><i class="bi bi-cart-check"></i></div>
                    <div class="tracker-label d-none d-sm-block">Processing</div>
                </div>
                <div class="tracker-step ${step2 ? 'active' : ''}">
                    <div class="tracker-icon"><i class="bi bi-box-seam"></i></div>
                    <div class="tracker-label d-none d-sm-block">Packed</div>
                </div>
                <div class="tracker-step ${step3 ? 'active' : ''}">
                    <div class="tracker-icon"><i class="bi bi-truck"></i></div>
                    <div class="tracker-label d-none d-sm-block">Shipped</div>
                </div>
                <div class="tracker-step ${step4 ? 'active' : ''}">
                    <div class="tracker-icon"><i class="bi bi-house-check"></i></div>
                    <div class="tracker-label d-none d-sm-block">Delivered</div>
                </div>
            </div>`;

        return `
            <div class="card border-0 shadow-sm rounded-4 mb-4">
                <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                    <div><span class="d-block text-muted small mb-1">Order Placed</span><h6 class="fw-bold mb-0">${new Date(order.date).toLocaleDateString()}</h6></div>
                    <div class="text-end"><span class="d-block text-muted small mb-1">Total Amount</span><h6 class="fw-bold text-success mb-0">${formatCurrency(order.totalAmount)}</h6></div>
                    <div class="text-end d-none d-md-block"><span class="d-block text-muted small mb-1">Track ID</span><h6 class="fw-bold text-primary font-monospace mb-0">${order.id}</h6></div>
                </div>
                <div class="card-body p-4">
                    <div class="d-flex flex-wrap mb-3 border-bottom pb-3">${itemsHtml}</div>
                    ${trackerHtml}
                </div>
            </div>`;
    }

    function renderCustomerOrders(targetEl, orders = []) {
        const finalOrders = sortOrdersByLatest(orders.map(order => normalizeOrderData(order)));
        targetEl.innerHTML = finalOrders.length
            ? finalOrders.map(order => buildCustomerOrderCard(order)).join('')
            : '<div class="text-center py-5 text-muted"><i class="bi bi-bag-x display-1 d-block mb-3"></i><h4>No order history found</h4><a href="index.html" class="btn btn-success mt-3 rounded-pill">Start Shopping</a></div>';
    }

    // Copy UPI ID to clipboard
    window.copyUPIId = function() {
        const upiId = document.getElementById('upiId');
        const copyMessage = document.getElementById('copyMessage');
        const copyIcon = document.getElementById('copyIcon');
        const copyText = document.getElementById('copyText');
        
        if (upiId) {
            const textToCopy = upiId.textContent.trim();
            
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showCopySuccess(copyMessage, copyIcon, copyText);
                }).catch(() => {
                    // Fallback for older browsers
                    fallbackCopy(upiId, copyMessage, copyIcon, copyText);
                });
            } else {
                // Fallback for older browsers
                fallbackCopy(upiId, copyMessage, copyIcon, copyText);
            }
        }
    };
    
    function showCopySuccess(copyMessage, copyIcon, copyText) {
        // Show success message
        if (copyMessage) {
            copyMessage.classList.add('show');
            setTimeout(() => {
                copyMessage.classList.remove('show');
            }, 3000);
        }
        
        // Update button icon temporarily
        if (copyIcon) {
            copyIcon.classList.remove('bi-clipboard');
            copyIcon.classList.add('bi-check-lg');
        }
        if (copyText) {
            copyText.textContent = 'Copied!';
        }
        
        // Reset after 2 seconds
        setTimeout(() => {
            if (copyIcon) {
                copyIcon.classList.remove('bi-check-lg');
                copyIcon.classList.add('bi-clipboard');
            }
            if (copyText) {
                copyText.textContent = 'Copy';
            }
        }, 2000);
    }
    
    function fallbackCopy(element, copyMessage, copyIcon, copyText) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
            document.execCommand('copy');
            showCopySuccess(copyMessage, copyIcon, copyText);
        } catch (err) {
            console.error('Failed to copy UPI ID:', err);
            if (window.showToast) {
                window.showToast('Copy Failed', 'Please manually select and copy the UPI ID.', true);
            }
        }
        
        selection.removeAllRanges();
    }

    // UPI Payment - Direct App Redirect
    window.payWithUPI = function(app) {
        // Reload cart to get latest data
        cart = JSON.parse(localStorage.getItem('yadavCart')) || [];
        
        // Get payment amount from cart
        const subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal + (subtotal * 0.05));
        
        // Get UPI details - either from Firebase settings or default
        const upiIdElement = document.getElementById('upiId');
        const upiID = upiIdElement ? upiIdElement.textContent.trim() : 'yadav.store@okicici';
        const payeeName = 'Yadav Veggies & Ice-Cream'; // Can be made dynamic later
        const amount = total.toFixed(2);
        const note = `Order Payment`;
        
        console.log('Initiating UPI payment to:', upiID, 'Amount:', amount, 'Cart items:', cart.length);
        
        // Create UPI Intent URL
        const upiURL = `upi://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
        
        // Check if on mobile device
        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
        
        if (!isMobile) {
            // Desktop: Show message to use mobile device
            if (window.showToast) {
                window.showToast('Mobile Only', 'UPI payment requires a mobile device. Please use your phone or scan the QR code.', true);
            } else {
                alert('UPI payment is only available on mobile devices. Please use your phone to complete this payment.');
            }
            return;
        }
        
        // Try to open UPI app based on selection
        if (app === 'any') {
            // Use generic UPI intent (Android) or universal link (iOS)
            window.location.href = upiURL;
        } else if (app === 'phonepe') {
            // PhonePe specific intent - use generic UPI with mode parameter
            // PhonePe responds to upi:// scheme with proper parameters
            const phonepeURL = `upi://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&mode=01`;
            window.location.href = phonepeURL;
            
            // Fallback: Try to open PhonePe directly using Android intent
            setTimeout(() => {
                if (document.hasFocus()) {
                    // Android intent to open PhonePe specifically
                    window.location.href = `intent://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.phonepe.app;end`;
                }
            }, 1500);
        } else if (app === 'paytm') {
            // Paytm specific intent
            const paytmURL = `paytmmp://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            window.location.href = paytmURL;
        } else if (app === 'gpay') {
            // Google Pay specific intent
            const gpayURL = `tez://upi/pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            window.location.href = gpayURL;
        }
        
        // Show feedback that app is opening
        if (window.showToast) {
            window.showToast('Opening App', `Paying ${formatCurrency(total)} to ${upiID}...`);
        }
        
        // After 3 seconds, check if user might need to fallback to QR code
        setTimeout(() => {
            if (window.showToast) {
                window.showToast('Payment Pending', 'If the app didn\'t open, please scan the QR code or copy the UPI ID.', true);
            }
        }, 3000);
    };

    const payBtn = document.getElementById('payNowBtn');
    if (payBtn) {
        // Reload cart from localStorage to ensure fresh data
        cart = JSON.parse(localStorage.getItem('yadavCart')) || [];
        
        let subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal + (subtotal * 0.05));
        
        console.log('Payment page - Cart loaded:', cart.length, 'items, Total:', total);

        let html = '';
        if (cart.length > 0) {
            cart.forEach(item => {
                html += `<div class="order-item">
                    <img src="${item.image}" class="order-item-img" alt="${item.title}">
                    <div class="order-item-details">
                        <h6 class="order-item-title">${item.title}</h6>
                        <span class="order-item-qty">Qty: ${item.quantity}</span>
                    </div>
                    <span class="order-item-price">${formatCurrency(item.price * item.quantity)}</span>
                </div>`;
            });
        } else {
            html = '<p class="text-muted text-center py-4">Your cart is empty</p>';
        }
        
        if (document.getElementById('paymentCartItems')) document.getElementById('paymentCartItems').innerHTML = html;
        if (document.getElementById('paymentSubtotal')) document.getElementById('paymentSubtotal').innerText = formatCurrency(subtotal);
        if (document.getElementById('paymentTotal')) document.getElementById('paymentTotal').innerText = formatCurrency(total);
        if (document.getElementById('paymentTotalMobile')) document.getElementById('paymentTotalMobile').innerText = formatCurrency(total);
        
        // Update button text for mobile
        payBtn.innerHTML = `<i class="bi bi-lock-fill"></i><span>Pay ${formatCurrency(total)}</span>`;

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
                const batch = window.db.batch();
                const globalOrderRef = window.db.collection('orders').doc(orderId);
                const userOrderRef = window.db.collection('users').doc(currentUser.uid).collection('my_orders').doc(orderId);

                batch.set(globalOrderRef, orderData);
                batch.set(userOrderRef, orderData);
                await batch.commit();

                window.showToast('Success!', `Payment Success! Your order ${orderId} has been placed.`);

                cart = [];
                saveCart();
                setTimeout(() => window.location.href = 'orders.html', 2000);
            } catch (e) {
                console.error("Order save sync error:", e);
                window.showToast('Error', 'Error placing order! Check your internet connection or DB Rules.', true);
                payBtn.innerText = `Pay Now ${formatCurrency(total)}`;
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
                    window.db.collection('users')
                        .doc(user.uid)
                        .collection('my_orders')
                        .onSnapshot(async (querySnapshot) => {
                            if (querySnapshot.empty) {
                                const fallbackOrders = await fetchGlobalOrdersForUser(user.uid);
                                if (fallbackOrders.length) {
                                    await mirrorOrdersToUserCollection(user.uid, fallbackOrders);
                                }
                                renderCustomerOrders(customerOrdersGrid, fallbackOrders);
                                return;
                            }
                            const liveOrders = await hydrateCustomerOrders(user, querySnapshot.docs);
                            renderCustomerOrders(customerOrdersGrid, liveOrders);
                        }, async (error) => {
                            console.error('User order listener failed:', error);
                            try {
                                const fallbackOrders = await fetchGlobalOrdersForUser(user.uid);
                                if (fallbackOrders.length) {
                                    await mirrorOrdersToUserCollection(user.uid, fallbackOrders);
                                }
                                renderCustomerOrders(customerOrdersGrid, fallbackOrders);
                            } catch (fallbackError) {
                                console.error('Fallback order fetch failed:', fallbackError);
                                customerOrdersGrid.innerHTML = '<div class="text-center py-5 text-danger"><i class="bi bi-exclamation-triangle display-1 d-block mb-3"></i><h4>Permission Error loading orders</h4><p class="small">User orders could not be loaded from Firebase.</p></div>';
                            }
                        });
                    return;

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
                                if (sStr.includes("pack")) progWidth = "50%";
                                if (sStr.includes("ship") || sStr.includes("out")) progWidth = "75%";
                                if (sStr.includes("deliver")) progWidth = "100%";
                                let s1 = true, s2 = parseInt(progWidth) >= 50, s3 = parseInt(progWidth) >= 75, s4 = parseInt(progWidth) === 100;

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
                                        <div class="text-end"><span class="d-block text-muted small mb-1">Total Amount</span><h6 class="fw-bold text-success mb-0">${formatCurrency(o.totalAmount)}</h6></div>
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
        const ADMIN_ORDER_STATUSES = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

        window.updateAdminOrderStatus = async function (orderId, uid, nextStatus) {
            try {
                const batch = window.db.batch();
                const globalOrderRef = window.db.collection('orders').doc(orderId);
                batch.set(globalOrderRef, {
                    status: nextStatus,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                if (uid) {
                    const userOrderRef = window.db.collection('users').doc(uid).collection('my_orders').doc(orderId);
                    batch.set(userOrderRef, {
                        status: nextStatus,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }

                await batch.commit();
                if (window.showToast) window.showToast('Updated', `Order ${orderId} moved to ${nextStatus}.`);
                if (window.refreshAdminOrdersTable) {
                    await window.refreshAdminOrdersTable();
                }
                if (window.loadDashboardAnalytics) {
                    window.loadDashboardAnalytics();
                }
            } catch (error) {
                console.error('Order status update failed:', error);
                if (window.showToast) window.showToast('Error', error.message, true);
            }
        };

        async function loadAdminData() {
            try {
                // Warning: In production, grabbing entire "orders" collection requires admin auth rules!
                const querySnapshot = await window.db.collection("orders").orderBy("createdAt", "desc").get();

                let rev = 0;
                let tableHtml = '';
                querySnapshot.forEach((doc) => {
                    const o = doc.data();
                    const amount = Number(o.totalAmount ?? o.totalPrice ?? 0) || 0;
                    rev += amount;
                    let names = (o.items || []).map(i => `<span class="badge bg-light text-dark border me-1 mb-1">${i.quantity}x ${i.title}</span>`).join('');
                    let d = (typeof window.getAdminOrderDate === 'function') ? window.getAdminOrderDate(o) : new Date(o.date);
                    const statusOptions = ADMIN_ORDER_STATUSES.map(status => `<option value="${status}" ${status === (o.status || 'Processing') ? 'selected' : ''}>${status}</option>`).join('');
                    tableHtml += `
                    <tr>
                        <td class="fw-bold font-monospace text-primary">${o.id}</td>
                        <td class="text-muted small">${d.toLocaleDateString()} ${d.toLocaleTimeString()}</td>
                        <td>${o.customerName}<br><small class="text-muted">${o.customerEmail}</small></td>
                        <td>${names}</td>
                        <td class="fw-bold text-success">${formatCurrency(amount)}</td>
                        <td class="admin-order-status-cell">
                            <select class="form-select form-select-sm admin-order-status-select shadow-none border-success" onchange="window.updateAdminOrderStatus('${o.id}', '${o.uid || ''}', this.value)">
                                ${statusOptions}
                            </select>
                        </td>
                    </tr>`;
                });

                document.getElementById('totalSalesVal').innerText = formatCurrency(rev);
                document.getElementById('totalOrdersCount').innerText = querySnapshot.size;
                document.getElementById('adminTableBody').innerHTML = tableHtml || '<tr><td colspan="6" class="text-center py-4">No real orders found in Firebase.</td></tr>';
            } catch (e) {
                console.error(e);
                document.getElementById('adminTableBody').innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Firebase Error: ${e.message}. Are your DB rules public/test mode?</td></tr>`;
            }
        }
        window.refreshAdminOrdersTable = loadAdminData;
        loadAdminData();
    }

    // Sticky Floats
    const floatHtml = `<button id="scrollToTopBtn" class="sticky-icon scroll-top-icon" title="Go to top"><i class="bi bi-arrow-up"></i></button>`;
    const floatDiv = document.createElement('div'); floatDiv.innerHTML = floatHtml; document.body.appendChild(floatDiv);
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    window.addEventListener('scroll', () => { if (window.scrollY > 300) scrollToTopBtn.classList.add('show'); else scrollToTopBtn.classList.remove('show'); });
    scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    // ==========================================
    // 10. GLOBAL EVENT DELEGATION (Static Elements)
    // ==========================================
    document.addEventListener('click', function (e) {
        const favoriteHeaderLink = e.target.closest('a[title="Favorites"], a[title="Saved Favorites"], a[title="Login to save favorites"]');
        if (favoriteHeaderLink) {
            e.preventDefault();
            if (window.auth?.currentUser) {
                window.location.href = 'favorites.html';
            } else {
                window.showToast('Login Required', 'Please log in to view your saved favorites.', true);
                setTimeout(() => window.location.href = 'login.html', 800);
            }
            return;
        }

        const wishlistBtn = e.target.closest('.wishlist-btn');
        if (wishlistBtn) {
            e.preventDefault();
            if (wishlistBtn.dataset.id && window.toggleWishlist) {
                window.toggleWishlist(wishlistBtn.dataset.id);
            }
            return;
        }

        // Handle static Add to Cart buttons
        const addBtn = e.target.closest('.dynamic-add-cart');
        if (addBtn && !addBtn.dataset.bound) { // Prevent double-firing if already bound in dynamic grid
            e.preventDefault();
            if (addBtn.dataset.prod) {
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
        if (viewBtn && !viewBtn.dataset.bound) {
            e.preventDefault();
            if (viewBtn.dataset.prod && window.openModalFromData) {
                window.openModalFromData(viewBtn.dataset.prod);
            }
        }
    });

    const newsletterEmailInput = document.getElementById('newsletterEmail');
    const newsletterBtn = document.getElementById('newsletterSubscribeBtn');
    if (newsletterEmailInput && newsletterBtn) {
        const submitNewsletterLead = async () => {
            const email = newsletterEmailInput.value.trim().toLowerCase();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                window.showToast('Invalid Email', 'Please enter a valid email address to unlock your offer.', true);
                newsletterEmailInput.focus();
                return;
            }

            newsletterBtn.disabled = true;
            const originalLabel = newsletterBtn.innerHTML;
            newsletterBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving';

            try {
                await window.db.collection('newsletter_leads').doc(email).set({
                    email,
                    source: 'homepage_cta',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                newsletterEmailInput.value = '';
                window.showToast('Offer Unlocked', 'Welcome aboard. Use code YADAV20 on your first order.');
            } catch (error) {
                console.error('Newsletter save failed:', error);
                window.showToast('Sync Delayed', 'Your discount code is YADAV20. Please try again in a moment.', true);
            } finally {
                newsletterBtn.disabled = false;
                newsletterBtn.innerHTML = originalLabel;
            }
        };

        newsletterBtn.addEventListener('click', submitNewsletterLead);
        newsletterEmailInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitNewsletterLead();
            }
        });
    }
    // ==========================================
    // 11. DARK MODE & AOS INITIALIZATION
    // ==========================================
    const isAdminDashboard = document.body.classList.contains('admin-dashboard');
    const savedTheme = localStorage.getItem('yadavTheme') || 'light';
    if (!isAdminDashboard && savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    if (isAdminDashboard) {
        document.body.classList.remove('dark-mode');
    }

    // Attach listener to any theme toggle buttons on page
    document.addEventListener('click', (e) => {
        const themeToggleBtn = e.target.closest('.theme-toggle-btn');
        if (themeToggleBtn) {
            e.preventDefault();
            if (document.body.classList.contains('admin-dashboard')) return;
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('yadavTheme', isDark ? 'dark' : 'light');

            // Sync all toggle icons on the page
            document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
                if (isDark) {
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
    if (!isAdminDashboard && savedTheme === 'dark') {
        document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
            icon.classList.remove('bi-moon', 'text-dark');
            icon.classList.add('bi-sun', 'text-warning');
        });
    }

    // Initialize animations if AOS exists (storefront only — admin stays calm)
    if (typeof window.AOS !== 'undefined' && !document.body.classList.contains('admin-dashboard')) {
        window.AOS.init({
            once: true,
            duration: 780,
            easing: 'ease-out',
            offset: 48,
            delay: 0
        });
    }

    // Hero typewriter (index.html carousel headlines)
    (function initHeroTypewriter() {
        if (document.body.classList.contains('admin-dashboard')) return;
        const carousel = document.getElementById('heroCarousel');
        if (!carousel) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let typewriterGen = 0;

        function typeHeroTitle(slideEl) {
            const h1 = slideEl && slideEl.querySelector('.hero-typewriter');
            if (!h1) return;

            const myGen = ++typewriterGen;
            const l1 = h1.querySelector('.hero-type-line1');
            const l2 = h1.querySelector('.hero-type-line2');
            const cur = h1.querySelector('.hero-type-cursor');
            const line1 = (h1.dataset.typeLine1 || '').trim();
            const line2 = (h1.dataset.typeLine2 || '').trim();
            const accentPink = h1.dataset.typeAccent === 'pink';

            l2.className = 'hero-type-line2 ' + (accentPink ? 'text-pink' : 'text-success');

            if (!l1 || !l2) return;

            if (reduceMotion) {
                l1.textContent = line1;
                l2.textContent = line2;
                if (cur) cur.style.display = 'none';
                return;
            }

            l1.textContent = '';
            l2.textContent = '';
            if (cur) {
                cur.style.display = 'inline';
                cur.classList.remove('hero-type-cursor-done');
            }

            const speed = 52;
            let idx = 0;

            function typeLine1() {
                if (myGen !== typewriterGen) return;
                if (idx < line1.length) {
                    l1.textContent += line1[idx];
                    idx += 1;
                    setTimeout(typeLine1, speed);
                } else {
                    idx = 0;
                    setTimeout(typeLine2, 380);
                }
            }

            function typeLine2() {
                if (myGen !== typewriterGen) return;
                if (idx < line2.length) {
                    l2.textContent += line2[idx];
                    idx += 1;
                    setTimeout(typeLine2, speed);
                } else if (cur) {
                    cur.classList.add('hero-type-cursor-done');
                    setTimeout(() => {
                        if (myGen === typewriterGen) cur.style.display = 'none';
                    }, 900);
                }
            }

            typeLine1();
        }

        const firstActive = carousel.querySelector('.carousel-item.active');
        if (firstActive) {
            typeHeroTitle(firstActive);
        }

        carousel.addEventListener('slid.bs.carousel', (e) => {
            if (e.relatedTarget) typeHeroTitle(e.relatedTarget);
        });
    })();

    // ==========================================
    // 12. AI SALES ASSISTANT CHATBOT
    // ==========================================
    (function initAIChatbot() {
        if (document.getElementById('aiChatbotContainer')) return;
        if (document.body.classList.contains('admin-dashboard')) return;

        const botHtml = `
        <div id="aiChatbotContainer">
            <div id="aiChatbotWindow">
                <div class="chatbot-header">
                    <div class="chatbot-header-title">
                        <span class="fs-4">🥦</span>
                        <div>
                            <div style="font-size:1rem; line-height:1.2;">Yadav Sales AI</div>
                            <div style="font-size:0.75rem; font-weight:normal; opacity:0.9;">Online & Ready to Help</div>
                        </div>
                    </div>
                    <button class="chatbot-header-btn" id="closeChatBtn" aria-label="Close Chat"><i class="bi bi-x-lg"></i></button>
                </div>
                <div class="chatbot-messages" id="chatMsgs">
                    <!-- Messages go here -->
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" class="chat-input" placeholder="Type a message..." autocomplete="off">
                    <button id="chatSendBtn" class="chat-send-btn" aria-label="Send Message"><i class="bi bi-send-fill"></i></button>
                </div>
            </div>
            <button id="aiChatbotToggleBtn" title="Chat with Us"><i class="bi bi-chat-dots-fill"></i></button>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', botHtml);

        const toggleBtn = document.getElementById('aiChatbotToggleBtn');
        const closeBtn = document.getElementById('closeChatBtn');
        const chatWindow = document.getElementById('aiChatbotWindow');
        const chatMsgs = document.getElementById('chatMsgs');
        const chatInput = document.getElementById('chatInput');
        const chatSendBtn = document.getElementById('chatSendBtn');

        let chatState = 'START';
        let orderDetails = { name: '', address: '', phone: '', items: '' };

        function scrollToBottom() {
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
        }

        function addMessage(text, sender, chips = []) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-msg ${sender}`;
            msgDiv.innerHTML = text;

            if (chips.length > 0 && sender === 'bot') {
                const chipsDiv = document.createElement('div');
                chipsDiv.className = 'chat-quick-replies';
                chips.forEach(chipText => {
                    const c = document.createElement('div');
                    c.className = 'chat-chip';
                    c.innerText = chipText;
                    c.onclick = () => {
                        handleUserInput(chipText);
                    };
                    chipsDiv.appendChild(c);
                });
                msgDiv.appendChild(chipsDiv);
            }

            chatMsgs.appendChild(msgDiv);
            scrollToBottom();
        }

        const GEMINI_API_KEY = "AIzaSyC4Ba9yHYSwkQlZzXtkYOCxjMxwfgrwUTo"; // Put your Real Google Gemini API Key here!!!

        // Generate dynamic context from catalog.js if available
        function getStoreContext() {
            let context = "You are a smart AI sales assistant for 'Yadav Veggies & Fruits' (Location: Gandhipath Jaipur, Rajasthan). Tone: Friendly, polite, short responses, mix of Hindi+English (Hinglish). Add emojis like 🥦🍎. Your goal is to convert users to customers. You can accept orders by asking for Name, Address, Phone, and Items.";
            if (window.catalogProducts && window.catalogProducts.length > 0) {
                context += "\\nHere is our current live inventory & prices:\\n";
                window.catalogProducts.slice(0, 25).forEach(p => {
                    context += `- ${p.title} (${p.category}): ₹${p.price}\\n`;
                });
            } else {
                context += "\\nWe sell fresh vegetables like tomato, potato, broccoli and fruits like apples, bananas, mangoes, and premium Ice creams.";
            }
            context += "\\nRules: Keep answers under 3-4 sentences. Only quote exactly from inventory. Encourage them to buy it immediately. Format text with standard HTML if needed.";
            return context;
        }

        async function processAiLogic(input) {
            if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
                // Fallback to old simple logic if API key isn't set yet!
                const lowerInput = input.toLowerCase();
                if (lowerInput.includes('order')) {
                    addMessage("Order karne ke liye please apna Name, Address aur order list yaha likh dein. Hum jald deliver karenge! 🚚 (Note: Real AI feature is active but needs an API Key inside script.js to work!)", 'bot');
                } else {
                    addMessage("Namaste 🙏 Main Yadav Veggies ka naya Smart AI Assistant hu. Par mera asli dimaag tab chalega jab aap `script.js` me meri `GEMINI_API_KEY` daal denge! 😅 Ek bar daal dijiye, phir dekhiye mera jaadu!", 'bot');
                }
                return;
            }

            // Show typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'aiTyping';
            typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            chatMsgs.appendChild(typingDiv);
            scrollToBottom();

            try {
                const sysPrompt = getStoreContext();
                const payload = {
                    contents: [{ parts: [{ text: "Context: " + sysPrompt + "\\n\\nUser Says: " + input }] }]
                };

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                const typEl = document.getElementById('aiTyping');
                if (typEl) typEl.remove();

                if (data.error) {
                    addMessage("Maaf karna, mera API connection abhi work nahi kar raha. " + data.error.message, 'bot');
                    return;
                }

                if (data.candidates && data.candidates.length > 0) {
                    let aiText = data.candidates[0].content.parts[0].text;
                    aiText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    aiText = aiText.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    addMessage(aiText, 'bot');
                }

            } catch (e) {
                const typEl = document.getElementById('aiTyping');
                if (typEl) typEl.remove();
                addMessage("Oops! Thoda network/connection issue ho gaya. Humari sabzi ekdum fresh hai, aur website smooth! (" + e.message + ")", 'bot');
            }
        }

        function handleUserInput(text = null) {
            const val = text || chatInput.value.trim();
            if (!val) return;

            if (!text) {
                chatInput.value = '';
            }

            addMessage(val, 'user');

            const existingChips = chatMsgs.querySelectorAll('.chat-quick-replies');
            existingChips.forEach(c => c.remove());

            setTimeout(() => {
                processAiLogic(val);
            }, 500); // 500ms delay to feel AI natural
        }

        chatSendBtn.addEventListener('click', () => handleUserInput());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserInput();
        });

        let botInit = false;
        toggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('show');
            if (chatWindow.classList.contains('show')) {
                if (!botInit) {
                    botInit = true;
                    addMessage("Namaste 🙏 Welcome to Yadav Veggies & Fruits! Aapko kya chahiye — fresh sabzi ya fruits? 😊", 'bot', ["Sabzi chahiye", "Fruits chahiye", "Order karna hai"]);
                }
                setTimeout(() => chatInput.focus(), 300);
            }
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('show');
        });
    })();
});
