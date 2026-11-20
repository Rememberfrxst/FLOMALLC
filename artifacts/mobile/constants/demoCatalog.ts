const img = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export interface DemoOfferItem {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderValue: string | null;
  maxDiscount: string | null;
  validUntil: string | null;
}

export const DEMO_STOREFRONT = {
  storeName: "FLOMA",
  announcement:
    "Curated fashion, lifestyle & everyday essentials · Use DEMO10 for 10% OFF",
  supportEmail: "rememberfrxst@gmail.com",
  deliveryFee: 40,
  freeShippingThreshold: 999,
  downloadUrl: "",
  returnsHeadline: "Easy returns & exchanges",
  returnsPolicy:
    "Contact customer care with your order number for return or exchange eligibility and assistance.",
  shippingPolicy:
    "Delivery charges are shown at checkout. Contact customer care for help with your delivery.",
  privacyPolicy:
    "For questions about your account data or a deletion request, contact customer care.",
  termsOfService:
    "Prices, product availability and delivery charges are confirmed at checkout. Contact customer care for questions about your order.",
  aboutStore:
    "FLOMA brings together curated fashion, footwear, beauty and modern lifestyle essentials with effortless discovery.",
};

export const DEMO_OFFERS: DemoOfferItem[] = [
  {
    id: "coup-1",
    code: "DEMO10",
    discountType: "percentage",
    discountValue: "10",
    minOrderValue: "999",
    maxDiscount: "750",
    validUntil: null,
  },
  {
    id: "coup-2",
    code: "FIRST200",
    discountType: "fixed",
    discountValue: "200",
    minOrderValue: "1499",
    maxDiscount: "200",
    validUntil: null,
  },
  {
    id: "coup-3",
    code: "STYLE15",
    discountType: "percentage",
    discountValue: "15",
    minOrderValue: "2499",
    maxDiscount: "1000",
    validUntil: null,
  },
  {
    id: "coup-4",
    code: "FLOMA20",
    discountType: "percentage",
    discountValue: "20",
    minOrderValue: "2999",
    maxDiscount: "1200",
    validUntil: null,
  },
];

const RAW_CATEGORIES: Array<[string, string, string, string, string]> = [
  ["Men", "men", "shirt-outline", "#2F4858", "photo-1617137968427-85924c800a22"],
  ["Women", "women", "woman-outline", "#C95F7B", "photo-1483985988355-763728e1935b"],
  ["Footwear", "footwear", "footsteps-outline", "#735751", "photo-1542291026-7eec264c27ff"],
  ["Accessories", "accessories", "bag-handle-outline", "#8E6C88", "photo-1523779917675-b6ed3a42a561"],
  ["Beauty", "beauty", "sparkles-outline", "#C98986", "photo-1596462502278-27bfdc403348"],
  ["Smartphones", "smartphones", "phone-portrait-outline", "#526D82", "photo-1511707171634-5f897ff02aa9"],
  ["Audio", "audio", "headset-outline", "#4D7C6F", "photo-1505740420928-5e560c06d30e"],
  ["Home & Living", "home-living", "home-outline", "#A27752", "photo-1618221195710-dd6b41faaea6"],
];

const CAT_ID_BY_SLUG = new Map<string, string>();

export const DEMO_CATEGORIES = RAW_CATEGORIES.map(
  ([name, slug, icon, color, photo], idx) => {
    const id = `cat-${idx + 1}`;
    CAT_ID_BY_SLUG.set(slug, id);
    return {
      id,
      name,
      slug,
      icon,
      color,
      imageUrl: img(photo),
      isActive: true,
    };
  },
);

export const DEMO_BANNERS = [
  {
    id: "ban-1",
    title: "THE NEW SEASON EDIT",
    subtitle: "Fresh silhouettes, standout layers and everyday essentials.",
    imageUrl: img("photo-1445205170230-053b83016050", 1400),
    linkType: "category",
    linkValue: "women",
    isActive: true,
  },
  {
    id: "ban-2",
    title: "TECH THAT MOVES WITH YOU",
    subtitle: "Phones and audio selected for work, play and everything between.",
    imageUrl: img("photo-1516321318423-f06f85e504b3", 1400),
    linkType: "category",
    linkValue: "smartphones",
    isActive: true,
  },
  {
    id: "ban-3",
    title: "BEAUTY, EVERY DAY",
    subtitle: "Small rituals, polished finishes and new signature scents.",
    imageUrl: img("photo-1596462502278-27bfdc403348", 1400),
    linkType: "category",
    linkValue: "beauty",
    isActive: true,
  },
];

