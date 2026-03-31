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

    <!-- Main Header -->
    <header class="main-header py-3 bg-white border-bottom align-items-center">
        <div class="container d-flex flex-wrap justify-content-between align-items-center gap-3">
            <!-- Logo (Left on mobile and desktop) -->
            <a class="text-decoration-none fw-bold fs-3 logo-text order-1" style="white-space:nowrap;" href="index.html">
                Yadav <span class="text-success">Store</span> <span class="text-pink fs-6 d-none d-sm-inline">& Ice-Cream</span>
            </a>

            <!-- Search Bar (Full width on mobile, middle on desktop) -->
            <div class="input-group search-bar order-3 order-md-2 mx-auto w-100 w-md-auto mt-3 mt-md-0" style="max-width: 500px; flex: 1 1 auto; min-width:250px;">
                <select id="globalSearchCategory" class="form-select border-success shadow-none bg-light text-muted d-none d-sm-block" style="max-width: 130px;">
                    <option value="All">All Categories</option>
                    <option value="Vegetables">Veggies</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Ice-Creams">Ice-Creams</option>
                </select>
                <input type="text" id="globalSearchInput" class="form-control border-success shadow-none" placeholder="Search products...">
                <button id="globalSearchBtn" class="btn btn-success px-3 bg-success border-success" type="button"><i class="bi bi-search"></i></button>
            </div>

            <!-- Icons (Right on mobile and desktop) -->
            <div class="header-icons d-flex align-items-center gap-3 order-2 order-md-3 ms-auto ms-md-0">
                <a href="login.html" class="text-dark text-decoration-none fs-5 icon-link position-relative" title="Login/Profile">
                    <i class="bi bi-person"></i>
                </a>
                <a href="orders.html" class="text-dark text-decoration-none fs-5 icon-link position-relative d-none d-sm-block" title="My Orders">
                    <i class="bi bi-box-seam"></i>
                </a>
                <a href="#" class="text-dark text-decoration-none fs-5 icon-link position-relative" title="Favorites">
                    <i class="bi bi-heart"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success badge-count">0</span>
                </a>
                <a href="cart.html" class="text-dark text-decoration-none fs-5 icon-link position-relative d-flex align-items-center" title="Cart">
                    <i class="bi bi-cart3"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-pink badge-count cart-total-badge" id="cartCount">0</span>
                </a>
            </div>
        </div>
    </header>

    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top" id="mainNavbar">
        <div class="container">
            <button class="navbar-toggler border-0 shadow-none ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse justify-content-center" id="mainNav">
                <ul class="navbar-nav gap-4 fw-medium text-uppercase small align-items-center text-center mt-3 mt-lg-0">
                    <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
                    <li class="nav-item"><a class="nav-link text-success" href="fresh-veggies.html">Fresh Veggies</a></li>
                    <li class="nav-item"><a class="nav-link text-warning" href="fresh-fruits.html">Fresh Fruits</a></li>
                    <li class="nav-item"><a class="nav-link text-pink" href="ice-cream-parlour.html">Ice-Cream Parlour</a></li>
                    <li class="nav-item"><a class="nav-link" href="about-us.html">About Us</a></li>
                    <li class="nav-item"><a class="nav-link" href="contact.html">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>
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
