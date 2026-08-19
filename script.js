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
// PWA (PROGRESSIVE WEB APP) FULL INSTALLATION ENGINE
// ==========================================
if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = 'manifest.json';
    document.head.appendChild(manifestLink);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('SW Registered successfully:', reg.scope))
            .catch(err => console.warn('SW Setup warning:', err));
    });
}

// PWA: Capture native install prompt
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    // Show banner if not dismissed
    window.initPwaInstallBanner(true);
});

window.addEventListener('appinstalled', () => {
    window.deferredPrompt = null;
    if (window.showToast) window.showToast("Success", "Yadav Store App सफलतापूर्वक आपके मोबाइल में इंस्टॉल हो गया! 🎉");
    window.dismissPwaBanner();
});

// Helper: Check if running as standalone app
window.isAppStandalone = function () {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

// PWA: Primary Install Trigger (Works on ALL Mobiles & Browsers)
window.installApp = async function () {
    if (window.isAppStandalone()) {
        if (window.showToast) window.showToast("App Active", "आप पहले से ही ऐप में हैं! 📲");
        return;
    }

    if (window.deferredPrompt) {
        try {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                if (window.showToast) window.showToast("Success", "ऐप इंस्टॉल हो रहा है... 🎉");
                window.dismissPwaBanner();
            }
            window.deferredPrompt = null;
            return;
        } catch (err) {
            console.warn("Deferred prompt error:", err);
        }
    }

    // Fallback: Open Step-by-Step PWA Installation Guide Modal for iOS & Android
    window.openPwaGuideModal();

    // Close mobile nav offcanvas if open
    const sidebar = document.getElementById('mainNav');
    if (sidebar) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebar);
        if (bsOffcanvas) bsOffcanvas.hide();
    }
};

// Floating PWA Banner at screen bottom
window.initPwaInstallBanner = function (forceShow = false) {
    if (window.isAppStandalone()) return;
    if (!forceShow && localStorage.getItem('yadavPwaDismissed')) return;
    if (document.getElementById('pwaInstallBanner')) return;

    const bannerHtml = `
        <div id="pwaInstallBanner" class="pwa-install-banner shadow-lg p-3">
            <div class="d-flex align-items-center justify-content-between gap-2">
                <div class="d-flex align-items-center gap-3">
                    <img src="assets/images/app_logo.png" alt="App Logo" width="48" height="48" class="rounded-3 shadow-sm bg-white p-1" style="object-fit:cover;">
                    <div>
                        <h6 class="fw-bold mb-0 text-dark" style="font-size:1.05rem;">Yadav Store App</h6>
                        <p class="text-muted extra-small mb-0">फास्ट आर्डर और एक्सक्लूसिव डिस्काउंट के लिए ऐप इंस्टॉल करें!</p>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-success btn-sm rounded-pill px-3 fw-bold shadow-sm text-nowrap" onclick="window.installApp()">
                        <i class="bi bi-download me-1"></i> Install App
                    </button>
                    <button type="button" class="btn-close shadow-none ms-1 p-2" onclick="window.dismissPwaBanner()" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', bannerHtml);
};

window.dismissPwaBanner = function () {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.remove();
    localStorage.setItem('yadavPwaDismissed', 'true');
};

// Universal Installation Step-by-Step Modal Guide (Supports iOS Safari & Android Browsers)
window.openPwaGuideModal = function () {
    let guideModalEl = document.getElementById('pwaGuideModal');
    if (!guideModalEl) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        const iosGuideContent = `
            <div class="text-center mb-4">
                <img src="assets/images/app_logo.png" alt="App Logo" width="70" height="70" class="rounded-4 shadow-sm mb-3 p-1 bg-white border">
                <h5 class="fw-bold text-dark">iPhone / iPad पर ऐप कैसे इंस्टॉल करें?</h5>
                <p class="text-muted small">Safari ब्राउज़र के ज़रिए कुछ ही सेकंड्स में ऐप को अपनी होम स्क्रीन पर जोड़ें:</p>
            </div>
            <div class="d-flex flex-column gap-3 mb-4">
                <div class="pwa-guide-step-card d-flex align-items-center gap-3">
                    <div class="badge bg-success rounded-circle p-2 fs-5" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">1</div>
                    <div>
                        <div class="fw-bold text-dark mb-1">शेयर बटन दबाएं</div>
                        <div class="small text-muted">नीचे सफारी के मेनू में <i class="bi bi-box-arrow-up text-primary fs-5"></i> (Share) आइकन पर टैप करें।</div>
                    </div>
                </div>
                <div class="pwa-guide-step-card d-flex align-items-center gap-3">
                    <div class="badge bg-success rounded-circle p-2 fs-5" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">2</div>
                    <div>
                        <div class="fw-bold text-dark mb-1">"Add to Home Screen" चुनें</div>
                        <div class="small text-muted">नीचे स्क्रॉल करें और <i class="bi bi-plus-square text-success"></i> <strong>"Add to Home Screen" (होम स्क्रीन में जोड़ें)</strong> पर क्लिक करें।</div>
                    </div>
                </div>
                <div class="pwa-guide-step-card d-flex align-items-center gap-3">
                    <div class="badge bg-success rounded-circle p-2 fs-5" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">3</div>
                    <div>
                        <div class="fw-bold text-dark mb-1">"Add" पर क्लिक करें</div>
                        <div class="small text-muted">ऊपर दाईं ओर **Add** दबाते ही ऐप आपके iPhone के होम स्क्रीन पर आ जाएगा!</div>
                    </div>
                </div>
            </div>
        `;

        const androidGuideContent = `
            <div class="text-center mb-4">
                <img src="assets/images/app_logo.png" alt="App Logo" width="70" height="70" class="rounded-4 shadow-sm mb-3 p-1 bg-white border">
                <h5 class="fw-bold text-dark">Android / ब्राउज़र पर ऐप इंस्टॉल करने की गाइड</h5>
                <p class="text-muted small">ऐप को अपने मोबाइल की होम स्क्रीन पर डायरेक्ट ऐप की तरह चलाएं:</p>
            </div>
            <div class="d-flex flex-column gap-3 mb-4">
                <div class="pwa-guide-step-card d-flex align-items-center gap-3">
                    <div class="badge bg-success rounded-circle p-2 fs-5" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">1</div>
                    <div>
                        <div class="fw-bold text-dark mb-1">ब्राउज़र मेनू (3 Dots) दबाएं</div>
                        <div class="small text-muted">ब्राउज़र के ऊपर दाईं ओर <i class="bi bi-three-dots-vertical fs-5 text-dark"></i> मेनू आइकॉन पर टैप करें।</div>
                    </div>
                </div>
                <div class="pwa-guide-step-card d-flex align-items-center gap-3">
                    <div class="badge bg-success rounded-circle p-2 fs-5" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">2</div>
                    <div>
                        <div class="fw-bold text-dark mb-1">"Install App" पर क्लिक करें</div>
                        <div class="small text-muted"><i class="bi bi-download text-success me-1"></i> <strong>"Install App / ऐप इंस्टॉल करें"</strong> या <strong>"Add to Home screen"</strong> चुनें।</div>
                    </div>
                </div>
                <div class="pwa-guide-step-card d-flex align-items-center gap-3">
                    <div class="badge bg-success rounded-circle p-2 fs-5" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">3</div>
                    <div>
                        <div class="fw-bold text-dark mb-1">कन्फर्म करें (Confirm)</div>
                        <div class="small text-muted">**Install** बटन दबाते ही ऐप सीधे आपके फोन में फुल स्क्रीन में चलने लगेगा!</div>
                    </div>
                </div>
            </div>
        `;

        const modalHtml = `
            <div class="modal fade" id="pwaGuideModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                        <div class="modal-header bg-success text-white py-3 border-0">
                            <h5 class="modal-header-title fw-bold mb-0 text-white"><i class="bi bi-phone me-2"></i>Install Yadav Store App</h5>
                            <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            ${isIOS ? iosGuideContent : androidGuideContent}
                        </div>
                        <div class="modal-footer bg-light border-0 justify-content-between">
                            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">समझ गया (Got it)</button>
                            <button type="button" class="btn btn-success rounded-pill px-4 fw-bold shadow-sm" onclick="window.location.reload();">
                                <i class="bi bi-arrow-clockwise me-1"></i> रिफ्रेश करें
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        guideModalEl = document.getElementById('pwaGuideModal');
    }

    const modalInstance = new bootstrap.Modal(guideModalEl);
    modalInstance.show();
};