type RawProduct = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  compareAt: number;
  photo: string;
  featured?: boolean;
};

const RAW_PRODUCTS: RawProduct[] = [
  { name: "Essential Oversized T-Shirt", slug: "demo-essential-oversized-tshirt", category: "men", brand: "FLOMA Studio", price: 799, compareAt: 1299, photo: "photo-1521572163474-6864f9cf17ab", featured: true },
  { name: "Washed Denim Jacket", slug: "demo-washed-denim-jacket", category: "men", brand: "Northline", price: 2499, compareAt: 3499, photo: "photo-1551537482-f2075a1d41f2", featured: true },
  { name: "Relaxed Utility Cargo", slug: "demo-relaxed-utility-cargo", category: "men", brand: "Urban Field", price: 1799, compareAt: 2599, photo: "photo-1517445312882-bc9910d016b7" },
  { name: "Premium Knit Polo", slug: "demo-premium-knit-polo", category: "men", brand: "Aster", price: 1399, compareAt: 1999, photo: "photo-1586790170083-2f9ceadc732d" },
  { name: "Everyday Zip Hoodie", slug: "demo-everyday-zip-hoodie", category: "men", brand: "FLOMA Basics", price: 1599, compareAt: 2299, photo: "photo-1556821840-3a63f95609a7" },
  { name: "Satin Evening Dress", slug: "demo-satin-evening-dress", category: "women", brand: "Elara", price: 2899, compareAt: 4199, photo: "photo-1566174053879-31528523f8ae", featured: true },
  { name: "Linen Co-ord Set", slug: "demo-linen-coord-set", category: "women", brand: "Mysa", price: 2199, compareAt: 3199, photo: "photo-1539109136881-3be0616acf4b", featured: true },
  { name: "Ribbed Crop Top", slug: "demo-ribbed-crop-top", category: "women", brand: "FLOMA Studio", price: 699, compareAt: 1099, photo: "photo-1503342217505-b0a15ec3261c" },
  { name: "High Rise Wide Leg Jeans", slug: "demo-wide-leg-jeans", category: "women", brand: "Indigo House", price: 1899, compareAt: 2699, photo: "photo-1541099649105-f69ad21f3246" },
  { name: "Soft Knit Cardigan", slug: "demo-soft-knit-cardigan", category: "women", brand: "Mysa", price: 1499, compareAt: 2199, photo: "photo-1434389677669-e08b4cac3105" },
  { name: "Street Court Sneakers", slug: "demo-street-court-sneakers", category: "footwear", brand: "Stride", price: 2299, compareAt: 3299, photo: "photo-1549298916-b41d501d3772", featured: true },
  { name: "Aero Running Shoes", slug: "demo-aero-running-shoes", category: "footwear", brand: "Pace", price: 3499, compareAt: 4999, photo: "photo-1542291026-7eec264c27ff", featured: true },
  { name: "Classic Penny Loafers", slug: "demo-classic-penny-loafers", category: "footwear", brand: "Borough", price: 2799, compareAt: 3999, photo: "photo-1614252369475-531eba835eb1" },
  { name: "Cloud Comfort Slides", slug: "demo-cloud-comfort-slides", category: "footwear", brand: "Drift", price: 899, compareAt: 1399, photo: "photo-1603487742131-4160ec999306" },
  { name: "Chelsea Ankle Boots", slug: "demo-chelsea-ankle-boots", category: "footwear", brand: "Borough", price: 3299, compareAt: 4799, photo: "photo-1608256246200-53e635b5b65f" },
  { name: "Structured Crossbody Bag", slug: "demo-structured-crossbody", category: "accessories", brand: "Miro", price: 1799, compareAt: 2599, photo: "photo-1584917865442-de89df76afd3", featured: true },
  { name: "Retro Square Sunglasses", slug: "demo-retro-square-sunglasses", category: "accessories", brand: "Sol", price: 999, compareAt: 1599, photo: "photo-1511499767150-a48a237f0083" },
  { name: "Minimal Steel Watch", slug: "demo-minimal-steel-watch", category: "accessories", brand: "Noma", price: 2999, compareAt: 4499, photo: "photo-1524592094714-0f0654e20314" },
  { name: "City Day Backpack", slug: "demo-city-day-backpack", category: "accessories", brand: "Carry Co.", price: 1999, compareAt: 2999, photo: "photo-1553062407-98eeb64c6a62" },
  { name: "Vitamin C Glow Serum", slug: "demo-vitamin-c-serum", category: "beauty", brand: "Pure Edit", price: 749, compareAt: 999, photo: "photo-1620916566398-39f1143ab7be", featured: true },
  { name: "Velvet Matte Lip Color", slug: "demo-velvet-matte-lip", category: "beauty", brand: "Muse", price: 599, compareAt: 899, photo: "photo-1586495777744-4413f21062fa" },
  { name: "No. 08 Eau de Parfum", slug: "demo-no08-perfume", category: "beauty", brand: "Atelier Eight", price: 1899, compareAt: 2799, photo: "photo-1541643600914-78b084683601" },
  { name: "iPhone 15 Pro", slug: "demo-iphone-15-pro", category: "smartphones", brand: "Apple", price: 129900, compareAt: 139900, photo: "photo-1695048133142-1a20484d2569", featured: true },
  { name: "Galaxy S24 5G", slug: "demo-galaxy-s24", category: "smartphones", brand: "Samsung", price: 74999, compareAt: 84999, photo: "photo-1610945265064-0e34e5519bbf", featured: true },
  { name: "Pixel 8", slug: "demo-pixel-8", category: "smartphones", brand: "Google", price: 62999, compareAt: 75999, photo: "photo-1598327105666-5b89351aff97" },
  { name: "WH-1000XM5 Headphones", slug: "demo-sony-xm5", category: "audio", brand: "Sony", price: 29990, compareAt: 34990, photo: "photo-1505740420928-5e560c06d30e", featured: true },
  { name: "Studio True Wireless Buds", slug: "demo-wireless-buds", category: "audio", brand: "Sonic", price: 3999, compareAt: 5999, photo: "photo-1606220945770-b5b6c2c55bf1" },
  { name: "Portable Mini Speaker", slug: "demo-mini-speaker", category: "audio", brand: "Pulse", price: 2499, compareAt: 3499, photo: "photo-1608043152269-423dbba4e7e1" },
  { name: "Mushroom Table Lamp", slug: "demo-mushroom-table-lamp", category: "home-living", brand: "Casa Form", price: 1699, compareAt: 2499, photo: "photo-1507473885765-e6ed057f782c", featured: true },
  { name: "Textured Cotton Cushion", slug: "demo-textured-cushion", category: "home-living", brand: "Casa Form", price: 699, compareAt: 999, photo: "photo-1584100936595-c0654b55a2e2" },
  { name: "Relaxed Oxford Button Shirt", slug: "demo-oxford-button-shirt", category: "men", brand: "Aster", price: 1499, compareAt: 2299, photo: "photo-1602810318383-e386cc2a3ccf" },
  { name: "Tailored Wool Blend Blazer", slug: "demo-tailored-wool-blazer", category: "men", brand: "Northline", price: 3999, compareAt: 5999, photo: "photo-1507679799987-c73779587ccf", featured: true },
  { name: "Floral Pleated Midi Skirt", slug: "demo-pleated-midi-skirt", category: "women", brand: "Elara", price: 1699, compareAt: 2499, photo: "photo-1583496661160-fb5886a0aaaa" },
  { name: "Structured Trench Coat", slug: "demo-structured-trench-coat", category: "women", brand: "Indigo House", price: 3699, compareAt: 5299, photo: "photo-1591047139829-d91aecb6caea", featured: true },
  { name: "Chunky Leather Derby Shoes", slug: "demo-leather-derby-shoes", category: "footwear", brand: "Borough", price: 2999, compareAt: 4299, photo: "photo-1533867617858-e7b97e060509" },
  { name: "Canvas Low-Top Trainers", slug: "demo-canvas-trainers", category: "footwear", brand: "Stride", price: 1599, compareAt: 2399, photo: "photo-1525966222134-fcfa99b8ae77" },
  { name: "Full-Grain Leather Tote", slug: "demo-leather-tote-bag", category: "accessories", brand: "Miro", price: 2599, compareAt: 3799, photo: "photo-1590874103328-eac38a683ce7", featured: true },
  { name: "Polarized Aviator Shades", slug: "demo-polarized-aviators", category: "accessories", brand: "Sol", price: 1299, compareAt: 1999, photo: "photo-1572635196237-14b3f281503f" },
  { name: "Hydrating Barrier Moisturizer", slug: "demo-barrier-moisturizer", category: "beauty", brand: "Pure Edit", price: 899, compareAt: 1299, photo: "photo-1611930022073-b7a4ba5fcccd" },
  { name: "Rosewater Setting Mist", slug: "demo-rosewater-mist", category: "beauty", brand: "Muse", price: 549, compareAt: 799, photo: "photo-1556228720-195a672e8a03" },
  { name: "Botanical Cleansing Oil", slug: "demo-cleansing-oil", category: "beauty", brand: "Pure Edit", price: 799, compareAt: 1149, photo: "photo-1570194065650-d99fb4b38b15" },
  { name: "OnePlus 12R 5G", slug: "demo-oneplus-12r", category: "smartphones", brand: "OnePlus", price: 39999, compareAt: 44999, photo: "photo-1592899677977-9c10ca588bbd" },
  { name: "Nothing Phone (2a)", slug: "demo-nothing-phone-2a", category: "smartphones", brand: "Nothing", price: 23999, compareAt: 27999, photo: "photo-1511707171634-5f897ff02aa9" },
  { name: "Redmi Note 13 Pro+ 5G", slug: "demo-redmi-note-13-pro", category: "smartphones", brand: "Xiaomi", price: 31999, compareAt: 35999, photo: "photo-1580910051074-3eb694886505" },
  { name: "Studio Monitor Headphones", slug: "demo-studio-headphones", category: "audio", brand: "Pulse", price: 6999, compareAt: 9999, photo: "photo-1546435770-a3e426bf472b" },
  { name: "Vinyl Turntable Soundbar", slug: "demo-compact-soundbar", category: "audio", brand: "Sonic", price: 8999, compareAt: 12999, photo: "photo-1545454675-3531b543be5d" },
  { name: "Acoustic Wireless Neckband", slug: "demo-wireless-neckband", category: "audio", brand: "Pulse", price: 1499, compareAt: 2299, photo: "photo-1590658268037-6bf12165a8df" },
  { name: "Stoneware Espresso Mug Set", slug: "demo-stoneware-mug-set", category: "home-living", brand: "Casa Form", price: 1199, compareAt: 1699, photo: "photo-1514228742587-6b1558fcca3d" },
  { name: "Minimalist Ceramic Flower Vase", slug: "demo-ceramic-flower-vase", category: "home-living", brand: "Atelier Home", price: 1299, compareAt: 1899, photo: "photo-1578500494198-246f612d3b3d" },
  { name: "Woven Linen Throw Blanket", slug: "demo-linen-throw-blanket", category: "home-living", brand: "Casa Form", price: 1899, compareAt: 2699, photo: "photo-1555041469-a586c61ea9bc", featured: true },
  { name: "Scented Soy Amber Candle", slug: "demo-amber-soy-candle", category: "home-living", brand: "Atelier Home", price: 749, compareAt: 1099, photo: "photo-1602874801007-bd458bb1b8b6" },
];

