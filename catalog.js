// catalog.js
// This unified catalog stores all products in the store. 
// Rendering, Searching, and Filtering logic uses this array.

const YADAV_CATALOG = [
    // --- FRESH VEGETABLES ---
    {
        id: 'v1',
        title: 'Fresh Red Tomatoes',
        category: 'Vegetables',
        subCategory: 'Gourds & Squashes',
        price: 50,
        originalPrice: 60,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍅',
        rating: 4.5,
        badge: '-15%',
        desc: 'Farm fresh red tomatoes rich in antioxidants.'
    },
    {
        id: 'v2',
        title: 'Premium Potatoes',
        category: 'Vegetables',
        subCategory: 'Root Vegetables',
        price: 30,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🥔',
        rating: 4,
        badge: '',
        desc: 'High quality potatoes perfect for curries and fries.'
    },
    {
        id: 'v3',
        title: 'Nashik Onions',
        category: 'Vegetables',
        subCategory: 'Onions & Potatoes',
        price: 35,
        originalPrice: 45,
        image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🧅',
        rating: 5,
        badge: 'Sale',
        desc: 'Authentic Nashik red onions.'
    },
    {
        id: 'v4',
        title: 'Orange Carrots',
        category: 'Vegetables',
        subCategory: 'Root Vegetables',
        price: 50,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🥕',
        rating: 4.5,
        badge: '',
        desc: 'Crunchy and sweet, excellent for juicing.'
    },
    {
        id: 'v5',
        title: 'Organic Broccoli',
        category: 'Vegetables',
        subCategory: 'Leafy Greens',
        price: 80,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🥦',
        rating: 4,
        badge: 'Fresh',
        desc: 'Rich in vitamins, grown without chemicals.'
    },
    {
        id: 'v6',
        title: 'Fresh Spinach',
        category: 'Vegetables',
        subCategory: 'Leafy Greens',
        price: 20,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🥬',
        rating: 5,
        badge: '',
        desc: 'Iron-rich, vibrant fresh spinach leaves.'
    },

    // --- FRESH FRUITS ---
    {
        id: 'f1',
        title: 'Kashmiri Apples',
        category: 'Fruits',
        subCategory: 'Everyday Fruits',
        price: 120,
        originalPrice: 150,
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍎',
        rating: 5,
        badge: 'Top Rated',
        desc: 'Sweet, crisp, and freshly harvested Kashmiri Apples.'
    },
    {
        id: 'f2',
        title: 'Robusta Bananas',
        category: 'Fruits',
        subCategory: 'Everyday Fruits',
        price: 40,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍌',
        rating: 4.5,
        badge: '',
        desc: 'Spotless, energy-packed Robusta Bananas.'
    },
    {
        id: 'f3',
        title: 'Nagpur Oranges',
        category: 'Fruits',
        subCategory: 'Citrus',
        price: 80,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍊',
        rating: 4,
        badge: 'Fresh',
        desc: 'Juicy and tangy oranges straight from Nagpur.'
    },
    {
        id: 'f4',
        title: 'Alphonso Mangoes',
        category: 'Fruits',
        subCategory: 'Tropical',
        price: 400,
        originalPrice: 500,
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🥭',
        rating: 5,
        badge: 'Premium',
        desc: 'The King of Mangoes, pure Alphonso delight.'
    },
    {
        id: 'f5',
        title: 'Red Cherries',
        category: 'Fruits',
        subCategory: 'Berries',
        price: 250,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍒',
        rating: 4.5,
        badge: '',
        desc: 'Sweet, imported premium red cherries.'
    },

    // --- ICE CREAMS ---
    {
        id: 'i7',
        title: 'Vanilla Strawberry Sundae',
        category: 'Ice-Creams',
        subCategory: 'Scooperstar Cups',
        price: 120,
        originalPrice: 150,
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍨',
        rating: 5,
        badge: 'Featured',
        desc: 'Classic vanilla ice cream topped with sweet strawberry syrup and a cherry.'
    },
    {
        id: 'i1',
        title: 'Belgian Choconut Cup',
        category: 'Ice-Creams',
        subCategory: 'Scooperstar Cups',
        price: 55,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍦',
        rating: 5,
        badge: '',
        desc: 'Rich Belgian chocolate loaded with choconuts in a premium cup.'
    },
    {
        id: 'i2',
        title: 'Raj Bhog Cup',
        category: 'Ice-Creams',
        subCategory: 'Scooperstar Cups',
        price: 50,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1570197781417-0a82375c9371?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍨',
        rating: 4.5,
        badge: '',
        desc: 'Authentic royal Raj Bhog flavor served as a rich creamy cup.'
    },
    {
        id: 'i3',
        title: 'Blueberry Cheesecake',
        category: 'Ice-Creams',
        subCategory: 'Scooperstar Cups',
        price: 55,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍧',
        rating: 5,
        badge: 'Bestseller',
        desc: 'Delicious blueberry swirl layered with rich cheesecake ice cream.'
    },
    {
        id: 'i4',
        title: 'Crunchy Chocobar',
        category: 'Ice-Creams',
        subCategory: 'Choco Bar',
        price: 30,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1552689486-f6773047d19f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍫',
        rating: 4.5,
        badge: '',
        desc: 'Classic vanilla wrapped in a thick, crunchy chocolate layer.'
    },
    {
        id: 'i5',
        title: 'Hazelnut Mudslide Cake',
        category: 'Ice-Creams',
        subCategory: 'Ice-Cream Cakes',
        price: 950,
        originalPrice: 1100,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🎂',
        rating: 4.5,
        badge: 'Offer',
        desc: 'A massive 1000ml Hazelnut Mudslide Ice-Cream Cake for celebrations!'
    },
    {
        id: 'i6',
        title: 'Cookie Monster Cone',
        category: 'Ice-Creams',
        subCategory: 'Chillo Cone',
        price: 55,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        emoji: '🍦',
        rating: 5,
        badge: '',
        desc: 'Dark crunchy cookie crumbles in a wonderful vanilla cone.'
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YADAV_CATALOG };
}
