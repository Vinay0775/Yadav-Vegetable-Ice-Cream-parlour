// Ensure catalog is loaded
const CATALOG = (typeof YADAV_CATALOG !== 'undefined') ? YADAV_CATALOG : [];

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

document.addEventListener('DOMContentLoaded', () => {

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
        }
    });

    window.logoutGlobal = function() {
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

    window.addToCartGlobal = function(productStr) {
        try {
            const product = JSON.parse(decodeURIComponent(productStr));
            const existing = cart.find(item => item.id === product.id || item.title === product.title);
            if (existing) existing.quantity += (product.quantity || 1);
            else cart.push({...product, quantity: product.quantity || 1});
            
            saveCart();
            updateCartBadges();
            if (typeof renderCartPage === 'function') renderCartPage();
        } catch(e) { console.error("Error adding to cart", e); }
    }

    updateCartBadges();

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
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') performSearch(); });


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

        window.renderDynamicGrid = function(page = 1, searchQuery = null, searchCat = 'All') {
            currentPage = page;
            gridEl.innerHTML = '';
            
            let filteredList = CATALOG.filter(p => pageMainCategory === 'All' || p.category === pageMainCategory);

            if (searchQuery) {
                filteredList = CATALOG.filter(p => {
                    const matchQ = p.title.toLowerCase().includes(searchQuery) || p.category.toLowerCase().includes(searchQuery);
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

            if (currentSort === 'price-asc') filteredList.sort((a,b) => a.price - b.price);
            else if (currentSort === 'price-desc') filteredList.sort((a,b) => b.price - a.price);
            else if (currentSort === 'rating') filteredList.sort((a,b) => b.rating - a.rating);

            const totalItems = filteredList.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
            
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
            const pageItems = filteredList.slice(startIndex, endIndex);

            if (resultsCount) resultsCount.innerText = `Showing ${startIndex + (totalItems>0?1:0)}–${endIndex} of ${totalItems} results`;

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
                    for(let i=1; i<=5; i++) {
                        if(i <= Math.floor(prod.rating)) starsHtml += '<i class="bi bi-star-fill"></i>';
                        else if(i - 0.5 === prod.rating) starsHtml += '<i class="bi bi-star-half"></i>';
                        else starsHtml += '<i class="bi bi-star"></i>';
                    }
                    const prodJson = encodeURIComponent(JSON.stringify(prod));

                    gridEl.innerHTML += `
                    <div class="col-sm-6 col-md-4 col-xl-3">
                        <div class="card product-card border-0 ${bgClass} h-100 shadow-sm rounded-4">
                            ${badgeHtml}
                            <div class="px-4 py-4 text-center position-relative overflow-hidden product-image-wrapper">
                                <img src="${prod.image}" alt="${prod.title}" class="img-fluid object-fit-cover rounded-circle shadow-sm" style="width:140px; height:140px;">
                                <div class="product-action-overlay">
                                    <button class="btn btn-light rounded-circle shadow-sm mx-1 hover-lift"><i class="bi bi-heart"></i></button>
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
                let pHTML = `<li class="page-item ${currentPage <= 1 ? 'disabled' : ''}"><a class="page-link border-0 text-muted mx-1" href="#" data-page="${currentPage-1}">Prev</a></li>`;
                for(let i=1; i<=totalPages; i++) {
                    pHTML += `<li class="page-item ${i===currentPage?'active':''}"><a class="page-link border-0 ${i===currentPage?'bg-success text-white':'text-dark hover-lift'} rounded-circle mx-1" href="#" data-page="${i}">${i}</a></li>`;
                }
                pHTML += `<li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}"><a class="page-link border-0 text-success mx-1" href="#" data-page="${currentPage+1}">Next</a></li>`;
                paginationNav.innerHTML = pHTML;

                paginationNav.querySelectorAll('.page-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const p = parseInt(link.dataset.page);
                        if(p && p >= 1 && p <= totalPages) {
                            renderDynamicGrid(p);
                            window.scrollTo({top: 300, behavior: 'smooth'});
                        }
                    });
                });
            }

            gridEl.querySelectorAll('.dynamic-add-cart').forEach(btn => {
                btn.addEventListener('click', function(e) {
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
                btn.addEventListener('click', function(e) {
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
        window.openModalFromData = function(prodJsonStr) {
            try {
                const data = JSON.parse(decodeURIComponent(prodJsonStr));
                document.getElementById('modalProductImage').src = data.image;
                document.getElementById('modalProductTitle').innerText = data.title;
                document.getElementById('modalProductDesc').innerText = data.desc || `Fresh and high quality direct from Yadav Store.`;
                document.getElementById('modalProductPrice').innerText = `₹${data.price}`;
                document.getElementById('modalProductQty').value = 1;
                
                const btn = document.getElementById('modalAddToCartBtn');
                btn.className = `btn btn-${data.category === 'Ice-Creams' ? 'pink' : 'success'} px-5 rounded-pill fw-bold hover-lift`;
                
                btn.onclick = () => {
                    window.addToCartGlobal(encodeURIComponent(JSON.stringify({...data, quantity: parseInt(document.getElementById('modalProductQty').value)||1})));
                    closeModal();
                    alert(`Added to cart!`);
                };
                
                modal.classList.remove('d-none');
                setTimeout(() => { modal.classList.add('show'); document.body.classList.add('modal-open'); }, 10);
            } catch(e) {}
        }
        function closeModal() {
            modal.classList.remove('show'); document.body.classList.remove('modal-open');
            setTimeout(() => { modal.classList.add('d-none'); }, 300);
        }
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    }

    // ==========================================
    // 7. CART PAGE & PAYMENT (FIREBASE SAVING)
    // ==========================================
    const cartContainer = document.getElementById('cartContainer');
    if (cartContainer) {
        window.renderCartPage = function() {
            if (cart.length === 0) {
                cartContainer.innerHTML = '<div class="p-5 text-center text-muted"><i class="bi bi-cart-x display-1 d-block mb-3 opacity-50"></i><h4>Your cart is empty.</h4><a href="index.html" class="btn btn-success mt-3 rounded-pill px-4">Shop Now</a></div>';
                if(document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = '₹0';
                if(document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = '₹0';
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
            
            if(document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = `₹${subtotal}`;
            const tax = subtotal * 0.05;
            if(document.getElementById('cartTax')) document.getElementById('cartTax').innerText = `₹${tax.toFixed(2)}`;
            if(document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = `₹${Math.ceil(subtotal + tax)}`;

            cartContainer.querySelectorAll('.change-qty').forEach(btn => btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                const chg = parseInt(this.dataset.change);
                if (cart[idx].quantity + chg <= 0) cart.splice(idx,1);
                else cart[idx].quantity += chg;
                saveCart(); updateCartBadges(); renderCartPage();
            }));
            cartContainer.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', function() {
                cart.splice(parseInt(this.dataset.index), 1);
                saveCart(); updateCartBadges(); renderCartPage();
            }));
        };
        renderCartPage();
    }

    const payBtn = document.getElementById('payNowBtn');
    if (payBtn) {
        let subtotal = cart.reduce((s, item) => s + (item.price * item.quantity), 0);
        const total = Math.ceil(subtotal + (subtotal*0.05));
        
        let html = '';
        cart.forEach(item => {
            html += `<div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <div class="d-flex align-items-center"><img src="${item.image}" class="img-fluid rounded object-fit-cover shadow-sm me-3" style="width:50px; height:50px;">
                    <div><h6 class="fw-bold mb-0">${item.title}</h6><span class="text-muted small">Qty: ${item.quantity}</span></div></div>
                <span class="fw-bold">₹${item.price * item.quantity}</span></div>`;
        });
        if(document.getElementById('paymentCartItems')) document.getElementById('paymentCartItems').innerHTML = html;
        if(document.getElementById('paymentSubtotal')) document.getElementById('paymentSubtotal').innerText = `₹${subtotal}`;
        if(document.getElementById('paymentTotal')) document.getElementById('paymentTotal').innerText = `₹${total}`;
        payBtn.innerText = `Pay Now ₹${total}`;

        payBtn.addEventListener('click', async () => {
            if(cart.length === 0) return alert('Cart is empty!');
            if(!currentUser) {
                alert("Please log in first to place a secured order.");
                window.location.href = "login.html";
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

                alert(`Payment Success! Your order has been placed.\nTracking ID: ${orderId}`);
                cart = [];
                saveCart();
                window.location.href = 'orders.html';
            } catch(e) {
                console.error("Order save sync error:", e);
                alert("Error placing order! Check your internet connection or DB Rules.");
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
            if(user) {
                customerOrdersGrid.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Loading your orders securely...</p></div>';
                try {
                    const querySnapshot = await window.db.collection("orders")
                        .where("uid", "==", user.uid)
                        .orderBy("createdAt", "desc")
                        .get();
                    
                    let listHtml = '';
                    querySnapshot.forEach((docSnap) => {
                        const o = docSnap.data();
                        let itemsHtml = o.items.map(i => `<div class="d-flex align-items-center me-3 mb-2"><img src="${i.image}" class="rounded-circle object-fit-cover shadow-sm border me-2" style="width:40px;height:40px;"><span class="small fw-medium">${i.quantity}x ${i.title}</span></div>`).join('');
                        listHtml += `
                        <div class="card border-0 shadow-sm rounded-4 mb-4">
                            <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                                <div><span class="d-block text-muted small mb-1">Order Placed</span><h6 class="fw-bold mb-0">${new Date(o.date).toLocaleDateString()}</h6></div>
                                <div class="text-end"><span class="d-block text-muted small mb-1">Total Amount</span><h6 class="fw-bold text-success mb-0">₹${o.totalAmount}</h6></div>
                                <div class="text-end d-none d-md-block"><span class="d-block text-muted small mb-1">Track ID</span><h6 class="fw-bold text-primary font-monospace mb-0">${o.id}</h6></div>
                            </div>
                            <div class="card-body p-4">
                                <div class="d-flex flex-wrap mb-3 border-bottom pb-3">${itemsHtml}</div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-warning text-dark rounded-pill px-3 py-2 fw-medium"><i class="bi bi-clock-history me-1"></i> ${o.status}</span>
                                    <button class="btn btn-outline-success btn-sm rounded-pill px-3"><i class="bi bi-geo-alt me-1"></i> Track Location</button>
                                </div>
                            </div>
                        </div>`;
                    });
                    customerOrdersGrid.innerHTML = listHtml || '<div class="text-center py-5 text-muted"><i class="bi bi-bag-x display-1 d-block mb-3"></i><h4>No order history found</h4><a href="index.html" class="btn btn-success mt-3 rounded-pill">Start Shopping</a></div>';
                } catch(e) {
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
            } catch(e) {
                console.error(e);
                document.getElementById('adminTableBody').innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Firebase Error: ${e.message}. Are your DB rules public/test mode?</td></tr>`;
            }
        }
        loadAdminData();
    }

    // Sticky Floats
    const floatHtml = `<a href="https://wa.me/919876543210" target="_blank" class="sticky-icon whatsapp-icon" title="Chat on WhatsApp"><i class="bi bi-whatsapp"></i></a><button id="scrollToTopBtn" class="sticky-icon scroll-top-icon" title="Go to top"><i class="bi bi-arrow-up"></i></button>`;
    const floatDiv = document.createElement('div'); floatDiv.innerHTML = floatHtml; document.body.appendChild(floatDiv);
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    window.addEventListener('scroll', () => { if(window.scrollY > 300) scrollToTopBtn.classList.add('show'); else scrollToTopBtn.classList.remove('show'); });
    scrollToTopBtn.addEventListener('click', () => { window.scrollTo({top: 0, behavior: 'smooth'}); });
});