function buildVariants(id: string, index: number, categorySlug: string) {
  if (["men", "women"].includes(categorySlug)) {
    return ["S", "M", "L", "XL"].map((value, vi) => ({
      id: `var-${index + 1}-${vi + 1}`,
      name: "Size",
      value,
      priceModifier: "0",
      stock: 12 + vi * 3,
      sku: `DEMO-${index + 1}-${vi + 1}`,
    }));
  }
  if (categorySlug === "footwear") {
    return ["6", "7", "8", "9", "10"].map((value, vi) => ({
      id: `var-${index + 1}-${vi + 1}`,
      name: "Size",
      value,
      priceModifier: "0",
      stock: 12 + vi * 3,
      sku: `DEMO-${index + 1}-${vi + 1}`,
    }));
  }
  if (categorySlug === "smartphones") {
    return ["128GB", "256GB"].map((value, vi) => ({
      id: `var-${index + 1}-${vi + 1}`,
      name: "Storage",
      value,
      priceModifier: vi ? "10000" : "0",
      stock: 10 + vi * 4,
      sku: `DEMO-${index + 1}-${vi + 1}`,
    }));
  }
  if (["audio", "accessories"].includes(categorySlug)) {
    return ["Black", "Sand"].map((value, vi) => ({
      id: `var-${index + 1}-${vi + 1}`,
      name: "Color",
      value,
      priceModifier: "0",
      stock: 14 + vi * 3,
      sku: `DEMO-${index + 1}-${vi + 1}`,
    }));
  }
  return [];
}

