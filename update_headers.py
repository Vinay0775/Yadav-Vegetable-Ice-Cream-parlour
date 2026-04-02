import os
import glob

# The new unified, responsive header block
NEW_HEADER = """
    <!-- Topbar -->
    <div class="topbar py-2 d-none d-lg-block">
        <div class="container d-flex justify-content-between align-items-center">
            <div class="topbar-left small text-muted">
                <span><i class="bi bi-geo-alt-fill text-success"></i> 123 Farm Road, Green City, IN</span>
                <span class="ms-3"><i class="bi bi-clock-fill text-success"></i> Mon-Fri: 8:00AM - 9:00PM</span>
            </div>
            <div class="topbar-right small">
                <span><i class="bi bi-envelope-fill text-success"></i> support@yadavstore.com</span>
                <span class="ms-3 fw-bold text-dark">Free Delivery on orders over ₹500! 🚚</span>
            </div>
        </div>
    </div>

    <!-- Desktop Header & Navigation Wrapper -->
    <div class="sticky-top w-100 shadow-sm" style="z-index: 1050;">
    <!-- Main Header (Logo, Search, Icons) -->
    <header class="main-header py-2 py-lg-3 bg-white border-bottom">
        <div class="container d-flex flex-wrap justify-content-between align-items-center gap-3">
            
            <!-- Mobile/Desktop: Left (Logo) -->
            <a class="navbar-brand fw-bold fs-3 logo-text m-0 p-0" style="white-space:nowrap;" href="index.html">
                Yadav <span class="text-success">Vegetable</span> <span class="text-pink fs-6 d-none d-sm-inline">& Ice-Cream</span>
            </a>

            <!-- Desktop Search Bar (Center) -->
            <div class="input-group search-bar d-none d-lg-flex mx-auto" style="max-width: 500px; flex: 1 1 auto; min-width: 250px;">
                <select id="globalSearchCategory" class="form-select border-success shadow-none bg-light text-muted" style="max-width: 140px;">
                    <option value="All">All Categories</option>
                    <option value="Vegetables">Veggies</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Ice-Creams">Ice-Creams</option>
                </select>
                <input type="text" id="globalSearchInput" class="form-control border-success shadow-none" placeholder="Search products...">
                <button id="globalSearchBtn" class="btn btn-success px-4 bg-success border-success" type="button"><i class="bi bi-search"></i></button>
            </div>

            <!-- Desktop Icons (Right) -->
            <div class="header-icons d-none d-lg-flex align-items-center gap-3 ms-auto">
                <a href="#" class="text-dark text-decoration-none fs-5 icon-link theme-toggle-btn me-2" title="Toggle Dark/Light Mode"><i class="bi bi-moon"></i></a>
                <a href="login.html" class="text-dark text-decoration-none fs-5 icon-link position-relative" title="Login/Profile"><i class="bi bi-person"></i></a>
                <a href="orders.html" class="text-dark text-decoration-none fs-5 icon-link position-relative" title="My Orders"><i class="bi bi-box-seam"></i></a>
                <a href="#" class="text-dark text-decoration-none fs-5 icon-link position-relative" title="Favorites">
                    <i class="bi bi-heart"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success badge-count">0</span>
                </a>
                <a href="cart.html" class="text-dark text-decoration-none fs-5 icon-link position-relative d-flex align-items-center" title="Cart">
                    <i class="bi bi-cart3"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-pink badge-count cart-total-badge" id="cartCount">0</span>
                </a>
            </div>

            <!-- Mobile: Right (Cart & Hamburger) -->
            <div class="d-flex d-lg-none align-items-center gap-3 ms-auto">
                <a href="#" class="text-dark text-decoration-none fs-5 icon-link theme-toggle-btn" title="Toggle Dark/Light Mode"><i class="bi bi-moon"></i></a>
                <a href="cart.html" class="text-dark text-decoration-none fs-5 position-relative icon-link" title="Cart">
                    <i class="bi bi-cart3"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-pink badge-count cart-total-badge">0</span>
                </a>
                <button class="navbar-toggler border-0 shadow-none p-0 ms-1" type="button" data-bs-toggle="offcanvas" data-bs-target="#mainNav">
                    <i class="bi bi-list fs-1 text-dark"></i>
                </button>
            </div>

            <!-- Mobile Search Bar (Full width below) -->
            <div class="w-100 d-lg-none mt-2">
                <div class="input-group search-bar mx-auto w-100">
                    <input type="text" id="globalSearchInputMobile" class="form-control border-success shadow-none bg-light text-dark" placeholder="Search products...">
                    <button id="globalSearchBtnMobile" class="btn btn-success px-3 bg-success border-success" type="button"><i class="bi bi-search"></i></button>
                </div>
            </div>
        </div>
    </header>

    <!-- Navigation Menu (Desktop separate row & Mobile Offcanvas) -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white py-0 p-lg-0" id="mainNavbar">
        <div class="container">
            <div class="offcanvas-lg offcanvas-end bg-white w-100" tabindex="-1" id="mainNav" style="--bs-offcanvas-width: 280px;">
                <div class="offcanvas-header border-bottom d-lg-none py-3">
                    <h5 class="offcanvas-title fw-bold logo-text text-dark fs-4" style="font-size:1.5rem;">Yadav <span class="text-success">Menu</span></h5>
                    <button type="button" class="btn-close shadow-none" data-bs-dismiss="offcanvas"></button>
                </div>
                <div class="offcanvas-body d-flex align-items-lg-center">
                    <!-- Navigation Links -->
                    <ul class="navbar-nav flex-lg-row justify-content-lg-center align-items-lg-center mx-lg-auto w-100 gap-2 gap-lg-4 fw-medium text-uppercase small py-3 py-lg-0">
                        <li class="nav-item"><a class="nav-link active text-success px-lg-0 py-lg-3" href="index.html">Home</a></li>
                        <li class="nav-item"><a class="nav-link px-lg-0 py-lg-3" href="fresh-veggies.html">Veggies</a></li>
                        <li class="nav-item"><a class="nav-link text-warning px-lg-0 py-lg-3" href="fresh-fruits.html">Fruits</a></li>
                        <li class="nav-item"><a class="nav-link text-pink px-lg-0 py-lg-3" href="ice-cream-parlour.html">Ice-Cream</a></li>
                        <li class="nav-item"><a class="nav-link px-lg-0 py-lg-3" href="about-us.html">About</a></li>
                        <li class="nav-item"><a class="nav-link px-lg-0 py-lg-3" href="contact.html">Contact</a></li>
                        
                        <!-- Mobile Only extra links -->
                        <li class="nav-item d-lg-none border-top pt-3 mt-2"><a class="nav-link text-dark" href="orders.html"><i class="bi bi-box-seam me-2 text-success"></i>My Orders</a></li>
                        <li class="nav-item d-lg-none"><a class="nav-link text-dark" href="login.html"><i class="bi bi-person me-2 text-success"></i>Profile Login</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
    </div>
"""