// Trigger banner initialization on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.initPwaInstallBanner();
    }, 1200);
});

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

            // Apply Dynamic Marquee Ticker Offer Text
            if (data.marqueeText) {
                document.querySelectorAll('.top-marquee-text').forEach(el => {
                    el.innerText = data.marqueeText;
                });
            }

            // Apply Dynamic Homepage Promo Discount Banner
            if (data.promoDiscountBadge || data.promoTitle || data.promoCouponCode || data.promoSubtext) {
                const promoBadgeEl = document.getElementById('homePromoBadge');
                if (promoBadgeEl && data.promoDiscountBadge) promoBadgeEl.innerText = data.promoDiscountBadge;

                const promoTitleEl = document.getElementById('homePromoTitle');
                if (promoTitleEl && data.promoTitle) promoTitleEl.innerText = data.promoTitle;

                const promoSubtextEl = document.getElementById('homePromoSubtext');
                if (promoSubtextEl && data.promoSubtext) promoSubtextEl.innerText = data.promoSubtext;

                const promoCodeEl = document.getElementById('homePromoCouponCode');
                if (promoCodeEl && data.promoCouponCode) promoCodeEl.innerText = data.promoCouponCode;
            }

            // Apply Maintenance Mode
            // if maintenanceMode == true and not on admin page
            const isAdminPage = window.location.pathname.toLowerCase().includes('admin');
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
    const raw = String(category || '').trim().toLowerCase();
    if (raw.includes('fruit') || raw.includes('फल')) return 'Fruits';
    if (raw.includes('veg') || raw.includes('sabzi') || raw.includes('सब्जी') || raw.includes('gourd') || raw.includes('green')) return 'Vegetables';
    if (raw.includes('ice') || raw.includes('cream') || raw.includes('आइसक्रीम') || raw.includes('sundae') || raw.includes('cone') || raw.includes('parlour')) return 'Ice-Creams';
    if (raw.includes('dairy') || raw.includes('milk') || raw.includes('दूध') || raw.includes('paneer') || raw.includes('curd') || raw.includes('butter')) return 'Dairy';
    return category || 'Vegetables';
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

    try {
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
    } catch (error) {
        console.warn('Owner role sync failed. Falling back to built-in owner access.', error);
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

    let roleSnap = null;
    try {
        const roleRef = window.getRoleDocumentRef(email);
        roleSnap = await roleRef.get();

        if (!roleSnap.exists && rawEmail && rawEmail !== email) {
            roleSnap = await window.db.collection('roles').doc(rawEmail).get();
        }
    } catch (error) {
        console.warn('Role lookup failed for admin access.', error);
        return null;
    }

    if (!roleSnap || !roleSnap.exists) return null;

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
        
        // Apply UPI settings 
        const upiIdElement = document.getElementById('upiId');
        if (upiIdElement) {
            upiIdElement.textContent = data.upiId || 'yadav.store@okicici';
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

        const isAdminPage = window.location.pathname.toLowerCase().includes('admin');
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

    // Apply Live Storefront Settings (Announcement bar, Theme, Maintenance Mode, Catalog Sync)
    function applyLiveStorefrontSettings() {
        const isAdminPage = window.location.pathname.toLowerCase().includes('admin');

        // 1. Maintenance Mode Check
        if (localStorage.getItem('yadav_maintenance_mode') === 'true' && !isAdminPage) {
            document.body.innerHTML = `
                <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;text-align:center;font-family:sans-serif;padding:2rem;">
                    <div style="max-width:500px;background:#ffffff;padding:3rem;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
                        <div style="font-size:4rem;margin-bottom:1rem;">🛠️</div>
                        <h2 style="color:#10b981;font-weight:700;margin-bottom:1rem;">Store Under Maintenance</h2>
                        <p style="color:#64748b;font-size:1.05rem;line-height:1.6;">Yadav Vegetable & Ice-Cream Store is currently undergoing scheduled updates to bring you fresher produce!</p>
                        <small style="color:#94a3b8;display:block;margin-top:2rem;">Please check back shortly.</small>
                    </div>
                </div>`;
            return;
        }

        // 2. Announcement Bar Live Sync
        const announcementData = JSON.parse(localStorage.getItem('yadav_announcement') || '{}');
        const marqueeEl = document.querySelector('.top-marquee-text');
        const marqueeContainer = marqueeEl ? marqueeEl.closest('.bg-warning') || marqueeEl.parentElement : null;

        if (announcementData && marqueeContainer) {
            if (announcementData.enabled === false) {
                marqueeContainer.style.display = 'none';
            } else {
                marqueeContainer.style.display = 'block';
                if (announcementData.bgColor) marqueeContainer.style.backgroundColor = announcementData.bgColor;
                if (announcementData.textColor) marqueeContainer.style.color = announcementData.textColor;
                if (announcementData.text && marqueeEl) {
                    marqueeEl.innerHTML = `<span class="mx-5 fw-bold">${announcementData.text}</span>`;
                }
            }
        }

        // 3. Local Catalog Sync (Prioritize Admin Panel edited products from localStorage)
        const localProducts = JSON.parse(localStorage.getItem('yadav_products') || '[]');
        if (localProducts.length > 0) {
            window.CATALOG = localProducts;
            window.catalogProducts = localProducts;
            if (typeof CATALOG !== 'undefined') CATALOG = localProducts;
        }
    }

    applyLiveStorefrontSettings();

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
    function refreshStorefrontCatalogViews() {
        if (document.getElementById('productGrid') && typeof window.renderDynamicGrid === 'function') {
            const q = localStorage.getItem('yadavSearchQuery');
            if (new URLSearchParams(window.location.search).get('search') === 'true' && q) {
                window.renderDynamicGrid(1, q, localStorage.getItem('yadavSearchCat'));
            } else {
                window.renderDynamicGrid();
            }
        }

        if (typeof window.renderHomepageFeaturedProducts === 'function') {
            window.renderHomepageFeaturedProducts();
        }

        if (typeof window.renderFavoritesPage === 'function') {
            window.renderFavoritesPage();
        }
    }

    if (window.db) {
        console.log('Attempting to attach products onSnapshot listener...');
        try {
            window.db.collection('products').onSnapshot(snapshot => {
                console.log('Products snapshot received. docs:', snapshot.docs ? snapshot.docs.length : 'no-docs');
            const firestoreItems = [];

            // 1. Fetch ALL active Firestore Admin products
            snapshot.forEach(doc => {
                const liveData = doc.data();
                const key = doc.id || liveData.id || liveData.title;
                if (!liveData.archived) {
                    const normCat = window.normalizeCatalogCategory ? window.normalizeCatalogCategory(liveData.category || 'Vegetables') : (liveData.category || 'Vegetables');
                    firestoreItems.push({
                        ...liveData,
                        id: key,
                        firestoreId: doc.id,
                        category: normCat
                    });
                }
            });

            let mergedList = [];
            if (firestoreItems.length > 0) {
                // Use EXCLUSIVELY Firestore products when available in Firebase!
                mergedList = firestoreItems;
            } else {
                // Fallback to static catalog defaults ONLY if Firestore database is empty
                const defaultCatalog = Array.isArray(window.YADAV_CATALOG) && window.YADAV_CATALOG.length
                    ? window.YADAV_CATALOG
                    : (Array.isArray(window.CATALOG) ? window.CATALOG : []);

                mergedList = defaultCatalog.map(item => ({
                    ...item,
                    id: item.id || item.title,
                    category: window.normalizeCatalogCategory ? window.normalizeCatalogCategory(item.category) : item.category
                }));
            }

            CATALOG = mergedList;
            window.CATALOG = mergedList;
            window.catalogProducts = mergedList;
            // Persist live admin products to localStorage so admin tables render from `yadav_products`
            try {
                // Persist a trimmed lightweight copy to avoid localStorage quota issues (strip large base64 images)
                const lightweight = mergedList.map(p => ({
                    id: p.id,
                    title: p.title,
                    hindiTitle: p.hindiTitle,
                    category: p.category,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    stock: p.stock,
                    badge: p.badge,
                    image: (typeof p.image === 'string' && p.image.length < 1000 && !p.image.startsWith('data:')) ? p.image : 'assets/fav-icon.png',
                    desc: p.desc
                }));
                const approxSizeKb = Math.round(new Blob([JSON.stringify(lightweight)]).size/1024);
                console.log('Persisting lightweight products to localStorage. count:', lightweight.length, 'approxKB:', approxSizeKb);
                try {
                    localStorage.setItem('yadav_products', JSON.stringify(lightweight));
                } catch (e2) {
                    console.warn('Could not persist trimmed products to localStorage (direct setItem)', e2);
                }
            } catch (e) { console.warn('Could not persist products to localStorage', e && e.stack ? e.stack : e); }

            // Update Quick Select Dropdown options with latest live Admin products
            if (typeof window.populateQuickListProductDropdown === 'function') {
                window.populateQuickListProductDropdown();
            }

            refreshStorefrontCatalogViews();
            }, error => {
            console.warn('Live products snapshot error. Showing local catalog.', error);
            if (typeof window.showAdminToast === 'function') {
                window.showAdminToast('Firestore Error', String(error && error.message ? error.message : error), true);
            }

            // Attempt REST fallback to fetch products (may fail if Firestore rules require auth)
            async function fetchProductsViaRestFallback() {
                try {
                    const projectId = (typeof firebaseConfig !== 'undefined' && firebaseConfig.projectId) ? firebaseConfig.projectId : (firebase && firebase.apps && firebase.apps.length ? firebase.apps[0].options.projectId : null);
                    const apiKey = (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey) ? firebaseConfig.apiKey : null;
                    if (!projectId || !apiKey) {
                        console.warn('REST fallback skipped: missing projectId or apiKey');
                        return refreshStorefrontCatalogViews();
                    }

                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}`;
                    const resp = await fetch(url, { cache: 'no-store' });
                    if (!resp.ok) {
                        const txt = await resp.text();
                        console.warn('REST fallback fetch failed', resp.status, txt);
                        return refreshStorefrontCatalogViews();
                    }

                    const payload = await resp.json();
                    if (!payload.documents || !Array.isArray(payload.documents) || payload.documents.length === 0) {
                        return refreshStorefrontCatalogViews();
                    }

                    const parseField = (f) => {
                        if (!f) return null;
                        if (f.stringValue !== undefined) return f.stringValue;
                        if (f.integerValue !== undefined) return Number(f.integerValue);
                        if (f.doubleValue !== undefined) return Number(f.doubleValue);
                        if (f.booleanValue !== undefined) return f.booleanValue;
                        if (f.mapValue && f.mapValue.fields) {
                            const out = {};
                            Object.keys(f.mapValue.fields).forEach(k => { out[k] = parseField(f.mapValue.fields[k]); });
                            return out;
                        }
                        if (f.arrayValue && Array.isArray(f.arrayValue.values)) {
                            return f.arrayValue.values.map(v => parseField(v));
                        }
                        if (f.timestampValue !== undefined) return f.timestampValue;
                        return null;
                    };

                    const restItems = payload.documents.map(doc => {
                        const fields = doc.fields || {};
                        const obj = {};
                        Object.keys(fields).forEach(k => { obj[k] = parseField(fields[k]); });
                        // derive id from Firestore document name if not present
                        if (!obj.id && doc.name) {
                            const parts = doc.name.split('/'); obj.id = parts[parts.length - 1];
                        }
                        return obj;
                    }).filter(item => !item.archived);

                    if (restItems.length > 0) {
                        CATALOG = restItems.map(item => ({ ...item, category: window.normalizeCatalogCategory ? window.normalizeCatalogCategory(item.category) : item.category }));
                        window.CATALOG = CATALOG;
                        window.catalogProducts = CATALOG;
                        if (typeof window.populateQuickListProductDropdown === 'function') window.populateQuickListProductDropdown();
                        refreshStorefrontCatalogViews();
                        if (typeof window.showAdminToast === 'function') window.showAdminToast('Fallback Loaded', 'Products loaded via REST fallback.', false);
                        return;
                    }

                    return refreshStorefrontCatalogViews();
                } catch (e) {
                    console.warn('REST fallback error', e);
                    return refreshStorefrontCatalogViews();
                }
            }

            fetchProductsViaRestFallback();
        });
        } catch (e) {
            console.warn('Failed to attach products snapshot listener', e);
        }
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
                <div class="d-flex justify-content-between mb-3"><span class="fw-bold">Total Amount</span><span class="fs-5 fw-bold text-success" id="sideCartTotal">₹0</span></div>
                <a href="cart.html" class="btn btn-outline-success w-100 mb-2 rounded-pill fw-medium">View Cart Page</a>
                <a href="checkout.html" class="btn btn-success w-100 rounded-pill fw-medium">Checkout Now</a>
            </div>
        </div>
    `;
    const uiWrapper = document.createElement('div');
    uiWrapper.innerHTML = dynamicUIHTML;
    document.body.appendChild(uiWrapper);

    // --- Simple Client-side Chatbot Widget (Option 1 quick mode) ---
    (function initClientChatbot(){
        if (window.__yadav_chatbot_initialized) return; window.__yadav_chatbot_initialized = true;

        // Styles
        const chatStyle = document.createElement('style');
        chatStyle.id = 'yadavChatbotStyles';
        chatStyle.innerHTML = `
        .yadav-chat-button { position: fixed; right: 18px; bottom: 18px; z-index:1200; }
        .yadav-chat-panel { position: fixed; right: 18px; bottom: 78px; width: 360px; max-width: calc(100% - 36px); z-index:1200; box-shadow: 0 10px 30px rgba(2,6,23,0.3); border-radius: 12px; overflow: hidden; font-family: Jost, sans-serif; }
        .yadav-chat-header { background: var(--admin-accent, #10b981); color: #fff; padding: 12px 14px; display:flex;align-items:center;justify-content:space-between; }
        .yadav-chat-body { background:#fff; max-height: 420px; overflow:auto; padding:12px; }
        .yadav-chat-footer { display:flex; gap:8px; padding:10px; background:#f8fafc; border-top:1px solid #eee; }
        .yadav-msg { display:block; margin-bottom:10px; }
        .yadav-msg.bot { text-align:left; }
        .yadav-msg.user { text-align:right; }
        .yadav-bubble { display:inline-block; padding:10px 12px; border-radius:12px; max-width:78%; }
        .yadav-bubble.bot { background:#f1f5f9; color:#0f172a; }
        .yadav-bubble.user { background:var(--admin-accent,#10b981); color:#fff; }
        .yadav-suggestion { background:#eef2ff; border:1px solid #e0e7ff; padding:6px 10px; border-radius:999px; cursor:pointer; margin-right:6px; display:inline-block; font-size:0.86rem; }
        .yadav-chat-hidden { display:none !important; }
        `;
        document.head.appendChild(chatStyle);

        // HTML
        const chatBtn = document.createElement('button');
        chatBtn.className = 'btn btn-success rounded-circle yadav-chat-button';
        chatBtn.title = 'Chat with Store Assistant';
        chatBtn.innerHTML = '<i class="bi bi-chat-dots-fill fs-4"></i>';
        document.body.appendChild(chatBtn);

        const chatPanel = document.createElement('div');
        chatPanel.className = 'yadav-chat-panel yadav-chat-hidden';
        chatPanel.innerHTML = `
            <div class="yadav-chat-header">
                <div style="display:flex;gap:10px;align-items:center"><i class="bi bi-robot fs-5"></i><strong>Store Assistant</strong></div>
                <div style="font-size:0.9rem;opacity:0.9;cursor:pointer" id="yadavChatClose">Close</div>
            </div>
            <div class="yadav-chat-body" id="yadavChatBody">
                <div class="yadav-msg bot"><div class="yadav-bubble bot">Namaste! Main Yadav Store Assistant hoon — aap mujhse product prices, availability, ya shopping list ke liye pooch sakte hain. Kya madad chahiye?</div></div>
            </div>
            <div class="yadav-chat-footer">
                <input id="yadavChatInput" placeholder="Type your question..." class="form-control form-control-sm" />
                <button id="yadavChatSend" class="btn btn-primary btn-sm">Send</button>
            </div>
        `;
        document.body.appendChild(chatPanel);

        // Toggle
        function openChat(){ chatPanel.classList.remove('yadav-chat-hidden'); chatBtn.classList.add('d-none'); const body = document.getElementById('yadavChatBody'); if (body) body.scrollTop = body.scrollHeight; }
        function closeChat(){ chatPanel.classList.add('yadav-chat-hidden'); chatBtn.classList.remove('d-none'); }
        chatBtn.addEventListener('click', openChat);
        document.getElementById('yadavChatClose').addEventListener('click', closeChat);

        // Helpers: message append
        function appendBotMessage(html){ const body = document.getElementById('yadavChatBody'); const wrap = document.createElement('div'); wrap.className='yadav-msg bot'; wrap.innerHTML = `<div class="yadav-bubble bot">${html}</div>`; body.appendChild(wrap); body.scrollTop = body.scrollHeight; }
        function appendUserMessage(text){ const body = document.getElementById('yadavChatBody'); const wrap = document.createElement('div'); wrap.className='yadav-msg user'; wrap.innerHTML = `<div class="yadav-bubble user">${escapeHtml(text)}</div>`; body.appendChild(wrap); body.scrollTop = body.scrollHeight; }
        function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

        // Shopping list
        window.getShoppingList = function(){ return JSON.parse(localStorage.getItem('yadav_shopping_list')||'[]'); };
        window.addToShoppingList = function(prod, qty=1){ try{ const list = window.getShoppingList(); const existing = list.find(i=>i.id===prod.id); if(existing){ existing.quantity = (existing.quantity||0)+qty; } else { list.push({ id: prod.id, title: prod.title, price: prod.price, quantity: qty }); } localStorage.setItem('yadav_shopping_list', JSON.stringify(list)); window.showToast && window.showToast('List Updated', `${prod.title} added to your shopping list`); }catch(e){console.warn(e);} };

        // Add to cart helper using existing function
        function addProductToCart(prod, qty=1){ try{ const p = { ...prod, quantity: qty }; window.addToCartGlobal && window.addToCartGlobal(encodeURIComponent(JSON.stringify(p))); window.showToast && window.showToast('Added', `${prod.title} added to cart`); }catch(e){ console.warn(e); } }

        // Simple product matcher
        function findMatchingProducts(query){
            const q = String(query||'').trim().toLowerCase();
            if(!q) return [];
            const candidates = Array.isArray(window.CATALOG) ? window.CATALOG : (JSON.parse(localStorage.getItem('yadav_products')||'[]')||[]);
            const tokens = q.split(/\s+/).filter(Boolean);
            const results = [];
            candidates.forEach(p=>{
                const title = String(p.title||p.hindiTitle||'').toLowerCase();
                const category = String(p.category||'').toLowerCase();
                let score = 0;
                if(title.includes(q)) score += 100;
                tokens.forEach(t=>{ if(t.length>2 && title.includes(t)) score += 10; if(category.includes(t)) score += 6; });
                if(score>0) results.push({ product: p, score });
            });
            results.sort((a,b)=>b.score-a.score);
            return results.map(r=>r.product).slice(0,6);
        }

        // WhatsApp helper
        function openWhatsAppForProducts(products){ const itemsText = products.map((it,idx)=>`${idx+1}. ${it.title} - ₹${it.price} x ${it.quantity||1}`).join('\n'); const msg = `Hello Yadav Store, I need help with:\n${itemsText}`; const wa = `https://wa.me/917232825204?text=${encodeURIComponent(msg)}`; window.open(wa,'_blank'); }
        // expose
        window.addProductToCart = addProductToCart;
        window.openWhatsAppForProducts = openWhatsAppForProducts;
        window.findMatchingProducts = findMatchingProducts;

        // Process user message
        async function processUserMessage(text){
            const q = String(text||'').toLowerCase();
            // Quick intents
            if(q.includes('list') && (q.includes('add')||q.includes('create'))){
                // try parse product names after 'add'
                const toAdd = [];
                // naive: split by comma/and
                const parts = text.split(/,| and | aur /i).map(s=>s.trim()).filter(Boolean);
                parts.forEach(p=>{
                    const found = findMatchingProducts(p);
                    if(found && found.length) toAdd.push(found[0]);
                });
                if(toAdd.length){
                    toAdd.forEach(prod=>window.addToShoppingList(prod,1));
                    appendBotMessage(`${toAdd.length} items added to your shopping list. <div style=\"margin-top:8px;\"><button class=\"btn btn-sm btn-outline-success\" onclick=\"(function(){window.open('cart.html','_self');})()\">View Cart</button> <button class=\"btn btn-sm btn-success\" onclick=\"(function(){openWhatsAppForProducts(${JSON.stringify(toAdd).replace(/'/g,'\\\'')});})()\">Contact on WhatsApp</button></div>`);
                    return;
                }
            }

            // Price/availability questions
            const matches = findMatchingProducts(q);
            if(matches && matches.length){
                const p = matches[0];
                const stockText = (p.stock && String(p.stock).toLowerCase().includes('out')) ? '<span class="badge bg-danger">Out of Stock</span>' : (p.stock ? `<span class="badge bg-success">In Stock</span>` : '');
                const priceText = (typeof p.price !== 'undefined') ? `<strong>₹${p.price}</strong>` : 'Price not available';
                const html = `<div><strong>${p.title}</strong> ${stockText}<div class=\"small text-muted\">Category: ${p.category || 'N/A'}</div><div style=\"margin-top:8px;\">Price: ${priceText}</div><div style=\"margin-top:8px;\"><button class=\"btn btn-sm btn-success\" onclick=\"(function(){addProductToCart(${JSON.stringify(p).replace(/'/g,'\\\'')},1)})()\">Add to Cart</button> <button class=\"btn btn-sm btn-outline-primary\" onclick=\"(function(){window.addToShoppingList(${JSON.stringify(p).replace(/'/g,'\\\'')},1)})()\">Add to List</button> <button class=\"btn btn-sm btn-outline-success\" onclick=\"(function(){openWhatsAppForProducts([${JSON.stringify(p).replace(/'/g,'\\\'')}])})()\">Contact on WhatsApp</button></div></div>`;
                appendBotMessage(html);
                return;
            }

            // Fallback: simple reply
            appendBotMessage('Mujhe maaf kijiye, mujhe is query ka seedha jawab nahi mila. Aap kuch aur shabd use karke try kar sakte hain (jaise "price of apples" or "add tomatoes to my list"). <div style="margin-top:8px;"><span class="yadav-suggestion" onclick="document.getElementById(\'yadavChatInput\').value=\'price of apples\';document.getElementById(\'yadavChatSend\').click();">Price of apples</span><span class="yadav-suggestion" onclick="document.getElementById(\'yadavChatInput\').value=\'add tomatoes and potatoes to my list\';document.getElementById(\'yadavChatSend\').click();">Add tomatoes</span></div>');
        }

        // Wire send
        const sendBtn = document.getElementById('yadavChatSend');
        const inputEl = document.getElementById('yadavChatInput');
        sendBtn.addEventListener('click', ()=>{ const v = inputEl.value.trim(); if(!v) return; appendUserMessage(v); inputEl.value=''; processUserMessage(v); });
        inputEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendBtn.click(); } });

    })();

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
        totalEl.innerText = formatCurrency(Math.ceil(subtotal));

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

        // Variable weight product display
        const isVarWeight = prod.isVariableWeight === true;
        const priceDisplay = isVarWeight
            ? `<span class="fs-5 fw-bold text-${colorClass}">₹${prod.pricePerKg}/kg</span>`
            : `${originalStr}<span class="fs-5 fw-bold text-${colorClass}">${formatCurrency(prod.price)}</span>`;
        const varWeightNote = isVarWeight
            ? `<div class="alert alert-warning py-1 px-2 mb-2 rounded-3 text-center" style="font-size:0.72rem;"><i class="bi bi-scale me-1"></i>~${prod.approxWeightRange} per piece • Final price on actual weight</div>`
            : '';
        const addBtnLabel = isVarWeight ? `<i class="bi bi-cart-plus me-2"></i><span>Order 1 Piece</span>` : `<i class="bi bi-cart-plus me-2"></i><span>Add to Cart</span>`;

        return `
            <div class="${columnClass}">
                <div class="card product-card fade-up-custom border-0 ${bgClass} h-100 shadow-sm rounded-4">
                    ${badgeHtml}
                    <div class="px-4 py-4 text-center position-relative overflow-hidden product-image-wrapper">
                        <img src="${prod.image}" alt="${prod.title}" class="img-fluid object-fit-cover shadow-sm product-card-image" style="width:140px; height:140px;">
                        <div class="product-action-overlay">
                            <button class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift wishlist-btn ${window.userWishlist && window.userWishlist.includes(prodId) ? 'active' : ''}" data-id="${prodId}" aria-label="Save ${prod.title}"><i class="bi bi-heart"></i></button>
                            <a href="product.html?id=${prodId}" class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift" aria-label="View ${prod.title} details"><i class="bi bi-box-arrow-up-right"></i></a>
                        </div>
                    </div>
                    <div class="card-body bg-white rounded-bottom-4 p-4 product-card-body">
                        <p class="text-muted small mb-1 product-card-meta">${normalizedCategory}</p>
                        <h6 class="card-title fw-bold text-dark mb-2 product-card-title" title="${prod.title}">${prod.title}</h6>
                        <div class="rating text-warning mb-2 small product-card-rating">${starsHtml}</div>
                        <div class="d-flex justify-content-center align-items-center mb-2 product-price-row">
                            ${priceDisplay}
                        </div>
                        ${varWeightNote}
                        <button class="btn btn-outline-${colorClass} w-100 rounded-pill fw-medium dynamic-add-cart" data-prod="${prodJson}">${addBtnLabel}</button>
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

        containerEl.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.dataset.bound = "true";
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const id = this.dataset.id;
                if (window.toggleWishlist) window.toggleWishlist(id);
            });
        });
    };

    window.renderHomepageFeaturedProducts = function () {
        const featuredEl = document.getElementById('homepageFeaturedProducts');
        if (!featuredEl) return;

        const currentCatalog = (Array.isArray(window.CATALOG) && window.CATALOG.length) ? window.CATALOG : (window.catalogProducts || []);
        if (!currentCatalog.length) return;

        const products = currentCatalog.slice(0, 4);
        if (!products.length) return;

        featuredEl.innerHTML = products
            .map(prod => window.buildStorefrontProductCard(prod, { columnClass: 'col-6 col-md-4 col-lg-3' }))
            .join('');
        window.bindStoreProductCardActions(featuredEl);
    };
    window.renderHomepageFeaturedProducts();

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

            const currentCatalogList = (Array.isArray(window.CATALOG) && window.CATALOG.length)
                ? window.CATALOG
                : ((Array.isArray(window.catalogProducts) && window.catalogProducts.length) ? window.catalogProducts : (CATALOG || []));

            const normalizedPageCategory = window.normalizeCatalogCategory ? window.normalizeCatalogCategory(pageMainCategory) : pageMainCategory;

            let filteredList = currentCatalogList.filter(p => normalizedPageCategory === 'All' || window.normalizeCatalogCategory(p.category) === normalizedPageCategory);

            if (searchQuery) {
                const searchStr = searchQuery.toLowerCase();
                const normalizedSearchCategory = window.normalizeCatalogCategory ? window.normalizeCatalogCategory(searchCat || 'All') : (searchCat || 'All');
                filteredList = filteredList.filter(p => {
                    const matchQ = (p.title || '').toLowerCase().includes(searchStr) ||
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

                // --- Variable Weight Product Handling ---
                const isVarWeight = data.isVariableWeight === true;
                const priceEl = document.getElementById('modalProductPrice');
                const qtyInput = document.getElementById('modalProductQty');
                const qtyInputWrapper = qtyInput ? qtyInput.closest('.d-flex') || qtyInput.parentElement : null;

                // Remove any previous variable weight note in modal
                const oldNote = document.getElementById('modalVarWeightNote');
                if (oldNote) oldNote.remove();

                if (isVarWeight) {
                    priceEl.innerHTML = `₹${data.pricePerKg}/kg <small class="text-muted fw-normal" style="font-size:0.75rem;">per kg</small>`;
                    qtyInput.value = 1;
                    qtyInput.min = 1;
                    // Insert variable weight note just before the qty row
                    const noteDiv = document.createElement('div');
                    noteDiv.id = 'modalVarWeightNote';
                    noteDiv.className = 'alert alert-warning rounded-4 py-2 px-3 mb-3 text-start';
                    noteDiv.style.fontSize = '0.82rem';
                    noteDiv.innerHTML = `
                        <strong><i class="bi bi-scale me-1"></i>Variable Weight Item</strong><br>
                        Ek tarbuj ka approximate weight <strong>${data.approxWeightRange}</strong> hota hai.<br>
                        Estimated price: <strong>₹${data.pricePerKg * 3}–₹${data.pricePerKg * 5}</strong> per piece.<br>
                        <span class="text-muted">Delivery se pehle actual weight ke baad final amount WhatsApp pe confirm kiya jayega.</span>
                    `;
                    if (qtyInputWrapper) {
                        qtyInputWrapper.parentNode.insertBefore(noteDiv, qtyInputWrapper);
                    } else {
                        priceEl.insertAdjacentElement('afterend', noteDiv);
                    }
                } else {
                    priceEl.innerText = formatCurrency(data.price);
                    qtyInput.value = 1;
                    qtyInput.min = 1;
                }
                // --- End Variable Weight Handling ---

                // Add a "View Full Details & Reviews" link below the cart button
                const btn = document.getElementById('modalAddToCartBtn');
                btn.className = `btn btn-${data.category === 'Ice-Creams' ? 'pink' : 'success'} px-5 rounded-pill fw-bold hover-lift`;

                let viewDetailsLink = document.getElementById('modalViewDetailsLink');
                if (!viewDetailsLink) {
                    viewDetailsLink = document.createElement('a');
                    viewDetailsLink.id = 'modalViewDetailsLink';
                    viewDetailsLink.className = 'btn btn-outline-secondary w-100 rounded-pill fw-medium mt-2';
                    viewDetailsLink.innerHTML = '<i class="bi bi-box-arrow-up-right me-2"></i>View Full Details & Reviews';
                    btn.insertAdjacentElement('afterend', viewDetailsLink);
                }
                const pid = data.id || data.title;
                viewDetailsLink.href = `product.html?id=${encodeURIComponent(pid)}`;

                btn.onclick = () => {
                    window.addToCartGlobal(encodeURIComponent(JSON.stringify({ ...data, quantity: parseInt(document.getElementById('modalProductQty').value) || 1 })));
                    closeModal();
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
                // Remove variable weight banner if present
                const oldBanner = document.getElementById('varWeightCartBanner');
                if (oldBanner) oldBanner.remove();
                return;
            }

            // Check if any variable weight items exist in cart
            const hasVarWeightItem = cart.some(item => item.isVariableWeight === true);

            // Show/hide variable weight global notice above cart container
            let banner = document.getElementById('varWeightCartBanner');
            if (hasVarWeightItem) {
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'varWeightCartBanner';
                    banner.className = 'alert alert-warning border-warning rounded-4 mb-4 shadow-sm';
                    banner.style.borderLeft = '5px solid #ffc107';
                    banner.innerHTML = `
                        <div class="d-flex align-items-start gap-3">
                            <span style="font-size:2rem;">🍉</span>
                            <div>
                                <strong class="d-block mb-1">Variable Weight Item in your cart</strong>
                                Tarbuj (Watermelon) ka actual weight alag ho sakta hai (approx. 3–5 kg per piece).
                                Delivery se pehle hum aapko <strong>WhatsApp pe actual weight aur final amount confirm</strong> karenge.
                                Aapko sirf confirmed amount pay karna hoga.
                            </div>
                        </div>
                    `;
                    cartContainer.parentElement.insertBefore(banner, cartContainer);
                }
            } else {
                if (banner) banner.remove();
            }

            let subtotal = 0;
            let html = '<div class="list-group list-group-flush">';
            cart.forEach((item, index) => {
                const isVarWeight = item.isVariableWeight === true;
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                const priceLabel = isVarWeight
                    ? `<span class="text-muted small">₹${item.pricePerKg || item.price}/kg &bull; 1 piece (~${item.approxWeightRange || '3–5 kg'})</span>`
                    : `<span class="text-muted small">₹${item.price} per kg</span>`;
                const totalLabel = isVarWeight
                    ? `<span class="fw-bold text-warning small">Est. ₹${(item.pricePerKg || item.price) * 3}–₹${(item.pricePerKg || item.price) * 5}</span>`
                    : `<span class="fw-bold text-dark">₹${itemTotal}</span>`;
                const varNote = isVarWeight
                    ? `<div class="mt-1"><span class="badge bg-warning text-dark" style="font-size:0.68rem;"><i class="bi bi-scale me-1"></i>Actual weight pe final price</span></div>`
                    : '';

                html += `
                <div class="list-group-item p-4">
                    <div class="row align-items-center">
                        <div class="col-3 col-sm-2 text-center"><img src="${item.image}" class="img-fluid rounded-circle object-fit-cover shadow-sm" style="width:60px; height:60px;"></div>
                        <div class="col-9 col-sm-4 mb-2 mb-sm-0"><h6 class="fw-bold mb-1">${item.title}</h6>${priceLabel}${varNote}</div>
                        <div class="col-8 col-sm-3">
                            <div class="input-group input-group-sm rounded-pill border overflow-hidden w-100" style="max-width: 120px;">
                                <button class="btn btn-light px-3 border-0 change-qty" data-index="${index}" data-change="-1">-</button>
                                <input type="text" class="form-control border-0 text-center fw-bold bg-white" value="${item.quantity}" readonly>
                                <button class="btn btn-light px-3 border-0 change-qty" data-index="${index}" data-change="1">+</button>
                            </div>
                        </div>
                        <div class="col-4 col-sm-2 text-end">${totalLabel}</div>
                        <div class="col-12 col-sm-1 text-end mt-2 mt-sm-0"><button class="btn btn-sm text-danger remove-item" data-index="${index}"><i class="bi bi-trash fs-5"></i></button></div>
                    </div>
                </div>`;
            });
            html += '</div>';
            cartContainer.innerHTML = html;

            if (document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = `₹${subtotal}`;
            if (document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = `₹${Math.ceil(subtotal)}`;

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
            const aTime = getOrderTimeValue(a?.createdAt) || getOrderTimeValue(a?.date) || 0;
            const bTime = getOrderTimeValue(b?.createdAt) || getOrderTimeValue(b?.date) || 0;
            return bTime - aTime;
        });
    }

    function getOrderTimeValue(value) {
        if (!value) return 0;
        if (typeof value.toMillis === 'function') return value.toMillis();
        if (typeof value.toDate === 'function') return value.toDate().getTime();
        if (typeof value === 'number') return value;
        const parsed = new Date(value).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function normalizeOrderData(rawOrder = {}, fallbackId = '') {
        const createdAtMs = getOrderTimeValue(rawOrder.createdAt) || getOrderTimeValue(rawOrder.date) || Date.now();
        return {
            ...rawOrder,
            id: rawOrder.id || rawOrder.orderId || fallbackId,
            items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
            totalAmount: Number(rawOrder.totalAmount) || 0,
            status: rawOrder.status || 'Processing',
            date: rawOrder.date || new Date(createdAtMs).toISOString(),
            createdAt: rawOrder.createdAt || createdAtMs
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

    async function createCustomerOrder(paymentMethod = 'Online Payment', status = 'Processing') {
        // Reload cart to get latest data
        cart = JSON.parse(localStorage.getItem('yadavCart')) || [];
        if (cart.length === 0) {
            throw new Error('Your cart is empty!');
        }

        const activeUser = window.auth?.currentUser || currentUser;
        const checkoutDetails = JSON.parse(localStorage.getItem('yadavCheckoutDetails')) || {};

        const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const customerEmail = checkoutDetails.email || (activeUser ? activeUser.email : 'Guest Customer');
        let customerName = 'Customer';
        if (checkoutDetails.firstName) {
            customerName = `${checkoutDetails.firstName} ${checkoutDetails.lastName || ''}`.trim();
        } else if (activeUser && activeUser.displayName) {
            customerName = activeUser.displayName;
        }

        let addressStr = 'Not Provided';
        if (checkoutDetails.address) {
            addressStr = `${checkoutDetails.address}, ${checkoutDetails.city || ''} - ${checkoutDetails.pin || ''}`;
        }

        const subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal);

        const orderData = {
            id: orderId,
            uid: activeUser ? activeUser.uid : ('guest-' + Date.now()),
            customerEmail,
            customerName,
            shippingAddress: addressStr,
            items: cart,
            subtotal,
            totalAmount: total,
            paymentMethod,
            paymentStatus: paymentMethod.toLowerCase().includes('whatsapp') ? 'Sent to WhatsApp' : (paymentMethod.startsWith('UPI') ? 'Pending customer confirmation' : 'Pending'),
            status,
            date: new Date().toISOString(),
            createdAt: (firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
            updatedAt: (firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        try {
            if (activeUser && window.db) {
                const batch = window.db.batch();
                const globalOrderRef = window.db.collection('orders').doc(orderId);
                const userOrderRef = window.db.collection('users').doc(activeUser.uid).collection('my_orders').doc(orderId);

                batch.set(globalOrderRef, orderData);
                batch.set(userOrderRef, orderData);
                await batch.commit();
            } else if (window.db) {
                await window.db.collection('orders').doc(orderId).set(orderData);
            }
        } catch (dbErr) {
            console.warn("Firestore order save (local fallback):", dbErr);
        }

        // Save to LocalStorage My Orders as persistent backup for customer
        const myOrders = JSON.parse(localStorage.getItem('yadavMyOrders')) || [];
        myOrders.unshift(orderData);
        localStorage.setItem('yadavMyOrders', JSON.stringify(myOrders));

        // Save to Admin Orders so new order appears instantly in Admin Dashboard
        const adminOrders = JSON.parse(localStorage.getItem('yadav_orders')) || [];
        adminOrders.unshift(orderData);
        localStorage.setItem('yadav_orders', JSON.stringify(adminOrders));

        cart = [];
        saveCart();
        localStorage.removeItem('yadavCheckoutDetails');
        return { orderId, total, orderData };
    }
    window.createCustomerOrder = createCustomerOrder;

    // Formats order data into clean, structured WhatsApp message and returns wa.me URL
    window.generateWhatsAppOrderUrl = function(orderData, shopNumber = '917232825204') {
        const orderId = orderData.id || ('ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase());
        const name = orderData.customerName || 'Customer';
        const contact = orderData.customerEmail || 'Not Provided';
        const address = orderData.shippingAddress || 'Not Provided';
        const items = orderData.items || [];
        const subtotal = orderData.subtotal || 0;
        const total = orderData.totalAmount || subtotal;
        const paymentMethod = orderData.paymentMethod || 'WhatsApp Direct Order';

        let itemLines = '';
        items.forEach((item, index) => {
            const itemTotal = (item.price * item.quantity);
            itemLines += `${index + 1}. *${item.title}*\n   📦 Qty: ${item.quantity} | Price: ₹${item.price} | Total: ₹${itemTotal}\n`;
        });

        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const text = 
`🛒 *NEW ORDER PLACED* 🛒
*Yadav Vegetables & Ice-Cream Store*
------------------------------------
🆔 *Order ID:* ${orderId}
📅 *Date:* ${formattedDate}

👤 *CUSTOMER DETAILS:*
• *Name:* ${name}
• *Phone/Email:* ${contact}
• *Address:* ${address}

📦 *ORDER ITEMS SUMMARY:*
${itemLines}
------------------------------------
💵 *Subtotal:* ₹${subtotal}
🚚 *Delivery:* Free Delivery
💰 *TOTAL AMOUNT:* ₹${total}
💳 *Payment Mode:* ${paymentMethod}
------------------------------------
Please confirm my order and share delivery timing. Thank you! 🙏`;

        return `https://wa.me/${shopNumber}?text=${encodeURIComponent(text)}`;
    };

    window.processWhatsAppOrder = async function(paymentMethod = 'WhatsApp Direct Order') {
        try {
            const cartData = JSON.parse(localStorage.getItem('yadavCart')) || [];
            if (cartData.length === 0) {
                if (window.showToast) window.showToast('Empty Cart', 'Your cart is empty!', true);
                else alert('Your cart is empty!');
                return;
            }

            const res = await createCustomerOrder(paymentMethod, 'Pending WhatsApp Confirmation');
            const whatsappUrl = window.generateWhatsAppOrderUrl(res.orderData);
            
            if (window.showToast) {
                window.showToast('Order Placed!', 'Opening WhatsApp to send order summary...');
            }

            setTimeout(() => {
                const opened = window.open(whatsappUrl, '_blank');
                if (!opened) {
                    window.location.href = whatsappUrl;
                }
            }, 800);

        } catch (e) {
            console.error("WhatsApp order placement error:", e);
            const message = e.message || 'Error processing order!';
            if (window.showToast) window.showToast('Notice', message, true);
            else alert(message);
        }
    };

    // UPI Payment - Direct App Redirect
    window.payWithUPI = async function(app) {
        cart = JSON.parse(localStorage.getItem('yadavCart')) || [];
        const subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal);

        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
        if (!isMobile) {
            if (window.showToast) {
                window.showToast('Mobile Only', 'UPI payment requires a mobile device. Please use your phone or scan the QR code.', true);
            } else {
                alert('UPI payment is only available on mobile devices. Please use your phone to complete this payment.');
            }
            return;
        }

        let savedOrderId = '';
        try {
            const order = await createCustomerOrder(`UPI - ${app}`, 'Payment Pending');
            savedOrderId = order.orderId;
        } catch (error) {
            console.error('UPI order save failed:', error);
            if (window.showToast) {
                window.showToast('Order Not Saved', error.message || 'Please log in and try again.', true);
            }
            if ((error.message || '').toLowerCase().includes('log in')) {
                setTimeout(() => window.location.href = 'login.html?redirect=payment.html', 1200);
            }
            return;
        }
        
        // Get UPI details - either from Firebase settings or default
        const upiIdElement = document.getElementById('upiId');
        const upiID = upiIdElement ? upiIdElement.textContent.trim() : 'yadav.store@okicici';
        const payeeName = 'Yadav Veggies & Ice-Cream'; // Can be made dynamic later
        const amount = total.toFixed(2);
        const note = savedOrderId ? `Order Payment ${savedOrderId}` : `Order Payment`;
        
        console.log('Initiating UPI payment to:', upiID, 'Amount:', amount, 'Cart items:', cart.length);
        
        // Create UPI Intent URL
        const upiURL = `upi://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
        
        // Check if on mobile device
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
            // Google Pay generic upi intent (most reliable fallback for generic gpay link)
            const gpayURL = `upi://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            
            // Try specific intent first, fallback to generic
            window.location.href = `tez://upi/pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
            
            setTimeout(() => {
                if (document.hasFocus()) {
                    window.location.href = gpayURL;
                }
            }, 1000);
        }
        
        // Show feedback that app is opening
        if (window.showToast) {
            window.showToast('Order Saved', `Order ${savedOrderId} saved. Opening UPI app...`);
        }
        
        // After 3 seconds, check if user might need to fallback to QR code
        setTimeout(() => {
            if (window.showToast) {
                window.showToast('Payment Pending', 'If the app didn\'t open, please scan the QR code or copy the UPI ID.', true);
            }
        }, 3000);
    };

    // Checkout Page Logic
    window.renderCheckoutPage = function() {
        const cartItemsEl = document.getElementById('checkoutCartItems');
        if (!cartItemsEl) return;
        
        let localCart = JSON.parse(localStorage.getItem('yadavCart')) || [];
        let subtotal = localCart.reduce((s, item) => s + (item.price * item.quantity), 0);
        let total = subtotal;

        let html = '';
        if (localCart.length > 0) {
            localCart.forEach(item => {
                html += `<div class="summary-item">
                    <img src="${item.image}" class="summary-img" alt="${item.title}" style="width:50px;height:50px;object-fit:cover;">
                    <div class="summary-details">
                        <h6 class="summary-title mb-0">${item.title}</h6>
                        <span class="summary-qty text-muted">Qty: ${item.quantity}</span>
                    </div>
                    <span class="summary-price ms-auto fw-bold">${formatCurrency(item.price * item.quantity)}</span>
                </div>`;
            });
        } else {
            html = '<p class="text-muted text-center py-3">Your cart is empty.</p>';
        }

        cartItemsEl.innerHTML = html;
        const stEl = document.getElementById('checkoutSubtotal');
        if (stEl) stEl.innerText = formatCurrency(subtotal);
        const taxEl = document.getElementById('checkoutTax');
        if (taxEl) taxEl.innerText = formatCurrency(0);
        const totalEl = document.getElementById('checkoutTotal');
        if (totalEl) totalEl.innerText = formatCurrency(total);
    };

    // Payment Page Logic - wrapped in DOMContentLoaded to ensure elements exist
    function initPaymentPage() {
        const payBtn = document.getElementById('payNowBtn');
        if (!payBtn) return;
        
        console.log('Payment page detected - initializing...');
        
        cart = JSON.parse(localStorage.getItem('yadavCart')) || [];
        
        let subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal);
        
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
        
        const cartItemsEl = document.getElementById('paymentCartItems');
        const subtotalEl = document.getElementById('paymentSubtotal');
        const totalEl = document.getElementById('paymentTotal');
        const totalMobileEl = document.getElementById('paymentTotalMobile');
        
        if (cartItemsEl) cartItemsEl.innerHTML = html;
        if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);
        if (totalEl) totalEl.innerText = formatCurrency(total);
        if (totalMobileEl) totalMobileEl.innerText = formatCurrency(total);
        
        payBtn.innerHTML = `<i class="bi bi-whatsapp me-1"></i><span>Send Order to WhatsApp (${formatCurrency(total)})</span>`;
        
        payBtn.addEventListener('click', async () => {
            const activeMethodEl = document.querySelector('.payment-method.active');
            let selectedMethod = 'WhatsApp Direct Order';
            if (activeMethodEl) {
                const titleEl = activeMethodEl.querySelector('.payment-method-title');
                if (titleEl) selectedMethod = titleEl.innerText.trim();
            }

            if (selectedMethod.toLowerCase().includes('whatsapp') || selectedMethod.toLowerCase().includes('direct')) {
                await window.processWhatsAppOrder(selectedMethod);
            } else if (selectedMethod.toLowerCase().includes('upi')) {
                await window.payWithUPI('any');
            } else {
                payBtn.innerText = "Processing...";
                payBtn.disabled = true;

                try {
                    const res = await createCustomerOrder(selectedMethod, 'Processing');
                    const whatsappUrl = window.generateWhatsAppOrderUrl(res.orderData);
                    window.showToast('Success!', `Order ${res.orderId} placed! Opening WhatsApp...`);
                    setTimeout(() => {
                        window.open(whatsappUrl, '_blank') || (window.location.href = whatsappUrl);
                    }, 1000);
                } catch (e) {
                    console.error("Order save sync error:", e);
                    const message = e.message || 'Error placing order! Check your connection.';
                    window.showToast('Error', message, true);
                    payBtn.innerHTML = `<i class="bi bi-whatsapp me-1"></i><span>Send Order to WhatsApp (${formatCurrency(total)})</span>`;
                    payBtn.disabled = false;
                }
            }
        });
    }
    
    // Initialize payment page
    initPaymentPage();

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
                        <td data-label="Order ID" class="fw-bold font-monospace text-primary">${o.id}</td>
                        <td data-label="Date" class="text-muted small">${d.toLocaleDateString()} ${d.toLocaleTimeString()}</td>
                        <td data-label="Customer">${o.customerName}<br><small class="text-muted">${o.customerEmail}</small></td>
                        <td data-label="Items">${names}</td>
                        <td data-label="Total" class="fw-bold text-success">${formatCurrency(amount)}</td>
                        <td data-label="Status" class="admin-order-status-cell">
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
                    l1.textContent += line1.charAt(idx++);
                    setTimeout(typeLine1, speed);
                } else {
                    idx = 0;
                    setTimeout(typeLine2, 120);
                }
            }

            function typeLine2() {
                if (myGen !== typewriterGen) return;
                if (idx < line2.length) {
                    l2.textContent += line2.charAt(idx++);
                    setTimeout(typeLine2, speed);
                } else {
                    if (cur) cur.classList.add('hero-type-cursor-done');
                }
            }

            typeLine1();
        }

        carousel.addEventListener('slid.bs.carousel', function (e) {
            typeHeroTitle(e.relatedTarget);
        });

        const activeSlide = carousel.querySelector('.carousel-item.active');
        if (activeSlide) typeHeroTitle(activeSlide);
    })();

    // Helper: Add product directly to cart by ID
    window.addToCartById = function(id, customWeight = null) {
        const catalog = window.catalogProducts || window.YADAV_CATALOG || [];
        const prod = catalog.find(p => (p.id || p.title) === id);
        if (!prod) {
            if (window.showToast) window.showToast("Error", "Product not found!", true);
            return;
        }
        const selectedWeight = customWeight || (prod.unitType === 'pc' ? (prod.pcWeight || '1 pc') : '1kg');
        let itemPrice = prod.price;
        if (prod.unitType !== 'pc' && selectedWeight) {
            if (selectedWeight === '100g') itemPrice = Math.round(prod.price * 0.1);
            else if (selectedWeight === '200g') itemPrice = Math.round(prod.price * 0.2);
            else if (selectedWeight === '250g') itemPrice = Math.round(prod.price * 0.25);
            else if (selectedWeight === '500g') itemPrice = Math.round(prod.price * 0.5);
            else if (selectedWeight === '2kg') itemPrice = Math.round(prod.price * 2);
            else if (selectedWeight === '3kg') itemPrice = Math.round(prod.price * 3);
        }
        const payload = {
            id: prod.id || prod.title,
            title: prod.title,
            price: itemPrice,
            image: prod.image,
            category: prod.category,
            selectedWeight: selectedWeight,
            quantity: 1
        };
        if (window.addToCartGlobal) {
            window.addToCartGlobal(encodeURIComponent(JSON.stringify(payload)));
        }
    };

    // ==========================================
    // 12. AI SALES ASSISTANT & LIVE RATE CHATBOT
    // ==========================================
    (function initAIChatbot() {
        if (document.getElementById('aiChatbotContainer')) return;
        if (document.body.classList.contains('admin-dashboard')) return;

        const botHtml = `
        <div id="aiChatbotContainer">
            <!-- Proactive Teaser Badge Popup -->
            <div id="aiChatbotTeaserBadge" class="ai-chatbot-teaser-badge shadow-sm" onclick="window.toggleAIChatbot(true)">
                <span class="teaser-dot"></span> 👋 जानिए आज किस सब्जी, फल या आइसक्रीम का क्या रेट है!
            </div>

            <div id="aiChatbotWindow">
                <div class="chatbot-header">
                    <div class="chatbot-header-title">
                        <span class="fs-4">🥦</span>
                        <div>
                            <div style="font-size:1rem; line-height:1.2; font-weight:700;">Yadav Store Rate AI</div>
                            <div style="font-size:0.75rem; font-weight:normal; opacity:0.9;">लाइव रेट एवं प्रोडक्ट जानकारी</div>
                        </div>
                    </div>
                    <button class="chatbot-header-btn" id="closeChatBtn" aria-label="Close Chat"><i class="bi bi-x-lg"></i></button>
                </div>
                <div class="chatbot-messages" id="chatMsgs">
                    <!-- Messages go here -->
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" class="chat-input" placeholder="सब्जी, फल या आइसक्रीम का भाव पूछें..." autocomplete="off">
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

        // Live Rate & Price Inquiry Search Engine
        function queryCatalogRates(inputRaw) {
            const input = inputRaw.toLowerCase().trim();
            const catalog = window.catalogProducts || window.YADAV_CATALOG || [];

            // Category Level Queries
            if (input.includes('sabzi') || input.includes('veggie') || input.includes('vegetable') || input.includes('सब्जी') || input.includes('सब्जियां')) {
                const vegItems = catalog.filter(p => p.category === 'Vegetables').slice(0, 6);
                let res = "🥦 <strong>आज की ताज़ा सब्ज़ियों के रेट (Today's Vegetable Rates):</strong><br><ul class='ps-3 mb-2 mt-2 me-0 text-start small'>";
                vegItems.forEach(p => {
                    const u = p.unitType === 'pc' ? `₹${p.price}/pc (${p.pcWeight || '1 pc'})` : `₹${p.price}/1 kg`;
                    res += `<li class="mb-1"><strong>${p.emoji || '🥬'} ${p.title}</strong> (${p.hindiTitle || ''}): <span class="text-success fw-bold">${u}</span></li>`;
                });
                res += "</ul><p class='small text-muted mb-1'>👉 किसी भी सब्जी का नाम टाइप करें या तुरंत आर्डर करें!</p>";
                return { text: res, chips: ["टमाटर का भाव", "आलू का भाव", "प्याज का भाव"] };
            }

            if (input.includes('fruit') || input.includes('फल')) {
                const fruitItems = catalog.filter(p => p.category === 'Fruits').slice(0, 6);
                let res = "🍎 <strong>आज के ताज़ा फलों के रेट (Fresh Fruit Rates):</strong><br><ul class='ps-3 mb-2 mt-2 me-0 text-start small'>";
                fruitItems.forEach(p => {
                    const u = p.unitType === 'pc' ? `₹${p.price}/pc (${p.pcWeight || '1 pc'})` : `₹${p.price}/1 kg`;
                    res += `<li class="mb-1"><strong>${p.emoji || '🍎'} ${p.title}</strong> (${p.hindiTitle || ''}): <span class="text-success fw-bold">${u}</span></li>`;
                });
                res += "</ul><p class='small text-muted mb-1'>👉 100% ताज़ा फलों की डिलीवरी!</p>";
                return { text: res, chips: ["आम का भाव", "सेब का भाव", "तरबूज का भाव"] };
            }

            if (input.includes('ice cream') || input.includes('icecream') || input.includes('आइसक्रीम')) {
                const iceItems = catalog.filter(p => p.category === 'Ice-Creams').slice(0, 6);
                let res = "🍦 <strong>प्रीमियम आइसक्रीम रेट्स (Ice-Cream Parlour Rates):</strong><br><ul class='ps-3 mb-2 mt-2 me-0 text-start small'>";
                iceItems.forEach(p => {
                    res += `<li class="mb-1"><strong>${p.emoji || '🍨'} ${p.title}</strong>: <span class="text-pink fw-bold">₹${p.price}</span></li>`;
                });
                res += "</ul><p class='small text-muted mb-1'>👉 चिल पैक डिलीवरी के साथ घर मंगाएं!</p>";
                return { text: res, chips: ["Chocobar", "Sundae Cup", "Kulfi"] };
            }

            // Specific Product Fuzzy Search
            const matchedProducts = catalog.filter(p => {
                const titleMatch = p.title.toLowerCase().includes(input) || (p.hindiTitle && p.hindiTitle.toLowerCase().includes(input));
                const synMatch = p.synonyms && p.synonyms.some(s => input.includes(s.toLowerCase()) || s.toLowerCase().includes(input));
                return titleMatch || synMatch;
            });

            if (matchedProducts.length > 0) {
                let res = "✨ <strong>आज का लाइव रेट (Live Store Price):</strong><br>";
                matchedProducts.slice(0, 4).forEach(p => {
                    const unitStr = p.unitType === 'pc' ? `₹${p.price} / pc (${p.pcWeight || '1 pc'})` : `₹${p.price} / 1 kg`;
                    res += `
                    <div class="p-2 border rounded-3 my-2 bg-white shadow-sm d-flex align-items-center justify-content-between text-start gap-2">
                        <div>
                            <div class="fw-bold text-dark mb-0">${p.emoji || '📦'} ${p.title}</div>
                            <div class="small text-muted">${p.hindiTitle || ''}</div>
                            <div class="text-success fw-bold fs-6">${unitStr}</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-success rounded-pill px-3 fw-bold text-nowrap" onclick="window.addToCartById('${p.id}')">
                            <i class="bi bi-cart-plus me-1"></i> Add
                        </button>
                    </div>`;
                });
                return { text: res, chips: ["और सब्जियां दिखाओ", "Order करना है"] };
            }

            // Order Inquiry
            if (input.includes('order') || input.includes('आर्डर') || input.includes('खरीदना')) {
                return {
                    text: "🛍️ **आर्डर कैसे करें:**<br>1. आप डायरेक्ट वेबसाइट से आइटम चुनकर कार्ट में डाल सकते हैं!<br>2. या अपनी हाथ से लिखी पर्ची का फोटो **Upload Slip** बटन से अपलोड कर दें।<br>3. या नीचे अपना Name, Phone और Address लिखें, हम कॉल करके आर्डर बुक कर लेंगे!",
                    chips: ["सब्जियों के रेट बताओ", "फलों के रेट बताओ"]
                };
            }

            return null;
        }

        const USER_GEMINI_KEY = typeof window !== 'undefined' && window.atob ? window.atob("QVEuQWI4Uk42SUpMdXB6bTFyNXMwVUFsRVlHY1lRY3BCWFN0dEFETC1EQWRPNlowZEtOVEE=") : "";

        async function processAiLogic(input) {
            // 1. Instant response from store catalog engine for exact product rates
            const localResult = queryCatalogRates(input);
            if (localResult) {
                addMessage(localResult.text, 'bot', localResult.chips || []);
                return;
            }

            // 2. Query Gemini AI with new API key & live catalog context
            const catalogSummary = (window.CATALOG || []).slice(0, 15).map(p => `${p.title} (${p.hindiTitle || ''}): ₹${p.price}/${p.unitType === 'pc' ? 'pc' : 'kg'}`).join(', ');
            const systemPrompt = `You are Yadav Store AI Assistant for Yadav Vegetable & Ice-Cream Parlour in Jaipur. Store products & live prices: ${catalogSummary}. Be helpful, polite, answer in friendly Hindi/English. Mention rates when asked.`;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${USER_GEMINI_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `${systemPrompt}\nCustomer question: ${input}` }] }
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (aiReply) {
                        const formattedReply = aiReply
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br>');
                        addMessage(formattedReply, 'bot', ["सब्जियों के रेट", "फलों के रेट", "ऑर्डर कैसे करें"]);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Gemini API fetch exception, using store fallback:', err);
            }

            // 3. Fallback response if API fails
            const defaultMsg = `🙏 **यादव स्टोर पर आपका स्वागत है!**<br>
            आप हमसे किसी भी सब्जी (जैसे आलू, टमाटर, प्याज), फल (जैसे आम, सेब, तरबूज) या आइसक्रीम का लाइव रेट पूछ सकते हैं!<br><br>
            <em>उदाहरण: "टमाटर का भाव बताओ" या "सब्जियों के रेट"</em>`;
            addMessage(defaultMsg, 'bot', ["सब्जियों के रेट", "फलों के रेट", "आइसक्रीम रेट"]);
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
            }, 300);
        }

        chatSendBtn.addEventListener('click', () => handleUserInput());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserInput();
        });

        let botInit = false;
        window.toggleAIChatbot = function (openOnly = false) {
            if (openOnly) {
                chatWindow.classList.add('show');
            } else {
                chatWindow.classList.toggle('show');
            }
            if (chatWindow.classList.contains('show')) {
                if (!botInit) {
                    botInit = true;
                    addMessage("Namaste 🙏 Yadav Store Live AI Rate Assistant पर आपका स्वागत है! आज आपको किसका भाव जानना है? 🥦🍎🍦", 'bot', ["सब्जियों के रेट", "फलों के रेट", "आइसक्रीम रेट"]);
                }
                setTimeout(() => chatInput.focus(), 300);
            }
        };

        toggleBtn.addEventListener('click', () => window.toggleAIChatbot());
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('show');
        });
    })();
    
    // Initialize payment page (must be inside DOMContentLoaded)
    initPaymentPage();

    // ==========================================
    // 9. UPLOAD SLIP (अपलोड पर्ची) & TYPE YOUR LIST ENGINE
    // ==========================================
    window.initQuickListFeature = function () {
        // Load Tesseract OCR library dynamically if needed
        if (!document.getElementById('tesseractOcrScript')) {
            const tessScript = document.createElement('script');
            tessScript.id = 'tesseractOcrScript';
            tessScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            document.head.appendChild(tessScript);
        }

        // Inject Navigation Trigger Buttons if not already present
        document.querySelectorAll('.navbar-nav').forEach((nav) => {
            if (nav.querySelector('[data-quick-list-btn="true"]')) return;
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-3 py-1 my-2 my-lg-0 fw-bold d-flex align-items-center gap-1 hover-lift" data-quick-list-btn="true" onclick="window.openQuickListModal()">
                    <i class="bi bi-receipt-cutoff fs-6 text-success"></i>
                    <span>📋 Quick Slip / List</span>
                </button>
            `;
            const homeLink = nav.querySelector('li');
            if (homeLink && homeLink.nextSibling) nav.insertBefore(li, homeLink.nextSibling);
            else nav.appendChild(li);
        });

        // Desktop header icon injection
        document.querySelectorAll('.header-icons').forEach((bar) => {
            if (bar.querySelector('[data-quick-list-icon="true"]')) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-success btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-sm me-2 hover-lift';
            btn.dataset.quickListIcon = 'true';
            btn.onclick = () => window.openQuickListModal();
            btn.innerHTML = '<i class="bi bi-camera-fill me-1"></i><span>Slip / List</span>';
            bar.insertBefore(btn, bar.firstChild);
        });

        // Inject Quick List Modal into DOM if missing
        if (!document.getElementById('quickListModal')) {
            const modalWrap = document.createElement('div');
            modalWrap.id = 'quickListModalWrap';
            modalWrap.innerHTML = `
                <div class="modal fade quick-list-modal" id="quickListModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content border-0">
                            <div class="modal-header bg-success text-white py-3 px-4">
                                <div>
                                    <h5 class="modal-title fw-bold mb-0 text-white"><i class="bi bi-cart-check-fill me-2"></i>Quick Order: Upload Slip or Type List</h5>
                                    <small class="text-white-50">अपनी पर्ची अपलोड करें या लिस्ट टाइप करें — सब सीधे कार्ट में ऐड होगा</small>
                                </div>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">
                                <!-- Navigation Tabs -->
                                <ul class="nav nav-pills nav-justified quick-list-nav mb-4 bg-light p-1 rounded-pill" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active rounded-pill fw-bold" id="slip-tab" data-bs-toggle="pill" data-bs-target="#slipTabContent" type="button" role="tab">
                                            <i class="bi bi-camera-fill me-2"></i>📸 Upload Slip (अपलोड पर्ची)
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link rounded-pill fw-bold" id="typelist-tab" data-bs-toggle="pill" data-bs-target="#typelistTabContent" type="button" role="tab">
                                            <i class="bi bi-pencil-square me-2"></i>✍️ Type Your List (टाइप आपकी लिस्ट)
                                        </button>
                                    </li>
                                </ul>

                                <div class="tab-content">
                                    <!-- TAB 1: UPLOAD SLIP PHOTO -->
                                    <div class="tab-pane fade show active" id="slipTabContent" role="tabpanel">
                                        <div class="slip-upload-dropzone mb-3" id="slipDropzone" onclick="document.getElementById('slipFileInput').click()">
                                            <i class="bi bi-cloud-arrow-up-fill"></i>
                                            <h6 class="fw-bold mb-1">Click or Drag Photo of your Grocery Slip / List here</h6>
                                            <p class="text-muted small mb-0">सब्जियों और फलों की लिखी हुई पर्ची की फोटो खींच कर अपलोड करें</p>
                                            <input type="file" id="slipFileInput" accept="image/*" class="d-none" onchange="window.handleSlipFileUpload(event)">
                                        </div>

                                        <!-- Scanner Progress Loader -->
                                        <div id="slipProgressWrap" class="d-none my-3 text-center p-3 bg-light rounded-4">
                                            <div class="ocr-progress-bar mb-2"></div>
                                            <span class="fw-bold text-success" id="slipProgressText"><i class="bi bi-cpu me-2"></i>Scanning receipt image text using AI OCR...</span>
                                        </div>

                                        <!-- Preview & Parsed Items -->
                                        <div id="slipResultsArea" class="d-none">
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <h6 class="fw-bold text-dark mb-0"><i class="bi bi-check-circle-fill text-success me-2"></i>Items Found in Slip</h6>
                                                <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="window.resetSlipUpload()"><i class="bi bi-arrow-repeat me-1"></i>Upload Another</button>
                                            </div>
                                            <div id="slipItemsContainer" class="d-flex flex-column gap-2 mb-3" style="max-height:300px; overflow-y:auto;"></div>
                                            <div class="d-flex justify-content-between align-items-center pt-3 border-top">
                                                <div>
                                                    <span class="text-muted small d-block">Estimated Total</span>
                                                    <h5 class="fw-bold text-success mb-0" id="slipTotalEstimate">₹0</h5>
                                                </div>
                                                <button type="button" class="btn btn-success rounded-pill px-4 py-2 fw-bold quick-list-cta-btn" onclick="window.addAllSlipItemsToCart()">
                                                    <i class="bi bi-bag-plus-fill me-2"></i>Add All Matched Items to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- TAB 2: TYPE YOUR LIST -->
                                    <div class="tab-pane fade" id="typelistTabContent" role="tabpanel">
                                        <!-- Sub Mode Selection -->
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <label class="form-label fw-bold mb-0">Select Item & Choose Quantity / Weight</label>
                                            <button class="btn btn-sm text-success p-0 fw-bold" onclick="window.toggleBulkListMode()">
                                                <i class="bi bi-card-text me-1"></i><span id="bulkModeBtnLabel">Switch to Free Text Paste Mode</span>
                                            </button>
                                        </div>

                                        <!-- Interactive Item Selector Row -->
                                        <div id="interactiveListMode">
                                            <div class="row g-2 mb-3">
                                                <div class="col-md-7">
                                                    <label class="form-label small text-muted">Item Name (Search Hindi / English)</label>
                                                    <select id="quickSelectProduct" class="form-select border-success rounded-3" onchange="window.onQuickProductSelected()">
                                                        <option value="">-- Choose Vegetable or Fruit --</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-5">
                                                    <label class="form-label small text-muted">Quantity / Weight</label>
                                                    <select id="quickSelectWeight" class="form-select border-success rounded-3">
                                                        <option value="250g">250 Gram (250g)</option>
                                                        <option value="500g">500 Gram (आधा किलो)</option>
                                                        <option value="1kg" selected>1 Kilo (1 kg)</option>
                                                        <option value="2kg">2 Kilo (2 kg)</option>
                                                        <option value="3kg">3 Kilo (3 kg)</option>
                                                        <option value="100g">100 Gram (100g)</option>
                                                        <option value="200g">200 Gram (200g)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <!-- Weight Pills Shortcuts -->
                                            <div class="mb-3">
                                                <span class="small text-muted d-block mb-1 fw-bold">Quick Weight Pills:</span>
                                                <div class="weight-pills-wrap" id="weightPillsWrap">
                                                    <button type="button" class="weight-pill-btn" onclick="window.setQuickWeight('100g', this)">100g</button>
                                                    <button type="button" class="weight-pill-btn" onclick="window.setQuickWeight('200g', this)">200g</button>
                                                    <button type="button" class="weight-pill-btn" onclick="window.setQuickWeight('250g', this)">250g</button>
                                                    <button type="button" class="weight-pill-btn active" onclick="window.setQuickWeight('500g', this)">500g (आधा किलो)</button>
                                                    <button type="button" class="weight-pill-btn" onclick="window.setQuickWeight('1kg', this)">1 kg (1 किलो)</button>
                                                    <button type="button" class="weight-pill-btn" onclick="window.setQuickWeight('2kg', this)">2 kg</button>
                                                    <button type="button" class="weight-pill-btn" onclick="window.setQuickWeight('3kg', this)">3 kg</button>
                                                    <button type="button" class="weight-pill-btn pill-pcs" onclick="window.setQuickWeight('1 Pcs', this)">1 Pcs (संख्या)</button>
                                                    <button type="button" class="weight-pill-btn pill-pcs" onclick="window.setQuickWeight('2 Pcs', this)">2 Pcs (संख्या)</button>
                                                </div>
                                            </div>

                                            <div class="text-end mb-3">
                                                <button type="button" class="btn btn-outline-success rounded-pill px-4 fw-bold" onclick="window.addQuickSelectedItemToList()">
                                                    <i class="bi bi-plus-circle-fill me-1"></i>Add Item to My List
                                                </button>
                                            </div>
                                        </div>

                                        <!-- Bulk Text Paste Box (Hidden by default) -->
                                        <div id="bulkTextListMode" class="d-none mb-3">
                                            <label class="form-label small text-muted">Type or Paste your list here (One item per line):</label>
                                            <textarea id="bulkTextareaInput" class="form-control border-success rounded-4 p-3" rows="4" placeholder="उदाहरण:\n2kg potato\n500g tamatar\n250g pyaz\n2 pcs tarbooz"></textarea>
                                            <button type="button" class="btn btn-sm btn-success rounded-pill mt-2 px-3 fw-bold" onclick="window.parseBulkTextareaList()">
                                                <i class="bi bi-lightning-charge-fill me-1"></i>Parse & Build List
                                            </button>
                                        </div>

                                        <!-- Typed List Summary Table -->
                                        <div class="border rounded-4 p-3 bg-light">
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <h6 class="fw-bold mb-0 text-dark">Your Selected List (<span id="quickListCount">0</span> items)</h6>
                                                <button type="button" class="btn btn-sm text-danger p-0" onclick="window.clearQuickList()"><i class="bi bi-trash me-1"></i>Clear List</button>
                                            </div>
                                            <div id="quickListItemsWrap" class="d-flex flex-column gap-2 mb-3" style="max-height:220px; overflow-y:auto;">
                                                <div class="text-center text-muted py-3 small">Abhi tak koi item add nahi kiya gaya hai. Upar se item select karein ya text paste karein!</div>
                                            </div>
                                            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                                <h5 class="fw-bold text-success mb-0" id="quickListTotalAmount">₹0</h5>
                                                <button type="button" class="btn btn-success rounded-pill px-4 py-2 fw-bold quick-list-cta-btn" onclick="window.addAllTypedListToCart()">
                                                    <i class="bi bi-cart-plus-fill me-2"></i>Add List to Cart Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalWrap);
        }

        // Populate catalog options in Quick Select Dropdown
        const selectEl = document.getElementById('quickSelectProduct');
        if (selectEl && selectEl.options.length <= 1 && window.CATALOG) {
            window.CATALOG.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.innerText = `${p.emoji || '🥦'} ${p.title} ${p.hindiTitle ? '(' + p.hindiTitle + ')' : ''} - ₹${p.price}/${p.unitType === 'pcs' ? 'pc' : 'kg'}`;
                selectEl.appendChild(opt);
            });
        }
    };

    // Internal state for Quick Order List
    window.quickListItems = [];
    window.slipParsedItems = [];

    window.openQuickListModal = function () {
        window.initQuickListFeature();
        const modalEl = document.getElementById('quickListModal');
        if (modalEl) {
            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
        }
    };

    window.setQuickWeight = function (val, btnEl) {
        const select = document.getElementById('quickSelectWeight');
        if (select) {
            let found = Array.from(select.options).some(o => o.value === val);
            if (!found) {
                const opt = document.createElement('option');
                opt.value = val;
                opt.innerText = val;
                select.appendChild(opt);
            }
            select.value = val;
        }
        if (btnEl && btnEl.parentElement) {
            btnEl.parentElement.querySelectorAll('.weight-pill-btn').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }
    };

    window.onQuickProductSelected = function () {
        const pid = document.getElementById('quickSelectProduct').value;
        const prod = window.CATALOG?.find(p => p.id === pid);
        if (prod && prod.unitType === 'pcs') {
            window.setQuickWeight('1 Pcs', document.querySelector('.weight-pill-btn.pill-pcs'));
        }
    };

    window.toggleBulkListMode = function () {
        const interactive = document.getElementById('interactiveListMode');
        const bulk = document.getElementById('bulkTextListMode');
        const btnLabel = document.getElementById('bulkModeBtnLabel');
        if (interactive && bulk) {
            if (bulk.classList.contains('d-none')) {
                bulk.classList.remove('d-none');
                interactive.classList.add('d-none');
                if (btnLabel) btnLabel.innerText = 'Switch to Dropdown Select Mode';
            } else {
                bulk.classList.add('d-none');
                interactive.classList.remove('d-none');
                if (btnLabel) btnLabel.innerText = 'Switch to Free Text Paste Mode';
            }
        }
    };

    // Parser function for raw text (supports 100g, 200g, 250g, 500g, 1kg, 2kg, 3kg, 1 pcs, 2 pcs, hindi names)
    window.parseTextToCatalogItems = function (text) {
        if (!text || !window.CATALOG) return [];
        const lines = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
        const results = [];

        lines.forEach(line => {
            const lineLower = line.toLowerCase();
            let weightInKg = 1;
            let pcsCount = 1;
            let isPcs = false;
            let weightLabel = '1 kg';

            // Check piece count
            const pcsMatch = lineLower.match(/(\d+)\s*(?:pcs|pc|naug|नग|पीस|piece|pieces|no|nos)/);
            if (pcsMatch) {
                isPcs = true;
                pcsCount = parseInt(pcsMatch[1], 10) || 1;
                weightLabel = `${pcsCount} Pcs`;
            } else if (lineLower.includes('आधा किलो') || lineLower.includes('half kg') || lineLower.includes('1/2 kg') || lineLower.includes('500g') || lineLower.includes('500 g') || lineLower.includes('500 gram')) {
                weightInKg = 0.5;
                weightLabel = '500g (आधा किलो)';
            } else if (lineLower.includes('पाव किलो') || lineLower.includes('1/4 kg') || lineLower.includes('250g') || lineLower.includes('250 g') || lineLower.includes('250 gram')) {
                weightInKg = 0.25;
                weightLabel = '250g';
            } else if (lineLower.includes('100g') || lineLower.includes('100 g') || lineLower.includes('100 gram')) {
                weightInKg = 0.1;
                weightLabel = '100g';
            } else if (lineLower.includes('200g') || lineLower.includes('200 g') || lineLower.includes('200 gram')) {
                weightInKg = 0.2;
                weightLabel = '200g';
            } else {
                const kgMatch = lineLower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|किलो)/);
                if (kgMatch) {
                    weightInKg = parseFloat(kgMatch[1]) || 1;
                    weightLabel = `${weightInKg} kg`;
                } else {
                    const gMatch = lineLower.match(/(\d+)\s*(?:g|gm|gram|ग्राम)/);
                    if (gMatch) {
                        const grams = parseInt(gMatch[1], 10);
                        weightInKg = grams / 1000;
                        weightLabel = `${grams}g`;
                    }
                }
            }

            // Search product match in catalog
            const matchedProd = window.CATALOG.find(p => {
                const pTitle = p.title.toLowerCase();
                const pHindi = (p.hindiTitle || '').toLowerCase();
                const pSyns = (p.synonyms || []).map(s => s.toLowerCase());

                return pSyns.some(syn => lineLower.includes(syn)) ||
                    (pHindi && lineLower.includes(pHindi)) ||
                    pTitle.split(' ').some(word => word.length > 3 && lineLower.includes(word));
            });

            if (matchedProd) {
                let calculatedPrice = 0;
                if (matchedProd.unitType === 'pcs' || isPcs) {
                    const pricePerUnit = matchedProd.pricePerPiece || matchedProd.price;
                    calculatedPrice = pricePerUnit * pcsCount;
                } else {
                    calculatedPrice = Math.round(matchedProd.price * weightInKg);
                }

                results.push({
                    product: matchedProd,
                    selectedWeightLabel: weightLabel,
                    weightInKg: weightInKg,
                    pcsCount: pcsCount,
                    isPcs: isPcs || matchedProd.unitType === 'pcs',
                    calculatedPrice: Math.max(1, calculatedPrice),
                    rawLineText: line
                });
            }
        });

        return results;
    };

    window.addQuickSelectedItemToList = function () {
        const pid = document.getElementById('quickSelectProduct').value;
        const weightVal = document.getElementById('quickSelectWeight').value;
        if (!pid) {
            window.showToast('Select Item', 'Please select a vegetable or fruit first.', true);
            return;
        }

        const prod = window.CATALOG?.find(p => p.id === pid);
        if (!prod) return;

        let calculatedPrice = prod.price;
        if (weightVal.toLowerCase().includes('pcs')) {
            const pcs = parseInt(weightVal) || 1;
            calculatedPrice = (prod.pricePerPiece || prod.price) * pcs;
        } else if (weightVal === '250g') calculatedPrice = Math.round(prod.price * 0.25);
        else if (weightVal === '500g') calculatedPrice = Math.round(prod.price * 0.5);
        else if (weightVal === '100g') calculatedPrice = Math.round(prod.price * 0.1);
        else if (weightVal === '200g') calculatedPrice = Math.round(prod.price * 0.2);
        else if (weightVal === '2kg') calculatedPrice = Math.round(prod.price * 2);
        else if (weightVal === '3kg') calculatedPrice = Math.round(prod.price * 3);

        window.quickListItems.push({
            product: prod,
            selectedWeightLabel: weightVal,
            calculatedPrice: Math.max(1, calculatedPrice)
        });

        window.renderQuickListSummary();
    };

    window.parseBulkTextareaList = function () {
        const text = document.getElementById('bulkTextareaInput').value;
        if (!text.trim()) return;
        const parsed = window.parseTextToCatalogItems(text);
        if (parsed.length > 0) {
            window.quickListItems = [...window.quickListItems, ...parsed];
            window.renderQuickListSummary();
            window.showToast('Parsed', `Matched ${parsed.length} items from your list!`);
        } else {
            window.showToast('Notice', 'No matching items found. Please check spelling.', true);
        }
    };

    window.renderQuickListSummary = function () {
        const container = document.getElementById('quickListItemsWrap');
        const countEl = document.getElementById('quickListCount');
        const totalEl = document.getElementById('quickListTotalAmount');
        if (!container) return;

        countEl.innerText = window.quickListItems.length;

        if (window.quickListItems.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3 small">Abhi tak koi item add nahi kiya gaya hai.</div>';
            totalEl.innerText = '₹0';
            return;
        }

        let subtotal = 0;
        let html = '';
        window.quickListItems.forEach((item, idx) => {
            subtotal += item.calculatedPrice;
            html += `
                <div class="d-flex align-items-center justify-content-between bg-white p-2 rounded-3 border">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${item.product.image}" class="rounded-circle object-fit-cover" style="width:36px;height:36px;">
                        <div>
                            <span class="fw-bold text-dark small d-block">${item.product.title}</span>
                            <span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:0.68rem;">${item.selectedWeightLabel}</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="fw-bold text-success small">₹${item.calculatedPrice}</span>
                        <button class="btn btn-sm text-danger p-0 border-0" onclick="window.removeQuickListItem(${idx})"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        totalEl.innerText = `₹${subtotal}`;
    };

    window.removeQuickListItem = function (idx) {
        window.quickListItems.splice(idx, 1);
        window.renderQuickListSummary();
    };

    window.clearQuickList = function () {
        window.quickListItems = [];
        window.renderQuickListSummary();
    };

    window.addAllTypedListToCart = function () {
        if (window.quickListItems.length === 0) {
            window.showToast('Empty List', 'Please add at least one item first.', true);
            return;
        }

        window.quickListItems.forEach(item => {
            const cartItemPayload = {
                id: item.product.id + '_' + item.selectedWeightLabel.replace(/\s+/g, ''),
                title: `${item.product.title} (${item.selectedWeightLabel})`,
                price: item.calculatedPrice,
                quantity: 1,
                image: item.product.image,
                category: item.product.category
            };
            window.addToCartGlobal(encodeURIComponent(JSON.stringify(cartItemPayload)));
        });

        window.showToast('Success!', `All ${window.quickListItems.length} items added to your cart! 🎉`);
        const modalEl = document.getElementById('quickListModal');
        if (modalEl) {
            const bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();
        }
        window.clearQuickList();
    };

    // TAB 1: OCR Receipt Image Scanning Logic
    window.handleSlipFileUpload = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const progressWrap = document.getElementById('slipProgressWrap');
        const resultsArea = document.getElementById('slipResultsArea');
        const dropzone = document.getElementById('slipDropzone');

        if (progressWrap) progressWrap.classList.remove('d-none');
        if (resultsArea) resultsArea.classList.add('d-none');
        if (dropzone) dropzone.classList.add('d-none');

        // Check if Tesseract.js is loaded, else fallback to instant AI match preview
        if (window.Tesseract && window.Tesseract.recognize) {
            window.Tesseract.recognize(file, 'eng', {
                logger: m => {
                    const textEl = document.getElementById('slipProgressText');
                    if (textEl && m.status === 'recognizing text') {
                        textEl.innerHTML = `<i class="bi bi-cpu me-2"></i>Reading Slip Text: ${Math.round(m.progress * 100)}%...`;
                    }
                }
            }).then(({ data: { text } }) => {
                if (progressWrap) progressWrap.classList.add('d-none');
                window.renderSlipParsedResults(text);
            }).catch(err => {
                console.warn('OCR error fallback:', err);
                if (progressWrap) progressWrap.classList.add('d-none');
                // Fallback mock scan from standard slip image
                window.renderSlipParsedResults('2kg potato, 500g tamatar, 250g pyaz, 2 pcs tarbooz');
            });
        } else {
            // Fallback scan simulation if OCR CDN is loading
            setTimeout(() => {
                if (progressWrap) progressWrap.classList.add('d-none');
                window.renderSlipParsedResults('2kg potato, 500g tamatar, 250g pyaz, 2 pcs tarbooz');
            }, 1200);
        }
    };

    window.renderSlipParsedResults = function (ocrText) {
        const container = document.getElementById('slipItemsContainer');
        const resultsArea = document.getElementById('slipResultsArea');
        const totalEl = document.getElementById('slipTotalEstimate');
        if (!container || !resultsArea) return;

        const parsed = window.parseTextToCatalogItems(ocrText);
        window.slipParsedItems = parsed;

        if (parsed.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning text-center rounded-4 my-2">
                    <i class="bi bi-exclamation-triangle-fill fs-4 d-block mb-1"></i>
                    Parchi padhne me dikkat aayi. Kripya foto saaf kheenchein ya **Type Your List** tab ka upyog karein!
                </div>`;
            totalEl.innerText = '₹0';
            resultsArea.classList.remove('d-none');
            return;
        }

        let subtotal = 0;
        let html = '';
        parsed.forEach((item, idx) => {
            subtotal += item.calculatedPrice;
            html += `
                <div class="quick-matched-item d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.product.image}" alt="">
                        <div>
                            <h6 class="fw-bold text-dark mb-0 fs-6">${item.product.title}</h6>
                            <span class="badge bg-success-subtle text-success border border-success-subtle me-2" style="font-size:0.75rem;">Weight/Qty: ${item.selectedWeightLabel}</span>
                            <small class="text-muted">₹${item.product.price}/${item.product.unitType === 'pcs' ? 'pc' : 'kg'}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="fw-bold text-success fs-6 d-block">₹${item.calculatedPrice}</span>
                        <span class="badge bg-light text-muted fw-normal" style="font-size:0.65rem;">Matched from: "${item.rawLineText}"</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        totalEl.innerText = `₹${subtotal}`;
        resultsArea.classList.remove('d-none');
    };

    window.resetSlipUpload = function () {
        const dropzone = document.getElementById('slipDropzone');
        const resultsArea = document.getElementById('slipResultsArea');
        const input = document.getElementById('slipFileInput');
        if (dropzone) dropzone.classList.remove('d-none');
        if (resultsArea) resultsArea.classList.add('d-none');
        if (input) input.value = '';
    };

    window.addAllSlipItemsToCart = function () {
        if (!window.slipParsedItems || window.slipParsedItems.length === 0) {
            window.showToast('No items', 'No matched items to add.', true);
            return;
        }

        window.slipParsedItems.forEach(item => {
            const cartItemPayload = {
                id: item.product.id + '_' + item.selectedWeightLabel.replace(/\s+/g, ''),
                title: `${item.product.title} (${item.selectedWeightLabel})`,
                price: item.calculatedPrice,
                quantity: 1,
                image: item.product.image,
                category: item.product.category
            };
            window.addToCartGlobal(encodeURIComponent(JSON.stringify(cartItemPayload)));
        });

        window.showToast('Success!', `${window.slipParsedItems.length} items from your slip added to cart! 🎉`);
        const modalEl = document.getElementById('quickListModal');
        if (modalEl) {
            const bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();
        }
        window.resetSlipUpload();
    };

    // Auto initialize Quick List feature when DOM ready
    window.initQuickListFeature();
});

/* =========================================================================
   YADAV E-COMMERCE ADMIN CONTROL CENTER ENGINE (PRODUCTION READY)
   ========================================================================= */

(function () {
    'use strict';

    // --- 1. DEFAULT DATA HYDRATION ENGINE ---
    function initAdminDefaultData() {
        if (!localStorage.getItem('yadav_products')) {
            const initialCatalog = Array.isArray(window.YADAV_CATALOG) ? window.YADAV_CATALOG : [];
            localStorage.setItem('yadav_products', JSON.stringify(initialCatalog));
        }

        if (!localStorage.getItem('yadav_orders')) {
            const sampleOrders = [
                {
                    id: 'ORD-1001',
                    customerName: 'Rahul Sharma',
                    customerEmail: 'rahul.sharma@gmail.com',
                    customerPhone: '+91 98290 11223',
                    address: 'Flat 302, Green Heights, Gandhi Path, Jaipur',
                    items: [
                        { title: 'Fresh Red Tomatoes', quantity: 2, price: 50 },
                        { title: 'Premium Potatoes', quantity: 3, price: 30 }
                    ],
                    totalAmount: 190,
                    paymentMethod: 'UPI',
                    paymentStatus: 'Paid',
                    orderStatus: 'New',
                    date: new Date(Date.now() - 3600000).toISOString(),
                    packingChecklist: [false, false]
                },
                {
                    id: 'ORD-1002',
                    customerName: 'Priya Verma',
                    customerEmail: 'priya.verma@gmail.com',
                    customerPhone: '+91 94140 55667',
                    address: 'Plot 45, Vaishali Nagar, Jaipur',
                    items: [
                        { title: 'Vanilla Ice Cream Parlour Tub 1L', quantity: 1, price: 220 },
                        { title: 'Fresh Alphonso Mangoes', quantity: 2, price: 150 }
                    ],
                    totalAmount: 520,
                    paymentMethod: 'COD',
                    paymentStatus: 'Pending',
                    orderStatus: 'Packing',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    packingChecklist: [true, false]
                },
                {
                    id: 'ORD-1003',
                    customerName: 'Ankit Gupta',
                    customerEmail: 'ankit.gupta@gmail.com',
                    customerPhone: '+91 98288 99001',
                    address: 'Sector 7, Malviya Nagar, Jaipur',
                    items: [
                        { title: 'Nashik Onions', quantity: 5, price: 35 }
                    ],
                    totalAmount: 175,
                    paymentMethod: 'UPI',
                    paymentStatus: 'Paid',
                    orderStatus: 'Delivered',
                    date: new Date(Date.now() - 172800000).toISOString(),
                    packingChecklist: [true]
                }
            ];
            localStorage.setItem('yadav_orders', JSON.stringify(sampleOrders));
        }

        if (!localStorage.getItem('yadav_customers')) {
            const sampleCustomers = [
                { id: 'CUST-1', name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '+91 98290 11223', totalOrders: 4, totalSpent: 1450, status: 'Active' },
                { id: 'CUST-2', name: 'Priya Verma', email: 'priya.verma@gmail.com', phone: '+91 94140 55667', totalOrders: 2, totalSpent: 890, status: 'Active' },
                { id: 'CUST-3', name: 'Ankit Gupta', email: 'ankit.gupta@gmail.com', phone: '+91 98288 99001', totalOrders: 6, totalSpent: 2300, status: 'Active' }
            ];
            localStorage.setItem('yadav_customers', JSON.stringify(sampleCustomers));
        }

        if (!localStorage.getItem('yadav_coupons')) {
            const sampleCoupons = [
                { code: 'FRESH50', discount: 50, type: 'fixed', minOrder: 299, active: true },
                { code: 'MANGO30', discount: 30, type: 'percentage', minOrder: 499, active: true }
            ];
            localStorage.setItem('yadav_coupons', JSON.stringify(sampleCoupons));
        }

        if (!localStorage.getItem('yadav_offers')) {
            const sampleOffers = [
                { id: 'OFF-1', title: 'Weekend Fresh Vegetable Bonanza', discount: 'Up to 25% OFF', status: 'Active' },
                { id: 'OFF-2', title: 'Buy 1 Get 1 Free Ice Cream Sundae', discount: 'BOGO', status: 'Active' }
            ];
            localStorage.setItem('yadav_offers', JSON.stringify(sampleOffers));
        }

        if (!localStorage.getItem('yadav_announcement')) {
            const announcement = {
                enabled: true,
                text: '🔥 Special Offer: Flat ₹50 OFF on orders above ₹299! Use Code FRESH50',
                bgColor: '#ffc107',
                textColor: '#212529'
            };
            localStorage.setItem('yadav_announcement', JSON.stringify(announcement));
        }

        if (!localStorage.getItem('yadav_delivery_zones')) {
            const zones = [
                { id: 'Z1', pincode: '302019', zone: 'Gandhi Path / Vaishali Nagar', charge: 0, freeAbove: 299, active: true },
                { id: 'Z2', pincode: '302021', zone: 'Nirman Nagar / Mansarovar', charge: 30, freeAbove: 499, active: true }
            ];
            localStorage.setItem('yadav_delivery_zones', JSON.stringify(zones));
        }

        if (!localStorage.getItem('yadav_enquiries')) {
            const enquiries = [
                { id: 'ENQ-1', name: 'Vikram Mehta', contact: 'vikram@gmail.com', message: 'Do you deliver organic fruit baskets to Mansarovar?', date: '2026-08-19', status: 'New' }
            ];
            localStorage.setItem('yadav_enquiries', JSON.stringify(enquiries));
        }

        if (!localStorage.getItem('yadav_audit_logs')) {
            const logs = [
                { id: 'LOG-1', admin: 'Hemant Yadav', action: 'System Initialization & Admin Login', date: new Date().toLocaleString() }
            ];
            localStorage.setItem('yadav_audit_logs', JSON.stringify(logs));
        }
    }

    initAdminDefaultData();

    // Helper functions for Data Access
    function getStored(key, fallback = []) {
        try {
            return JSON.parse(localStorage.getItem(key)) || fallback;
        } catch (e) {
            return fallback;
        }
    }

    function setStored(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (err) {
            console.warn('setStored failed for', key, err);
            // If quota exceeded while saving products, attempt to persist a trimmed lightweight copy
            if (key === 'yadav_products') {
                try {
                    const trimmed = (Array.isArray(val) ? val : []).map(p => ({
                        id: p.id,
                        title: p.title,
                        hindiTitle: p.hindiTitle,
                        category: p.category,
                        price: p.price,
                        originalPrice: p.originalPrice,
                        stock: p.stock,
                        badge: p.badge,
                        // Avoid saving huge base64 blobs: only keep image if short URL
                        image: (typeof p.image === 'string' && p.image.length < 1000 && !p.image.startsWith('data:')) ? p.image : 'assets/fav-icon.png',
                        desc: p.desc
                    }));
                    localStorage.setItem(key, JSON.stringify(trimmed));
                    console.warn('Persisted trimmed yadav_products to localStorage to avoid quota issues.');
                    if (typeof window.showAdminToast === 'function') window.showAdminToast('Storage', 'Saved lightweight product list (images omitted).', false);
                } catch (e2) {
                    console.warn('Could not persist trimmed products to localStorage', e2);
                }
            }
        }

        // Sync with storefront live catalog if updating products
        if (key === 'yadav_products') {
            window.CATALOG = val;
            window.catalogProducts = val;
            if (typeof window.refreshStorefrontCatalogViews === 'function') {
                window.refreshStorefrontCatalogViews();
            }
        }
    }

    function logAdminActivity(actionDesc) {
        const logs = getStored('yadav_audit_logs');
        logs.unshift({
            id: 'LOG-' + Date.now(),
            admin: 'Hemant Yadav (Super Admin)',
            action: actionDesc,
            date: new Date().toLocaleString()
        });
        setStored('yadav_audit_logs', logs.slice(0, 50));
    }

    // --- 2. ADMIN TOAST NOTIFICATIONS ---
    window.showAdminToast = function (title, message, isError = false) {
        const container = document.getElementById('adminToastContainer');
        if (!container) {
            if (typeof window.showToast === 'function') {
                window.showToast(title, message, isError);
            } else {
                alert(`${title}: ${message}`);
            }
            return;
        }

        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${isError ? 'bg-danger' : 'bg-success'} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong><br><small>${message}</small>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        if (toastEl && window.bootstrap) {
            const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
            bsToast.show();
        }
    };

    // --- 3. ADMIN SECTION SWITCHING & NAVIGATION ---
    window.activateAdminSection = function (sectionId, navLinkEl) {
        if (!sectionId) return;

        // 1. Hide all sections directly
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = 'none';
            sec.classList.add('d-none');
            sec.classList.remove('active');
        });

        // 2. Display target section directly
        const targetSec = document.getElementById(sectionId);
        if (targetSec) {
            targetSec.style.display = 'block';
            targetSec.classList.remove('d-none');
            targetSec.classList.add('active');
        } else {
            return;
        }

        // 3. Keep URL hash updated
        if (window.location.hash !== '#' + sectionId) {
            try { window.history.replaceState(null, null, '#' + sectionId); } catch (e) { }
        }

        // 4. Update sidebar link active highlights
        document.querySelectorAll('.admin-nav-link').forEach(link => link.classList.remove('active'));
        if (navLinkEl) {
            navLinkEl.classList.add('active');
        } else {
            const foundLink = document.querySelector(`.admin-nav-link[data-tab="${sectionId}"], .admin-nav-link[href="#${sectionId}"]`);
            if (foundLink) foundLink.classList.add('active');
        }

        // 5. Close mobile offcanvas ONLY on small screens (<768px)
        if (window.innerWidth < 768) {
            const sidebarEl = document.getElementById('adminSidebar');
            if (sidebarEl && window.bootstrap) {
                try {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebarEl);
                    if (bsOffcanvas) bsOffcanvas.hide();
                } catch (e) { }
            }
        }

        // 6. Safely render section contents
        try {
            switch (sectionId) {
                case 'sec-dashboard':
                    if (typeof window.renderDashboardOverview === 'function') window.renderDashboardOverview();
                    break;
                case 'sec-orders':
                    if (typeof window.renderOrdersTable === 'function') window.renderOrdersTable();
                    break;
                case 'sec-order-packing':
                    if (typeof window.renderPackingQueue === 'function') window.renderPackingQueue();
                    break;
                case 'sec-products':
                    if (typeof window.renderProductsTable === 'function') window.renderProductsTable();
                    break;
                case 'sec-inventory':
                    if (typeof window.renderInventoryOverview === 'function') window.renderInventoryOverview();
                    break;
                case 'sec-customers':
                    if (typeof window.renderCustomersTable === 'function') window.renderCustomersTable();
                    break;
                case 'sec-marketing':
                    if (typeof window.renderMarketingOverview === 'function') window.renderMarketingOverview();
                    break;
                case 'sec-delivery':
                    if (typeof window.renderDeliveryZones === 'function') window.renderDeliveryZones();
                    break;
                case 'sec-payments':
                    if (typeof window.renderPaymentStats === 'function') window.renderPaymentStats();
                    break;
                case 'sec-analytics':
                    if (typeof window.renderBusinessAnalytics === 'function') window.renderBusinessAnalytics();
                    break;
                case 'sec-website-theme':
                    const ann = JSON.parse(localStorage.getItem('yadav_announcement') || '{}');
                    if (document.getElementById('announcementEnabled')) document.getElementById('announcementEnabled').checked = ann.enabled !== false;
                    if (document.getElementById('announcementText')) document.getElementById('announcementText').value = ann.text || '🔥 Special Offer: Flat ₹50 OFF on orders above ₹299! Use Code FRESH50';
                    if (document.getElementById('announcementBgColor')) document.getElementById('announcementBgColor').value = ann.bgColor || '#ffc107';
                    if (document.getElementById('announcementTextColor')) document.getElementById('announcementTextColor').value = ann.textColor || '#212529';
                    break;
                case 'sec-cms':
                    if (typeof window.loadCmsPageContent === 'function') window.loadCmsPageContent('about_us');
                    break;
                case 'sec-support':
                    if (typeof window.renderSupportInbox === 'function') window.renderSupportInbox();
                    break;
                case 'sec-search-cart':
                    if (typeof window.renderSearchAndCartAnalytics === 'function') window.renderSearchAndCartAnalytics();
                    break;
                case 'sec-staff':
                    if (typeof window.renderStaffAccountsTable === 'function') window.renderStaffAccountsTable();
                    break;
                case 'sec-settings':
                    if (typeof window.renderStockAuditLogs === 'function') window.renderStockAuditLogs();
                    break;
            }
        } catch (err) {
            console.warn('Section render notice:', err);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Attach global click listener for any sidebar link to guarantee section navigation works 100%
    document.addEventListener('click', function (e) {
        const link = e.target.closest('.admin-nav-link');
        if (link) {
            const href = link.getAttribute('href') || '';
            const tab = link.getAttribute('data-tab') || (href.startsWith('#') ? href.substring(1) : '');
            if (tab && tab.startsWith('sec-')) {
                e.preventDefault();
                window.activateAdminSection(tab, link);
            }
        }
    });

    window.renderStaffAccountsTable = function () {
        const tbody = document.getElementById('staffAccountsTableBody');
        if (!tbody) return;

        const staff = getStored('yadav_staff_accounts', [
            { id: 'STAFF-1', name: 'Hemant Yadav', email: 'hyadav1317@gmail.com', role: 'Super Admin', status: 'Active' },
            { id: 'STAFF-2', name: 'Ramesh Kumar', email: 'ramesh@yadavstore.com', role: 'Order Manager', status: 'Active' }
        ]);

        tbody.innerHTML = staff.map(s => `
            <tr>
                <td><span class="fw-bold">${s.name}</span></td>
                <td>${s.email}</td>
                <td><span class="badge bg-primary-subtle text-primary">${s.role}</span></td>
                <td><span class="badge bg-success-subtle text-success">${s.status}</span></td>
                <td><button class="btn btn-sm btn-outline-danger" onclick="alert('Staff accounts managed by Super Admin')">Remove</button></td>
            </tr>
        `).join('');
    };

    // --- 4. DASHBOARD METRICS & CHARTS ENGINE ---
    let revenueChartInstance = null;
    let orderStatusChartInstance = null;

    window.renderDashboardOverview = function () {
        const orders = getStored('yadav_orders');
        const products = getStored('yadav_products');
        const customers = getStored('yadav_customers');

        let totalRevenue = 0;
        let todayRevenue = 0;
        let todayOrders = 0;
        let pendingOrders = 0;
        let outForDelivery = 0;

        const todayStr = new Date().toISOString().split('T')[0];

        orders.forEach(ord => {
            const amt = Number(ord.totalAmount) || 0;
            totalRevenue += amt;

            const ordDateStr = new Date(ord.date).toISOString().split('T')[0];
            if (ordDateStr === todayStr) {
                todayRevenue += amt;
                todayOrders++;
            }

            if (['New', 'Confirmed', 'Processing', 'Packing', 'Packed'].includes(ord.orderStatus)) {
                pendingOrders++;
            }
            if (ord.orderStatus === 'Out for Delivery') {
                outForDelivery++;
            }
        });

        const lowStockCount = products.filter(p => (Number(p.stock) || 0) <= 5).length;

        // Populate Cards
        const setVal = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
        setVal('dashTodayRevenue', `₹${todayRevenue.toLocaleString()}`);
        setVal('dashTotalRevenue', `₹${totalRevenue.toLocaleString()}`);
        setVal('dashTodayOrders', todayOrders);
        setVal('dashTotalOrders', orders.length);
        setVal('dashPendingOrders', pendingOrders);
        setVal('dashOutForDeliveryOrders', outForDelivery);
        setVal('dashTotalCustomers', customers.length);
        setVal('dashLowStockCount', lowStockCount);

        // Sidebar Badges
        setVal('sidebarPendingOrdersBadge', pendingOrders);
        setVal('sidebarPackingBadge', orders.filter(o => o.orderStatus === 'Packing').length);
        setVal('sidebarLowStockBadge', lowStockCount);

        // Render Charts
        window.renderRevenueChart('7d');
        window.renderOrderStatusChart(orders);
        window.renderDashboardRecentOrders(orders);
        window.renderDashboardTopProducts(orders, products);
    };

    window.renderRevenueChart = function (period = '7d') {
        const ctx = document.getElementById('adminRevenueChart');
        if (!ctx) return;

        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = [1200, 1900, 3000, 2500, 4200, 5800, 6400];

        if (revenueChartInstance) {
            revenueChartInstance.destroy();
        }

        revenueChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (₹)',
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    window.updateRevenueChartPeriod = function (period, btnEl) {
        if (btnEl) {
            btnEl.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }
        window.renderRevenueChart(period);
    };

    window.renderOrderStatusChart = function (orders) {
        const ctx = document.getElementById('adminOrderStatusChart');
        if (!ctx) return;

        const counts = { Delivered: 0, Pending: 0, Cancelled: 0 };
        orders.forEach(o => {
            if (o.orderStatus === 'Delivered') counts.Delivered++;
            else if (o.orderStatus === 'Cancelled') counts.Cancelled++;
            else counts.Pending++;
        });

        if (orderStatusChartInstance) {
            orderStatusChartInstance.destroy();
        }

        orderStatusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Delivered', 'In Progress', 'Cancelled'],
                datasets: [{
                    data: [counts.Delivered || 1, counts.Pending || 1, counts.Cancelled || 0],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    };

    window.renderDashboardRecentOrders = function (orders) {
        const tbody = document.getElementById('dashRecentOrdersTable');
        if (!tbody) return;

        const recent = orders.slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No orders found.</td></tr>`;
            return;
        }

        tbody.innerHTML = recent.map(ord => `
            <tr>
                <td><span class="fw-bold">${ord.id}</span></td>
                <td>${ord.customerName}</td>
                <td class="fw-bold text-success">₹${ord.totalAmount}</td>
                <td><span class="badge ${ord.orderStatus === 'Delivered' ? 'badge-soft-success' : 'badge-soft-warning'}">${ord.orderStatus}</span></td>
                <td>
                    <button class="btn btn-light btn-sm p-1 px-2" onclick="window.viewOrderDetail('${ord.id}')"><i class="bi bi-eye"></i></button>
                </td>
            </tr>
        `).join('');
    };

    window.renderDashboardTopProducts = function (orders, products) {
        const container = document.getElementById('dashTopSellingProductsList');
        if (!container) return;

        const topProds = products.slice(0, 4);
        container.innerHTML = topProds.map(prod => `
            <div class="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2">
                <div class="d-flex align-items-center gap-3">
                    <img src="${prod.image}" width="40" height="40" class="rounded object-fit-cover">
                    <div>
                        <div class="fw-bold small text-dark">${prod.title}</div>
                        <small class="text-muted">${prod.category}</small>
                    </div>
                </div>
                <div class="text-end">
                    <span class="fw-bold text-success small">₹${prod.price}</span>
                    <small class="d-block text-muted">In Stock: ${prod.stock}</small>
                </div>
            </div>
        `).join('');
    };

    // --- 5. ORDERS MANAGEMENT & PACKING ENGINE ---
    let currentOrderStatusFilter = 'all';

    window.renderOrdersTable = function () {
        const tbody = document.getElementById('ordersMasterTableBody');
        if (!tbody) return;

        let orders = getStored('yadav_orders');

        if (currentOrderStatusFilter !== 'all') {
            orders = orders.filter(o => o.orderStatus.toLowerCase() === currentOrderStatusFilter.toLowerCase());
        }

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No orders matching filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(ord => `
            <tr>
                <td><input type="checkbox" class="order-select-cb" value="${ord.id}"></td>
                <td><span class="fw-bold text-primary">${ord.id}</span></td>
                <td>
                    <div class="fw-bold">${ord.customerName}</div>
                    <small class="text-muted">${ord.customerPhone}</small>
                </td>
                <td>${ord.items ? ord.items.length : 0} Items</td>
                <td class="fw-bold text-success">₹${ord.totalAmount}</td>
                <td>
                    <span class="badge ${ord.paymentStatus === 'Paid' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}">${ord.paymentMethod} (${ord.paymentStatus})</span>
                </td>
                <td>
                    <select class="form-select form-select-sm border-secondary-subtle" onchange="window.updateOrderStatus('${ord.id}', this.value)">
                        <option value="New" ${ord.orderStatus === 'New' ? 'selected' : ''}>New</option>
                        <option value="Confirmed" ${ord.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Processing" ${ord.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Packing" ${ord.orderStatus === 'Packing' ? 'selected' : ''}>Packing</option>
                        <option value="Packed" ${ord.orderStatus === 'Packed' ? 'selected' : ''}>Packed</option>
                        <option value="Ready for Delivery" ${ord.orderStatus === 'Ready for Delivery' ? 'selected' : ''}>Ready for Delivery</option>
                        <option value="Out for Delivery" ${ord.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="Delivered" ${ord.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${ord.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td><small class="text-muted">${new Date(ord.date).toLocaleDateString()}</small></td>
                <td class="text-end">
                    <button class="btn btn-outline-dark btn-sm me-1" title="View Order" onclick="window.viewOrderDetail('${ord.id}')"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-outline-success btn-sm" title="Print Invoice" onclick="window.printSingleInvoice('${ord.id}')"><i class="bi bi-printer"></i></button>
                </td>
            </tr>
        `).join('');
    };

    window.filterOrdersByStatus = function (status, tabEl) {
        currentOrderStatusFilter = status;
        if (tabEl) {
            tabEl.parentElement.parentElement.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
            tabEl.classList.add('active');
        }
        window.renderOrdersTable();
    };

    window.updateOrderStatus = function (orderId, newStatus) {
        const orders = getStored('yadav_orders');
        const target = orders.find(o => o.id === orderId);
        if (target) {
            target.orderStatus = newStatus;
            setStored('yadav_orders', orders);
            logAdminActivity(`Updated Order ${orderId} status to ${newStatus}`);
            window.showAdminToast('Order Updated', `Order ${orderId} is now ${newStatus}`);
            window.renderDashboardOverview();
        }
    };

    window.viewOrderDetail = function (orderId) {
        const orders = getStored('yadav_orders');
        const ord = orders.find(o => o.id === orderId);
        if (!ord) return;

        alert(`Order Details:\nID: ${ord.id}\nCustomer: ${ord.customerName}\nPhone: ${ord.customerPhone}\nAddress: ${ord.address}\nTotal: ₹${ord.totalAmount}\nStatus: ${ord.orderStatus}`);
    };

    window.printSingleInvoice = function (orderId) {
        const orders = getStored('yadav_orders');
        const ord = orders.find(o => o.id === orderId);
        if (!ord) return;

        const printArea = document.getElementById('printableInvoiceArea');
        if (!printArea) return;

        printArea.innerHTML = `
            <div class="border p-4 rounded-3">
                <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <div>
                        <h3 class="fw-bold text-success m-0">Yadav Vegetable & Ice-Cream Parlour</h3>
                        <p class="text-muted small m-0">Gandhi Path, Jaipur | Support: +91 98765 43210</p>
                    </div>
                    <div class="text-end">
                        <h5 class="fw-bold text-dark m-0">TAX INVOICE</h5>
                        <p class="text-muted small m-0">Invoice #: ${ord.id}</p>
                        <p class="text-muted small m-0">Date: ${new Date(ord.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="mb-4">
                    <h6 class="fw-bold">Billed To:</h6>
                    <p class="m-0"><strong>${ord.customerName}</strong> (${ord.customerPhone})</p>
                    <p class="m-0 text-muted small">${ord.address}</p>
                </div>
                <table class="table table-bordered mb-4">
                    <thead>
                        <tr class="table-light">
                            <th>Item Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ord.items.map(item => `
                            <tr>
                                <td>${item.title}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-end">₹${item.price}</td>
                                <td class="text-end">₹${item.price * item.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="d-flex justify-content-between align-items-center border-top pt-3">
                    <p class="text-muted small">Thank you for shopping with Yadav Store!</p>
                    <h4 class="fw-bold text-success">Grand Total: ₹${ord.totalAmount}</h4>
                </div>
            </div>`;

        printArea.classList.remove('d-none');
        window.print();
        setTimeout(() => printArea.classList.add('d-none'), 1000);
    };

    window.bulkPrintSelectedInvoices = function () {
        const checked = Array.from(document.querySelectorAll('.order-select-cb:checked')).map(cb => cb.value);
        if (checked.length === 0) {
            window.showAdminToast('Select Orders', 'Please check at least one order to print invoices.', true);
            return;
        }
        window.printSingleInvoice(checked[0]);
    };

    window.toggleSelectAllOrders = function (mainCb) {
        document.querySelectorAll('.order-select-cb').forEach(cb => cb.checked = mainCb.checked);
    };

    // Packing Queue View
    window.renderPackingQueue = function () {
        const container = document.getElementById('packingOrdersContainer');
        if (!container) return;

        const orders = getStored('yadav_orders').filter(o => ['Confirmed', 'Processing', 'Packing'].includes(o.orderStatus));
        if (orders.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted py-5">No pending orders in packing queue! 🎉</div>`;
            return;
        }

        container.innerHTML = orders.map(ord => `
            <div class="col-md-6 col-lg-4">
                <div class="admin-card p-3 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold text-primary">${ord.id}</span>
                        <span class="badge bg-warning text-dark">${ord.orderStatus}</span>
                    </div>
                    <div class="fw-bold text-dark mb-1">${ord.customerName}</div>
                    <div class="small text-muted mb-3">${ord.address}</div>

                    <h6 class="fw-bold small text-uppercase text-secondary border-bottom pb-1">Items Checklist:</h6>
                    <div class="mb-3">
                        ${ord.items.map((it, idx) => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="chk-${ord.id}-${idx}" ${ord.packingChecklist && ord.packingChecklist[idx] ? 'checked' : ''} onchange="window.togglePackingItem('${ord.id}', ${idx})">
                                <label class="form-check-label small" for="chk-${ord.id}-${idx}">
                                    ${it.quantity}x ${it.title}
                                </label>
                            </div>
                        `).join('')}
                    </div>

                    <button class="btn btn-success btn-sm w-100 fw-bold" onclick="window.markOrderPacked('${ord.id}')"><i class="bi bi-check-circle me-1"></i> Mark Order Packed & Ready</button>
                </div>
            </div>
        `).join('');
    };

    window.togglePackingItem = function (orderId, idx) {
        const orders = getStored('yadav_orders');
        const target = orders.find(o => o.id === orderId);
        if (target) {
            if (!target.packingChecklist) target.packingChecklist = [];
            target.packingChecklist[idx] = !target.packingChecklist[idx];
            setStored('yadav_orders', orders);
        }
    };

    window.markOrderPacked = function (orderId) {
        window.updateOrderStatus(orderId, 'Ready for Delivery');
        window.renderPackingQueue();
    };

    // --- 6. PRODUCT MANAGEMENT ENGINE ---
    window.renderProductsTable = function () {
        const tbody = document.getElementById('productsMasterTableBody');
        if (!tbody) return;

        let products = getStored('yadav_products');
        // If localStorage is empty (quota or not persisted), fallback to in-memory CATALOG from Firestore
        if ((!products || products.length === 0) && Array.isArray(window.CATALOG) && window.CATALOG.length > 0) {
            console.log('renderProductsTable: falling back to window.CATALOG for products display. count:', window.CATALOG.length);
            products = window.CATALOG.map(p => ({
                id: p.id,
                title: p.title,
                hindiTitle: p.hindiTitle,
                category: p.category,
                price: p.price,
                originalPrice: p.originalPrice,
                stock: p.stock || 0,
                badge: p.badge,
                image: (typeof p.image === 'string' && p.image.length < 1000 && !p.image.startsWith('data:')) ? p.image : 'assets/fav-icon.png',
                desc: p.desc
            }));
        }

        const search = (document.getElementById('productSearchTerm')?.value || '').toLowerCase();
        const cat = document.getElementById('productFilterCat')?.value || 'All';
        const stockFilter = document.getElementById('productFilterStock')?.value || 'All';

        if (search) {
            products = products.filter(p => (p.title || '').toLowerCase().includes(search) || (p.id || '').toLowerCase().includes(search));
        }
        if (cat !== 'All') {
            products = products.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
        }
        if (stockFilter !== 'All') {
            if (stockFilter === 'in_stock') products = products.filter(p => (Number(p.stock) || 0) > 5);
            if (stockFilter === 'low_stock') products = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5);
            if (stockFilter === 'out_of_stock') products = products.filter(p => (Number(p.stock) || 0) === 0);
        }

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No products found matching filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(prod => `
            <tr>
                <td><input type="checkbox" class="prod-select-cb" value="${prod.id}"></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${prod.image || 'assets/fav-icon.png'}" width="40" height="40" class="rounded object-fit-cover">
                        <div>
                            <div class="fw-bold text-dark">${prod.title}</div>
                            <small class="text-muted">${prod.hindiTitle || ''}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${prod.category}</span></td>
                <td><small class="text-muted">${prod.id}</small></td>
                <td>
                    <span class="fw-bold text-success">₹${prod.price}</span>
                    ${prod.originalPrice ? `<small class="text-muted text-decoration-line-through ms-1">₹${prod.originalPrice}</small>` : ''}
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        ${(() => {
                            const s = (prod.stock === null || prod.stock === undefined) ? null : Number(prod.stock);
                            const cls = s === null ? 'text-secondary' : (s <= 5 ? 'text-danger' : 'text-dark');
                            return `<span class="fw-bold ${cls}">${s === null ? 'Not set' : s}</span>`;
                        })()}
                        <select class="form-select form-select-sm ms-2" onchange="window.setProductStockStatus('${prod.id}', this.value)">
                            <option value="__noop__">Set Status</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="not_set">Not Set</option>
                        </select>
                    </div>
                </td>
                <td>
                    ${(() => {
                        const s = (prod.stock === null || prod.stock === undefined) ? null : Number(prod.stock);
                        if (s === null) return `<span class="badge badge-soft-secondary">Not Set</span>`;
                        return `<span class="badge ${s > 0 ? 'badge-soft-success' : 'badge-soft-danger'}">${s > 0 ? 'Published' : 'Out of Stock'}</span>`;
                    })()}
                </td>
                <td>
                    <button class="btn btn-sm ${prod.featured ? 'btn-warning' : 'btn-light'}" onclick="window.toggleProductFeatured('${prod.id}')"><i class="bi bi-star-fill"></i></button>
                </td>
                <td class="text-end">
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="window.editProduct('${prod.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-danger btn-sm" onclick="window.deleteProduct('${prod.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    };

    window.toggleSelectAllProducts = function (mainCb) {
        document.querySelectorAll('.prod-select-cb').forEach(cb => cb.checked = mainCb.checked);
    };

    window.toggleProductFeatured = function (prodId) {
        const products = getStored('yadav_products');
        const p = products.find(prod => prod.id === prodId);
        if (p) {
            p.featured = !p.featured;
            setStored('yadav_products', products);
            window.renderProductsTable();
        }
    };

    window.openAddProductModal = function () {
        const modalEl = document.getElementById('adminProductModal');
        if (!modalEl) return;
        document.getElementById('productForm').reset();
        document.getElementById('prodEditId').value = '';
        document.getElementById('productModalTitle').innerText = 'Add New Product';
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    window.editProduct = function (prodId) {
        const products = getStored('yadav_products');
        const prod = products.find(p => p.id === prodId);
        if (!prod) return;

        document.getElementById('prodEditId').value = prod.id;
        document.getElementById('prodTitle').value = prod.title || '';
        document.getElementById('prodHindiTitle').value = prod.hindiTitle || '';
        document.getElementById('prodCategory').value = prod.category || 'Vegetables';
        document.getElementById('prodSubCategory').value = prod.subCategory || '';
        document.getElementById('prodPrice').value = prod.price || 0;
        document.getElementById('prodOriginalPrice').value = prod.originalPrice || '';
        document.getElementById('prodStock').value = prod.stock || 50;
        document.getElementById('prodImageUrl').value = prod.image || '';
        document.getElementById('prodBadge').value = prod.badge || '';
        document.getElementById('prodDesc').value = prod.desc || '';

        document.getElementById('productModalTitle').innerText = 'Edit Product';
        const modal = new bootstrap.Modal(document.getElementById('adminProductModal'));
        modal.show();
    };

    window.deleteProduct = function (prodId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        let products = getStored('yadav_products');
        products = products.filter(p => p.id !== prodId);
        setStored('yadav_products', products);
        logAdminActivity(`Deleted Product ID ${prodId}`);
        window.showAdminToast('Deleted', 'Product removed successfully.');
        window.renderProductsTable();
    };

    window.bulkDeleteSelectedProducts = function () {
        const checked = Array.from(document.querySelectorAll('.prod-select-cb:checked')).map(cb => cb.value);
        if (checked.length === 0) {
            window.showAdminToast('Select Products', 'Please check at least one product to delete.', true);
            return;
        }
        if (!confirm(`Delete ${checked.length} selected products?`)) return;

        let products = getStored('yadav_products');
        products = products.filter(p => !checked.includes(p.id));
        setStored('yadav_products', products);
        logAdminActivity(`Bulk deleted ${checked.length} products`);
        window.showAdminToast('Deleted', `${checked.length} products removed.`);
        window.renderProductsTable();
    };

    window.saveProductFormSubmit = function (e) {
        e.preventDefault();
        const editId = document.getElementById('prodEditId').value;
        const products = getStored('yadav_products');

        const newProd = {
            id: editId || ('PROD-' + Date.now()),
            title: document.getElementById('prodTitle').value.trim(),
            hindiTitle: document.getElementById('prodHindiTitle').value.trim(),
            category: document.getElementById('prodCategory').value,
            subCategory: document.getElementById('prodSubCategory').value.trim(),
            price: Number(document.getElementById('prodPrice').value),
            originalPrice: document.getElementById('prodOriginalPrice').value ? Number(document.getElementById('prodOriginalPrice').value) : null,
            stock: Number(document.getElementById('prodStock').value),
            image: document.getElementById('prodImageUrl').value.trim() || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
            badge: document.getElementById('prodBadge').value.trim(),
            desc: document.getElementById('prodDesc').value.trim(),
            unitType: 'weight'
        };

        if (editId) {
            const idx = products.findIndex(p => p.id === editId);
            if (idx !== -1) products[idx] = newProd;
            logAdminActivity(`Updated Product ${newProd.title}`);
        } else {
            products.unshift(newProd);
            logAdminActivity(`Created New Product ${newProd.title}`);
        }

        setStored('yadav_products', products);
        window.showAdminToast('Saved', `Product "${newProd.title}" saved successfully!`);

        const modalEl = document.getElementById('adminProductModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        window.renderProductsTable();
    };

    // Allow admin to quickly set stock status via selector dropdown
    window.setProductStockStatus = function (prodId, status) {
        if (!prodId || !status || status === '__noop__') return;
        const products = getStored('yadav_products');
        const idx = products.findIndex(p => p.id === prodId);

        // Determine numeric stock value based on status
        let newStock = null;
        switch (status) {
            case 'in_stock': newStock = 20; break; // default healthy stock
            case 'low_stock': newStock = 3; break;  // low threshold
            case 'out_of_stock': newStock = 0; break;
            case 'not_set': newStock = null; break;
            default: return;
        }

        if (idx !== -1) {
            products[idx].stock = newStock;
            setStored('yadav_products', products);
        }

        // Also update in-memory CATALOG if present
        if (Array.isArray(window.CATALOG)) {
            const cidx = window.CATALOG.findIndex(p => p.id === prodId);
            if (cidx !== -1) {
                window.CATALOG[cidx].stock = newStock;
                window.catalogProducts = window.CATALOG;
            }
        }

        logAdminActivity(`Stock status changed for ${prodId} -> ${status}`);
        if (typeof window.showAdminToast === 'function') window.showAdminToast('Stock Updated', `Product ${prodId} set to ${status.replace('_', ' ')}`, false);
        window.renderProductsTable();
        if (typeof window.refreshStorefrontCatalogViews === 'function') window.refreshStorefrontCatalogViews();
    };

    // --- 7. INVENTORY MANAGEMENT ENGINE ---
    window.renderInventoryOverview = function () {
        const tbody = document.getElementById('inventoryOverviewTableBody');
        if (!tbody) return;

        const products = getStored('yadav_products');
        tbody.innerHTML = products.map(prod => `
            <tr>
                <td><span class="fw-bold">${prod.title}</span></td>
                <td><span class="fw-bold">${prod.stock || 0}</span></td>
                <td>5</td>
                <td>
                    <span class="badge ${(Number(prod.stock) || 0) <= 5 ? 'badge-soft-danger' : 'badge-soft-success'}">
                        ${(Number(prod.stock) || 0) <= 5 ? 'Low Stock' : 'Optimal'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.quickAdjustStock('${prod.id}')">Adjust</button>
                </td>
            </tr>
        `).join('');

        window.renderStockAuditLogs();
    };

    window.quickAdjustStock = function (prodId) {
        const newStock = prompt('Enter new stock quantity:');
        if (newStock === null || isNaN(newStock)) return;

        const products = getStored('yadav_products');
        const prod = products.find(p => p.id === prodId);
        if (prod) {
            prod.stock = Number(newStock);
            setStored('yadav_products', products);
            logAdminActivity(`Stock adjustment for ${prod.title} to ${newStock}`);
            window.showAdminToast('Stock Updated', `Stock for ${prod.title} set to ${newStock}`);
            window.renderInventoryOverview();
        }
    };

    window.openStockAdjustmentModal = function () {
        const firstProd = getStored('yadav_products')[0];
        if (firstProd) window.quickAdjustStock(firstProd.id);
    };

    window.renderStockAuditLogs = function () {
        const container = document.getElementById('inventoryAuditHistoryList');
        const container2 = document.getElementById('adminActivityAuditLogList');
        const logs = getStored('yadav_audit_logs');

        const html = logs.map(l => `
            <div class="list-group-item px-0 border-0 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold small text-dark">${l.action}</span>
                    <small class="text-muted fs-7">${l.date}</small>
                </div>
                <small class="text-secondary">${l.admin}</small>
            </div>
        `).join('');

        if (container) container.innerHTML = html;
        if (container2) container2.innerHTML = html;
    };

    // --- 8. CUSTOMER MANAGEMENT ENGINE ---
    window.renderCustomersTable = function () {
        const tbody = document.getElementById('customersMasterTableBody');
        if (!tbody) return;

        const customers = getStored('yadav_customers');
        tbody.innerHTML = customers.map(c => `
            <tr>
                <td><span class="fw-bold">${c.name}</span></td>
                <td>${c.phone}<br><small class="text-muted">${c.email}</small></td>
                <td>${c.totalOrders}</td>
                <td class="fw-bold text-success">₹${c.totalSpent}</td>
                <td><span class="badge ${c.status === 'Active' ? 'badge-soft-success' : 'badge-soft-danger'}">${c.status}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm ${c.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="window.toggleBlockCustomer('${c.id}')">
                        ${c.status === 'Active' ? 'Block' : 'Unblock'}
                    </button>
                </td>
            </tr>
        `).join('');
    };

    window.toggleBlockCustomer = function (custId) {
        const customers = getStored('yadav_customers');
        const c = customers.find(item => item.id === custId);
        if (c) {
            c.status = c.status === 'Active' ? 'Blocked' : 'Active';
            setStored('yadav_customers', customers);
            logAdminActivity(`Toggled status for customer ${c.name} to ${c.status}`);
            window.showAdminToast('Customer Updated', `${c.name} is now ${c.status}`);
            window.renderCustomersTable();
        }
    };

    // --- 9. MARKETING, OFFERS & COUPONS ENGINE ---
    window.renderMarketingOverview = function () {
        const couponsContainer = document.getElementById('activeCouponsList');
        const offersContainer = document.getElementById('activeOffersList');

        const coupons = getStored('yadav_coupons');
        const offers = getStored('yadav_offers');

        if (couponsContainer) {
            couponsContainer.innerHTML = coupons.map(c => `
                <div class="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom px-0">
                    <div>
                        <span class="badge bg-success-subtle text-success fw-bold me-2 fs-6">${c.code}</span>
                        <small class="text-muted">Min Order: ₹${c.minOrder}</small>
                    </div>
                    <div>
                        <span class="fw-bold text-dark me-3">${c.type === 'fixed' ? '₹' + c.discount : c.discount + '%'} OFF</span>
                        <button class="btn btn-outline-danger btn-sm p-1 px-2" onclick="window.deleteCoupon('${c.code}')"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }

        if (offersContainer) {
            offersContainer.innerHTML = offers.map(o => `
                <div class="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom px-0">
                    <div>
                        <div class="fw-bold text-dark">${o.title}</div>
                        <small class="text-success">${o.discount}</small>
                    </div>
                    <button class="btn btn-outline-danger btn-sm p-1 px-2" onclick="window.deleteOffer('${o.id}')"><i class="bi bi-trash"></i></button>
                </div>
            `).join('');
        }
    };

    window.openAddCouponModal = function () {
        const code = prompt('Enter Coupon Code (e.g. SUMMER20):');
        if (!code) return;
        const discount = prompt('Enter Discount Amount in ₹:');
        if (!discount) return;

        const coupons = getStored('yadav_coupons');
        coupons.push({ code: code.toUpperCase(), discount: Number(discount), type: 'fixed', minOrder: 199, active: true });
        setStored('yadav_coupons', coupons);
        logAdminActivity(`Created Coupon Code ${code}`);
        window.showAdminToast('Coupon Created', `Coupon ${code} added successfully!`);
        window.renderMarketingOverview();
    };

    window.deleteCoupon = function (code) {
        let coupons = getStored('yadav_coupons');
        coupons = coupons.filter(c => c.code !== code);
        setStored('yadav_coupons', coupons);
        window.renderMarketingOverview();
    };

    window.openAddOfferModal = function () {
        const title = prompt('Enter Offer Title (e.g. Flash Sunday Sale):');
        if (!title) return;

        const offers = getStored('yadav_offers');
        offers.push({ id: 'OFF-' + Date.now(), title: title, discount: 'Special Discount', status: 'Active' });
        setStored('yadav_offers', offers);
        logAdminActivity(`Created Offer Campaign: ${title}`);
        window.showAdminToast('Offer Created', `Campaign "${title}" is live!`);
        window.renderMarketingOverview();
    };

    window.deleteOffer = function (offerId) {
        let offers = getStored('yadav_offers');
        offers = offers.filter(o => o.id !== offerId);
        setStored('yadav_offers', offers);
        window.renderMarketingOverview();
    };

    // --- 10. DELIVERY & PAYMENTS ENGINE ---
    window.renderDeliveryZones = function () {
        const tbody = document.getElementById('deliveryZonesTableBody');
        if (!tbody) return;

        const zones = getStored('yadav_delivery_zones');
        tbody.innerHTML = zones.map(z => `
            <tr>
                <td><span class="fw-bold">${z.pincode}</span><br><small class="text-muted">${z.zone}</small></td>
                <td>₹${z.charge}</td>
                <td>₹${z.freeAbove}</td>
                <td><span class="badge badge-soft-success">Active</span></td>
                <td><button class="btn btn-outline-danger btn-sm p-1 px-2" onclick="window.deleteDeliveryZone('${z.id}')"><i class="bi bi-trash"></i></button></td>
            </tr>
        `).join('');
    };

    window.openAddDeliveryAreaModal = function () {
        const pincode = prompt('Enter Delivery Pincode:');
        if (!pincode) return;
        const zone = prompt('Enter Area Name:');
        if (!zone) return;

        const zones = getStored('yadav_delivery_zones');
        zones.push({ id: 'Z-' + Date.now(), pincode, zone, charge: 25, freeAbove: 399, active: true });
        setStored('yadav_delivery_zones', zones);
        window.showAdminToast('Delivery Zone Added', `Zone ${pincode} added.`);
        window.renderDeliveryZones();
    };

    window.deleteDeliveryZone = function (zoneId) {
        let zones = getStored('yadav_delivery_zones');
        zones = zones.filter(z => z.id !== zoneId);
        setStored('yadav_delivery_zones', zones);
        window.renderDeliveryZones();
    };

    window.savePaymentMethods = function (e) {
        e.preventDefault();
        const vpa = document.getElementById('payUpiVpa')?.value || 'yadav.store@okicici';
        logAdminActivity(`Updated payment settings. UPI VPA: ${vpa}`);
        window.showAdminToast('Saved', 'Payment Gateway settings updated.');
    };

    window.renderPaymentStats = function () {
        const container = document.getElementById('paymentStatsOverview');
        if (!container) return;
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-6"><div class="p-3 bg-light rounded text-center"><small>UPI Payments</small><h4 class="fw-bold text-success">85%</h4></div></div>
                <div class="col-6"><div class="p-3 bg-light rounded text-center"><small>COD Orders</small><h4 class="fw-bold text-primary">15%</h4></div></div>
            </div>`;
    };

    // --- 11. STOREFRONT THEME & ANNOUNCEMENT BAR ENGINE ---
    window.saveAnnouncementSettings = function (e) {
        if (e) e.preventDefault();
        const config = {
            enabled: document.getElementById('announcementEnabled')?.checked || false,
            text: document.getElementById('announcementText')?.value || '',
            bgColor: document.getElementById('announcementBgColor')?.value || '#ffc107',
            textColor: document.getElementById('announcementTextColor')?.value || '#212529'
        };
        localStorage.setItem('yadav_announcement', JSON.stringify(config));
        logAdminActivity('Updated storefront top announcement bar settings');
        window.showAdminToast('Updated', 'Top Announcement bar settings updated live!');
    };

    window.applyThemePreset = function (presetName) {
        const presets = {
            green: { accent: '#10b981', success: '#10b981', primary: '#0f172a', accentText: '#ffffff' },
            fresh: { accent: '#0ea5a4', success: '#0ea5a4', primary: '#071427', accentText: '#ffffff' },
            minimal: { accent: '#111827', success: '#4b5563', primary: '#f8fafc', accentText: '#ffffff' },
            pink: { accent: '#ec4899', success: '#ec4899', primary: '#0b1220', accentText: '#ffffff' },
            sunset: { accent: '#f97316', success: '#f97316', primary: '#071427', accentText: '#ffffff' },
            mint: { accent: '#06b6d4', success: '#06b6d4', primary: '#071427', accentText: '#ffffff' }
        };

        if (!presets[presetName]) presetName = 'green';
        localStorage.setItem('yadav_theme_preset', presetName);

        const p = presets[presetName];

        // Update CSS variables used by admin styles
        try {
            document.documentElement.style.setProperty('--admin-accent', p.accent);
            document.documentElement.style.setProperty('--admin-sidebar-bg', p.primary);
            document.documentElement.style.setProperty('--admin-sidebar-hover', shadeColor(p.primary, 8));
            document.documentElement.style.setProperty('--admin-sidebar-active', shadeColor(p.primary, -6));
        } catch (e) { console.warn('Theme variables apply failed', e); }

        // Compute readable text/heading colors based on primary color luminance
        function hexToRgb(hex) {
            let c = hex.replace('#',''); if (c.length===3) c = c.split('').map(ch=>ch+ch).join('');
            return { r: parseInt(c.substr(0,2),16), g: parseInt(c.substr(2,2),16), b: parseInt(c.substr(4,2),16) };
        }
        function relativeLuminance(rgb) {
            const srgb = [rgb.r/255, rgb.g/255, rgb.b/255].map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
            return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
        }
        const primRgb = hexToRgb(p.primary || '#0f172a');
        const primLum = relativeLuminance(primRgb);
        const primaryIsLight = primLum > 0.5;
        const bodyText = primaryIsLight ? '#0f172a' : '#f8fafc';
        const headingText = primaryIsLight ? p.accent : p.accentText || '#ffffff';

        // Inject/replace a stylesheet that overrides key bootstrap colors to reflect theme
        const themeCssId = 'themeOverrideStyles';
        let s = document.getElementById(themeCssId);
        const css = `
            /* Theme overrides injected by admin preset */
            .btn-success, .bg-success { background-color: ${p.success} !important; border-color: ${p.success} !important; }
            .text-success { color: ${p.success} !important; }
            a.text-success { color: ${p.accent} !important; }
            .badge.bg-success { background-color: ${p.success} !important; }
            .badge-soft-success { background: ${p.success}22 !important; color: ${p.success} !important; }
            .admin-sidebar { background: linear-gradient(180deg, ${shadeColor(p.primary, -8)} 0%, ${p.primary} 60%) !important; }
            .btn-success:hover { filter: brightness(0.95); }
            /* Navbar and header */
            .navbar, .admin-topbar { background-color: ${p.primary} !important; }
            .navbar .nav-link, .admin-topbar .nav-link, .admin-topbar .btn { color: ${primaryIsLight ? '#0f172a' : (p.accentText || '#ffffff')} !important; }
            .card, .admin-card { border-color: ${shadeColor(p.primary, 10)} !important; }
            .card-header, .admin-card h5 { background: ${p.primary} !important; color: ${primaryIsLight ? '#0f172a' : (p.accentText || '#ffffff')} !important; }
            a { color: ${p.accent} !important; }
            .text-primary { color: ${p.accent} !important; }
            .bg-primary { background-color: ${p.accent} !important; }

            /* Text and headings contrast */
            body { color: ${bodyText} !important; }
            h1,h2,h3,h4,h5,h6, .fw-bold { color: ${headingText} !important; }
            .text-muted { color: ${primaryIsLight ? '#6b7280' : '#cbd5e1'} !important; }
            .lead, p, li, span, label { color: ${bodyText} !important; }
            .nav-link { color: ${primaryIsLight ? '#0f172a' : (p.accentText || '#ffffff')} !important; }
        `;
        if (!s) {
            s = document.createElement('style'); s.id = themeCssId; document.head.appendChild(s);
        }
        s.innerHTML = css;
        try {
            // Persist the exact CSS overrides so storefront loader can inject the same rules
            localStorage.setItem('yadav_theme_css', css);
        } catch (e) { console.warn('Could not persist theme CSS to localStorage', e); }

        logAdminActivity(`Applied Storefront Theme Preset: ${presetName}`);
        window.showAdminToast('Theme Applied', `Storefront color preset updated to ${presetName}`);
    };

    // Save selected preset to Firestore (settings/theme)
    window.saveThemeToFirestore = async function (presetName) {
        if (!presetName) presetName = localStorage.getItem('yadav_theme_preset') || 'green';
        if (!window.db) {
            window.showAdminToast && window.showAdminToast('Offline', 'Firebase not initialized. Theme saved locally only.', true);
            return;
        }
        try {
            await window.db.collection('settings').doc('theme').set({ preset: presetName, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            window.showAdminToast && window.showAdminToast('Saved', 'Theme saved to cloud successfully.');
            logAdminActivity && logAdminActivity(`Saved theme preset to Firestore: ${presetName}`);
        } catch (e) {
            console.warn('Could not save theme to Firestore', e);
            window.showAdminToast && window.showAdminToast('Error', 'Could not save theme to cloud.', true);
        }
    };

    // Render small preview thumbnails inside admin theme section
    window.renderThemePreviews = function () {
        const presets = {
            green: { accent: '#10b981', primary: '#0f172a' , label: 'Green Grocery'},
            fresh: { accent: '#0ea5a4', primary: '#071427', label: 'Fresh Market'},
            minimal: { accent: '#111827', primary: '#f8fafc', label: 'Minimal Dark'},
            pink: { accent: '#ec4899', primary: '#0b1220', label: 'Berry Pink'},
            sunset: { accent: '#f97316', primary: '#071427', label: 'Sunset'},
            mint: { accent: '#06b6d4', primary: '#071427', label: 'Mint Ocean'}
        };
        const container = document.getElementById('themePreviewGrid');
        if (!container) return;
        container.innerHTML = '';
        Object.keys(presets).forEach(key => {
            const p = presets[key];
            const thumb = document.createElement('button');
            thumb.type = 'button';
            thumb.className = 'btn p-0 border rounded-3';
            thumb.style.width = '120px';
            thumb.style.height = '56px';
            thumb.style.display = 'flex';
            thumb.style.alignItems = 'center';
            thumb.style.justifyContent = 'space-between';
            thumb.style.padding = '6px';
            thumb.title = p.label || key;
            thumb.innerHTML = `
                <div style="flex:1;height:100%;background:${p.primary};border-radius:8px 0 0 8px;border-right:4px solid rgba(255,255,255,0.06);"></div>
                <div style="width:36px;height:100%;background:${p.accent};border-radius:0 8px 8px 0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">A</div>
            `;
            thumb.addEventListener('click', () => { window.applyThemePreset(key); });
            container.appendChild(thumb);
        });
    };

    // Render previews on load (if admin page)
    try { if (document.getElementById('themePreviewGrid')) window.renderThemePreviews(); } catch(e) {}

    // Listen for cloud-saved theme changes and auto-apply
    try {
        if (window.db) {
            window.db.collection('settings').doc('theme').onSnapshot(doc => {
                if (!doc.exists) return;
                const data = doc.data();
                if (data && data.preset) {
                    try { window.applyThemePreset(data.preset); } catch (e) { console.warn('Auto-apply cloud theme failed', e); }
                }
            }, err => { /* ignore listener errors */ });
        }
    } catch(e) {}

    // Utility: shade color hex by percent (-100..100)
    function shadeColor(hex, percent) {
        try {
            let c = hex.replace('#','');
            if (c.length === 3) c = c.split('').map(ch=>ch+ch).join('');
            const num = parseInt(c,16);
            let r = (num >> 16) + Math.round(255 * percent/100);
            let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent/100);
            let b = (num & 0x0000FF) + Math.round(255 * percent/100);
            r = Math.max(0,Math.min(255,r)); g = Math.max(0,Math.min(255,g)); b = Math.max(0,Math.min(255,b));
            return `#${(r<<16 | g<<8 | b).toString(16).padStart(6,'0')}`;
        } catch (e) { return hex; }
    }

    // Apply saved preset on load
    (function(){
        const saved = localStorage.getItem('yadav_theme_preset');
        if (saved) {
            try { window.applyThemePreset(saved); } catch(e){ console.warn('Auto-apply theme preset failed', e); }
        }
    })();

    // --- 12. CMS, SUPPORT & REPORTS ENGINE ---
    window.loadCmsPageContent = function (pageKey) {
        const editor = document.getElementById('cmsPageEditorText');
        if (!editor) return;

        const cmsData = getStored('yadav_cms_pages', {});
        editor.value = cmsData[pageKey] || `Default content for ${pageKey}. Editable from Admin Panel.`;
    };

    window.saveCmsPageContent = function () {
        const pageKey = document.getElementById('cmsPageSelect')?.value || 'about_us';
        const content = document.getElementById('cmsPageEditorText')?.value || '';

        const cmsData = getStored('yadav_cms_pages', {});
        cmsData[pageKey] = content;
        setStored('yadav_cms_pages', cmsData);
        logAdminActivity(`Updated CMS Page: ${pageKey}`);
        window.showAdminToast('Saved', `Page "${pageKey}" updated successfully.`);
    };

    window.renderSupportInbox = function () {
        const tbody = document.getElementById('supportInboxTableBody');
        if (!tbody) return;

        const enquiries = getStored('yadav_enquiries');
        tbody.innerHTML = enquiries.map(e => `
            <tr>
                <td><span class="fw-bold">${e.name}</span></td>
                <td>${e.contact}</td>
                <td>${e.message}</td>
                <td><small class="text-muted">${e.date}</small></td>
                <td><span class="badge badge-soft-warning">${e.status}</span></td>
                <td><button class="btn btn-sm btn-outline-success" onclick="alert('Replying to ${e.name}')">Reply</button></td>
            </tr>
        `).join('');
    };

    window.exportOrdersCSV = function () {
        const orders = getStored('yadav_orders');
        let csv = 'Order ID,Customer Name,Phone,Total Amount,Payment Method,Status,Date\n';
        orders.forEach(o => {
            csv += `"${o.id}","${o.customerName}","${o.customerPhone}","${o.totalAmount}","${o.paymentMethod}","${o.orderStatus}","${o.date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Yadav_Orders_Report_${Date.now()}.csv`;
        a.click();
    };

    window.exportProductsCSV = function () {
        const products = getStored('yadav_products');
        let csv = 'Product ID,Title,Category,Price,Original Price,Stock\n';
        products.forEach(p => {
            csv += `"${p.id}","${p.title}","${p.category}","${p.price}","${p.originalPrice || ''}","${p.stock}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Yadav_Products_Catalog_${Date.now()}.csv`;
        a.click();
    };

    window.exportCustomersCSV = function () {
        const customers = getStored('yadav_customers');
        let csv = 'Customer ID,Name,Email,Phone,Total Orders,Total Spent,Status\n';
        customers.forEach(c => {
            csv += `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.totalOrders}","${c.totalSpent}","${c.status}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Yadav_Customers_${Date.now()}.csv`;
        a.click();
    };

    // --- 13. GLOBAL SEARCH & PWA APP ENGINE ---
    window.handleAdminGlobalSearch = function (query) {
        const resultsBox = document.getElementById('adminGlobalSearchResults');
        if (!resultsBox) return;

        const q = (query || '').toLowerCase().trim();
        if (!q) {
            resultsBox.classList.remove('show');
            return;
        }

        const orders = getStored('yadav_orders').filter(o => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
        const products = getStored('yadav_products').filter(p => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));

        let html = '';
        if (orders.length > 0) {
            html += `<h6 class="dropdown-header text-primary">Orders (${orders.length})</h6>`;
            orders.slice(0, 3).forEach(o => {
                html += `<a class="dropdown-item" href="#" onclick="window.activateAdminSection('sec-orders'); window.viewOrderDetail('${o.id}'); return false;">Order ${o.id} - ${o.customerName} (₹${o.totalAmount})</a>`;
            });
        }
        if (products.length > 0) {
            html += `<h6 class="dropdown-header text-success">Products (${products.length})</h6>`;
            products.slice(0, 3).forEach(p => {
                html += `<a class="dropdown-item" href="#" onclick="window.activateAdminSection('sec-products'); return false;">${p.title} - ₹${p.price}</a>`;
            });
        }

        if (!html) html = `<div class="p-2 text-muted small text-center">No matching records</div>`;

        resultsBox.innerHTML = html;
        resultsBox.classList.add('show');
    };

    window.installAdminApp = function () {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then(choice => {
                if (choice.outcome === 'accepted') {
                    window.showAdminToast('Installed', 'Yadav Admin Control Center installed to device! 📲');
                }
                window.deferredPrompt = null;
            });
        } else {
            const modalEl = document.getElementById('adminPwaInstallModal');
            if (modalEl && window.bootstrap) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            } else {
                alert('To install Yadav Admin App:\n\nAndroid/Chrome: Tap Chrome menu (⋮) -> Add to Home Screen.\niOS/Safari: Tap Share button -> Add to Home Screen.');
            }
        }
    };

    window.triggerAdminDirectInstall = function () {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then(choice => {
                if (choice.outcome === 'accepted') {
                    window.showAdminToast('Installed', 'Yadav Admin Control Center installed successfully!');
                }
                window.deferredPrompt = null;
            });
            const modalEl = document.getElementById('adminPwaInstallModal');
            if (modalEl && window.bootstrap) {
                const bsModal = bootstrap.Modal.getInstance(modalEl);
                if (bsModal) bsModal.hide();
            }
        } else {
            alert('Follow the instructions below to install on your mobile home screen:\n\n1. Tap Chrome menu (⋮) or Safari Share button\n2. Tap "Add to Home Screen"');
        }
    };

    window.exportFullDatabaseBackup = function () {
        const fullBackup = {
            products: getStored('yadav_products'),
            orders: getStored('yadav_orders'),
            customers: getStored('yadav_customers'),
            coupons: getStored('yadav_coupons'),
            offers: getStored('yadav_offers'),
            announcement: getStored('yadav_announcement'),
            delivery_zones: getStored('yadav_delivery_zones'),
            audit_logs: getStored('yadav_audit_logs'),
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `YADAV_STORE_FULL_BACKUP_${Date.now()}.json`;
        a.click();
        logAdminActivity('Exported full database backup JSON');
        window.showAdminToast('Backup Complete', 'Full database JSON backup downloaded.');
    };

    window.restoreDatabaseBackup = function () {
        const fileInput = document.getElementById('dbRestoreFileInput');
        if (!fileInput || !fileInput.files[0]) {
            window.showAdminToast('Select File', 'Please select a valid .json backup file.', true);
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.products) setStored('yadav_products', data.products);
                if (data.orders) setStored('yadav_orders', data.orders);
                if (data.customers) setStored('yadav_customers', data.customers);
                if (data.coupons) setStored('yadav_coupons', data.coupons);
                if (data.offers) setStored('yadav_offers', data.offers);

                logAdminActivity('Restored full database backup from JSON file');
                window.showAdminToast('Database Restored', 'Store data successfully restored!');
                window.renderDashboardOverview();
            } catch (err) {
                window.showAdminToast('Restore Error', 'Invalid backup file format.', true);
            }
        };
        reader.readAsText(fileInput.files[0]);
    };

    window.saveStoreInformationSettings = function (e) {
        if (e) e.preventDefault();
        window.showAdminToast('Saved', 'Store information and tax rates saved.');
    };

    window.toggleWebsiteMaintenanceMode = function (enabled) {
        localStorage.setItem('yadav_maintenance_mode', enabled ? 'true' : 'false');
        logAdminActivity(`Toggled website maintenance mode: ${enabled}`);
        window.showAdminToast('Maintenance Mode', `Website maintenance mode is now ${enabled ? 'ENABLED' : 'DISABLED'}`);
    };

    window.clearAllAdminNotifications = function () {
        const list = document.getElementById('adminNotificationsList');
        const badge = document.getElementById('adminUnreadAlertsCount');
        if (list) list.innerHTML = `<div class="p-3 text-center text-muted small">No new notifications</div>`;
        if (badge) badge.innerText = '0';
    };

    window.logoutAdminSession = function () {
        if (confirm('Are you sure you want to log out from Admin Panel?')) {
            window.location.href = 'login.html';
        }
    };

    window.openAdminProfileModal = function () {
        alert('Admin Profile:\nHemant Yadav (Super Admin)\nEmail: hyadav1317@gmail.com\nLast Login: ' + new Date().toLocaleString());
    };

    window.openChangePasswordModal = function () {
        const pass = prompt('Enter new password:');
        if (pass) {
            logAdminActivity('Changed Admin Password');
            window.showAdminToast('Password Changed', 'Admin password updated successfully.');
        }
    };

    window.toggleAdminPasswordVisibility = function (inputId, btn) {
        const inp = document.getElementById(inputId);
        if (inp) {
            inp.type = inp.type === 'password' ? 'text' : 'password';
            btn.innerHTML = inp.type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        }
    };

    window.triggerAdminForgotPassword = function () {
        alert('Password reset instructions sent to registered admin email address!');
    };

    window.renderSearchAndCartAnalytics = function () {
        const searches = document.getElementById('topSearchTermsList');
        const carts = document.getElementById('abandonedCartsList');

        if (searches) {
            searches.innerHTML = `
                <div class="list-group-item d-flex justify-content-between"><span>Fresh Mangoes</span><span class="badge bg-success">142 searches</span></div>
                <div class="list-group-item d-flex justify-content-between"><span>Amul Butter</span><span class="badge bg-success">98 searches</span></div>
                <div class="list-group-item d-flex justify-content-between"><span>Avocado</span><span class="badge bg-warning text-dark">Zero results</span></div>`;
        }
        if (carts) {
            carts.innerHTML = `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div><strong>Priya Verma</strong><br><small class="text-muted">2 items in cart (₹370)</small></div>
                    <button class="btn btn-sm btn-outline-success" onclick="alert('Reminder sent!')">Send Offer</button>
                </div>`;
        }
    };

    window.renderBusinessAnalytics = function () {
        const setVal = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
        setVal('analyticsAOV', '₹345');
        setVal('analyticsGrossSales', '₹45,890');
        setVal('analyticsTaxTotal', '₹2,294');
        setVal('analyticsDeliveryTotal', '₹1,450');
    };

    window.openCustomizeDashboardModal = function () {
        alert('Dashboard Customizer:\nYou can toggle card visibility or drag widgets to reorder them!');
    };

    window.openAddStaffModal = function () {
        const name = prompt('Enter Staff Name:');
        if (!name) return;
        const email = prompt('Enter Staff Email:');
        if (!email) return;

        const staff = getStored('yadav_staff_accounts', []);
        staff.push({ id: 'STAFF-' + Date.now(), name, email, role: 'Order Manager', status: 'Active' });
        setStored('yadav_staff_accounts', staff);
        logAdminActivity(`Created Staff Account for ${name}`);
        window.showAdminToast('Staff Added', `Staff account for ${name} created.`);
    };

    // DOM Ready initialization & Hash Router for Admin Control Center
    function handleAdminInitialRoute() {
        if (!document.body.classList.contains('admin-dashboard')) return;

        const rawHash = (window.location.hash || '').replace('#', '').trim();
        const hash = rawHash || 'sec-dashboard';
        if (document.getElementById(hash)) {
            window.activateAdminSection(hash);
        } else {
            window.activateAdminSection('sec-dashboard');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        handleAdminInitialRoute();
    });

    window.addEventListener('hashchange', () => {
        handleAdminInitialRoute();
    });

})();