export const DEMO_PRODUCTS = RAW_PRODUCTS.map((item, index) => {
  const id = `prod-${index + 1}`;
  const categoryId = CAT_ID_BY_SLUG.get(item.category);
  const categoryObj = DEMO_CATEGORIES.find((c) => c.id === categoryId);
  const variants = buildVariants(id, index, item.category);
  return {
    id,
    name: item.name,
    slug: item.slug,
    description: `${item.name} from ${item.brand}. Curated quality with selectable options, instant dispatch, and easy returns on FLOMA.`,
    price: item.price.toFixed(2),
    compareAtPrice: item.compareAt.toFixed(2),
    categoryId,
    brand: item.brand,
    sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
    stock: 35 + (index % 6) * 7,
    isActive: true,
    isFeatured: item.featured ?? index % 4 === 0,
    avgRating: (4.2 + (index % 7) / 10).toFixed(1),
    totalReviews: 18 + index * 3,
    totalSold: 320 - index * 4,
    specifications: {
      Brand: item.brand,
      Collection: "FLOMA Curated",
      Availability: "In stock",
    },
    tags: ["demo", item.category, item.brand.toLowerCase()],
    images: [
      {
        id: `img-${index + 1}-a`,
        url: img(item.photo),
        altText: item.name,
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: `img-${index + 1}-b`,
        url: img(item.photo, 1100),
        altText: `${item.name} detail`,
        isPrimary: false,
        sortOrder: 1,
      },
    ],
    variants,
    variantCount: variants.length,
    category: categoryObj,
  };
});