# Footer unified script imports
NEW_FOOTER_SCRIPTS = """
    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="catalog.js"></script>
    <script src="script.js"></script>
</body>
</html>
"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the header region
    import re
    
    # We replace from <!-- Topbar --> to <!-- Hero Section --> or <!-- Page Header --> or <!-- Content --> or <!-- Simple Header...
    # We use regex to find the block.
    header_pattern = re.compile(r'<!-- Topbar -->.*?</nav>', re.DOTALL)
    if not header_pattern.search(content):
        # Some pages like payment might only have <!-- Simple Header for Checkout Process -->
        header_pattern = re.compile(r'<!-- Simple Header.*?</header>', re.DOTALL)
        if not header_pattern.search(content):
            # login.html might have no proper header, skip it.
            if "login.html" in filepath:
                pass
            else:
                header_pattern = re.compile(r'<!-- Main Header -->.*?</nav>', re.DOTALL)

    if header_pattern.search(content):
        content = header_pattern.sub(NEW_HEADER.strip(), content)
        
    # Replace footer scripts
    script_pattern = re.compile(r'<!-- Bootstrap Bundle JS -->.*', re.DOTALL)
    if script_pattern.search(content):
        content = script_pattern.sub(NEW_FOOTER_SCRIPTS.strip(), content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

os.chdir(r"c:\Users\hemny\OneDrive\Desktop\yadav vegetable store")
html_files = glob.glob("*.html")
for f in html_files:
    if f not in ["login.html"]:
        update_file(f)

print("Updated HTML files.")