export function filterDemoProducts(params?: Record<string, string | number | boolean>) {
  const q = String(params?.q ?? "").trim().toLowerCase();
  const category = String(params?.category ?? "").trim().toLowerCase();
  const sort = String(params?.sort ?? "popular");
  const featured = params?.featured === true || params?.featured === "true";
  const inStock = params?.inStock === true || params?.inStock === "true";
  const minPrice = params?.minPrice !== undefined ? Number(params.minPrice) : undefined;
  const maxPrice = params?.maxPrice !== undefined ? Number(params.maxPrice) : undefined;
  const page = Math.max(1, Number(params?.page ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(params?.limit ?? 20) || 20));

  let list = [...DEMO_PRODUCTS];

  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category?.slug ?? "").toLowerCase().includes(q),
    );
  }

  if (category) {
    const matchedCat = DEMO_CATEGORIES.find(
      (c) => c.id.toLowerCase() === category || c.slug.toLowerCase() === category,
    );
    if (matchedCat) {
      list = list.filter((p) => p.categoryId === matchedCat.id);
    } else {
      list = list.filter((p) =>
        (p.category?.slug ?? "").toLowerCase().includes(category),
      );
    }
  }

  if (featured) {
    list = list.filter((p) => p.isFeatured);
  }
  if (inStock) {
    list = list.filter((p) => p.stock > 0 || p.variants.some((v) => v.stock > 0));
  }
  if (minPrice !== undefined && !Number.isNaN(minPrice)) {
    list = list.filter((p) => Number(p.price) >= minPrice);
  }
  if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
    list = list.filter((p) => Number(p.price) <= maxPrice);
  }

  switch (sort) {
    case "price_asc":
      list.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price_desc":
      list.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "rating":
      list.sort((a, b) => Number(b.avgRating) - Number(a.avgRating));
      break;
    case "popular":
      list.sort((a, b) => b.totalSold - a.totalSold);
      break;
    default:
      // newest: preserve natural descending curated order
      break;
  }

  const total = list.length;
  const start = (page - 1) * limit;
  const data = list.slice(start, start + limit);

  return { data, total, page, limit };
}

export function getDemoProductById(id: string) {
  return (
    DEMO_PRODUCTS.find((p) => p.id === id || p.slug === id) ?? null
  );
}
