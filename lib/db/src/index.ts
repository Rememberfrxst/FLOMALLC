import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type StoreRow = Record<string, any>;

function buildColumnLookup() {
  const colToMeta = new Map<any, { table: unknown; jsKey: string; dbName: string }>();
  const colByTableAndDbName = new Map<unknown, Map<string, string>>();

  for (const exported of Object.values(schema)) {
    if (!exported || typeof exported !== "object") continue;
    const colsSymbol = Symbol.for("drizzle:Columns");
    const cols = (exported as any)[colsSymbol];
    if (!cols || typeof cols !== "object") continue;

    const dbNameMap = new Map<string, string>();
    for (const [jsKey, col] of Object.entries<any>(cols)) {
      if (col && typeof col === "object" && col.name) {
        colToMeta.set(col, { table: exported, jsKey, dbName: col.name });
        dbNameMap.set(col.name, jsKey);
      }
    }
    colByTableAndDbName.set(exported, dbNameMap);
  }

  return { colToMeta, colByTableAndDbName };
}

const { colToMeta, colByTableAndDbName } = buildColumnLookup();

function getColValue(row: StoreRow, col: any, joinedRows?: Map<unknown, StoreRow>): any {
  const meta = colToMeta.get(col);
  if (!meta) return undefined;
  if (joinedRows && joinedRows.has(meta.table)) {
    return joinedRows.get(meta.table)?.[meta.jsKey];
  }
  return row?.[meta.jsKey];
}

function isColumn(chunk: any): boolean {
  return Boolean(chunk && typeof chunk === "object" && colToMeta.has(chunk));
}

function isParam(chunk: any): boolean {
  return Boolean(chunk && typeof chunk === "object" && chunk.constructor?.name === "Param");
}

function isStringChunk(chunk: any): boolean {
  return Boolean(chunk && typeof chunk === "object" && Array.isArray(chunk.value));
}

function getSqlText(chunks: any[]): string {
  return chunks
    .filter((c) => isStringChunk(c))
    .map((c) => c.value.join(""))
    .join(" ")
    .toLowerCase();
}

function evalCondition(
  expr: any,
  row: StoreRow,
  joinedRows?: Map<unknown, StoreRow>,
): boolean {
  if (!expr) return true;
  const chunks: any[] = expr.queryChunks;
  if (!Array.isArray(chunks) || chunks.length === 0) return true;

  const text = getSqlText(chunks);

  // Logical grouping: and(...) / or(...)
  const innerSql = chunks.filter((c) => c && Array.isArray(c.queryChunks));
  if (innerSql.length > 0 && !chunks.some((c) => isColumn(c))) {
    // Drizzle wraps `and(a, b)` in a SQL chunk whose queryChunks alternate with ' and ' / ' or '
    if (innerSql.length === 1 && chunks[0]?.value?.[0] === "(") {
      return evalCondition(innerSql[0], row, joinedRows);
    }
    if (text.includes(" or ")) {
      return innerSql.some((sub) => evalCondition(sub, row, joinedRows));
    }
    return innerSql.every((sub) => evalCondition(sub, row, joinedRows));
  }

  // Leaf binary/unary expressions referencing a column
  const col = chunks.find((c) => isColumn(c));
  if (!col) return true;

  const rowVal = getColValue(row, col, joinedRows);
  const params = chunks.filter((c) => isParam(c)).map((c) => c.value);
  const rawStrings = chunks.filter((c) => typeof c === "string" || (c && c.constructor?.name === "String" && c.value !== undefined));

  if (text.includes(" = ")) {
    // Handle column = column (join) or column = param
    const cols = chunks.filter((c) => isColumn(c));
    if (cols.length === 2) {
      return getColValue(row, cols[0], joinedRows) === getColValue(row, cols[1], joinedRows);
    }
    return rowVal === params[0];
  }
  if (text.includes(" <> ") || text.includes(" != ")) {
    return rowVal !== params[0];
  }
  if (text.includes(" in ")) {
    const arrayChunk = chunks.find((c) => Array.isArray(c));
    const arr = arrayChunk
      ? arrayChunk.map((item: any) => (isParam(item) ? item.value : item))
      : Array.isArray(params[0])
        ? params[0]
        : params;
    return arr.includes(rowVal);
  }
  if (text.includes(" ilike ")) {
    const raw = typeof rawStrings[0] === "string" ? rawStrings[0] : rawStrings[0]?.value;
    const pattern = String(params[0] ?? raw ?? "").replace(/%/g, ".*");
    return new RegExp(`^${pattern}$`, "i").test(String(rowVal ?? ""));
  }
  if (text.includes(" like ")) {
    const raw = typeof rawStrings[0] === "string" ? rawStrings[0] : rawStrings[0]?.value;
    const pattern = String(params[0] ?? raw ?? "").replace(/%/g, ".*");
    return new RegExp(`^${pattern}$`).test(String(rowVal ?? ""));
  }
  if (text.includes("is null") && text.includes(" or ")) {
    // e.g. (startsAt IS NULL OR startsAt <= NOW())
    if (rowVal === null || rowVal === undefined) return true;
    const d = new Date(rowVal).getTime();
    if (text.includes("<=")) return d <= Date.now();
    if (text.includes(">=")) return d >= Date.now();
    return true;
  }
  if (text.includes("is not null")) {
    return rowVal !== null && rowVal !== undefined;
  }
  if (text.includes("is null")) {
    return rowVal === null || rowVal === undefined;
  }
  if (text.includes(" >= ") && params.length > 0) {
    return Number(rowVal) >= Number(params[0]);
  }
  if (text.includes(" <= ") && params.length > 0) {
    return Number(rowVal) <= Number(params[0]);
  }
  if (text.includes(" > 0")) {
    return Number(rowVal) > 0;
  }

  return true;
}

function compareValues(a: any, b: any, direction: "asc" | "desc"): number {
  const mult = direction === "desc" ? -1 : 1;
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (a instanceof Date || b instanceof Date) {
    return (new Date(a).getTime() - new Date(b).getTime()) * mult;
  }
  const numA = Number(a);
  const numB = Number(b);
  if (a !== "" && b !== "" && !Number.isNaN(numA) && !Number.isNaN(numB)) {
    return (numA - numB) * mult;
  }
  return String(a).localeCompare(String(b)) * mult;
}

function projectFields(
  fields: Record<string, any>,
  baseRow: StoreRow,
  joinedRows: Map<unknown, StoreRow>,
): StoreRow {
  const out: StoreRow = {};
  for (const [key, spec] of Object.entries(fields)) {
    if (isColumn(spec)) {
      out[key] = getColValue(baseRow, spec, joinedRows);
    } else if (spec && typeof spec === "object" && !Array.isArray(spec) && !spec.queryChunks) {
      const nested = projectFields(spec, baseRow, joinedRows);
      // For leftJoin where all nested values are undefined, mimic SQL null if id is undefined
      const allUndefined = Object.values(nested).every((v) => v === undefined);
      out[key] = allUndefined ? null : nested;
    } else if (spec && Array.isArray(spec.queryChunks)) {
      const text = getSqlText(spec.queryChunks);
      if (text.includes("count")) {
        out[key] = 0;
      } else {
        out[key] = null;
      }
    } else {
      out[key] = spec;
    }
  }
  return out;
}

function createMockDb() {
  const image = (id: string, width = 900) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

  const tables = new Map<unknown, StoreRow[]>();

  const categorySeed: [string, string, string, string, string][] = [
    ["Men", "men", "shirt-outline", "#2F4858", "photo-1617137968427-85924c800a22"],
    ["Women", "women", "woman-outline", "#C95F7B", "photo-1483985988355-763728e1935b"],
    ["Footwear", "footwear", "footsteps-outline", "#735751", "photo-1542291026-7eec264c27ff"],
    ["Accessories", "accessories", "bag-handle-outline", "#8E6C88", "photo-1523779917675-b6ed3a42a561"],
    ["Beauty", "beauty", "sparkles-outline", "#C98986", "photo-1596462502278-27bfdc403348"],
    ["Smartphones", "smartphones", "phone-portrait-outline", "#526D82", "photo-1511707171634-5f897ff02aa9"],
    ["Audio", "audio", "headset-outline", "#4D7C6F", "photo-1505740420928-5e560c06d30e"],
    ["Home & Living", "home-living", "home-outline", "#A27752", "photo-1618221195710-dd6b41faaea6"],
  ];

  const catIdBySlug = new Map<string, string>();
  const seededCategories: StoreRow[] = categorySeed.map(([name, slug, icon, color, photo], idx) => {
    const id = `cat-${idx + 1}`;
    catIdBySlug.set(slug, id);
    return {
      id,
      name,
      slug,
      icon,
      color,
      imageUrl: image(photo),
      parentId: null,
      sortOrder: idx + 1,
      isActive: true,
    };
  });

  const productSeed: Array<{
    name: string;
    slug: string;
    category: string;
    brand: string;
    price: number;
    compareAt: number;
    photo: string;
    featured?: boolean;
  }> = [
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
  ];

  const baseTime = Date.now();
  const seededProducts: StoreRow[] = [];
  const seededProductImages: StoreRow[] = [];
  const seededProductVariants: StoreRow[] = [];

  productSeed.forEach((item, index) => {
    const id = `prod-${index + 1}`;
    const createdAt = new Date(baseTime - index * 60_000);
    seededProducts.push({
      id,
      name: item.name,
      slug: item.slug,
      description: `${item.name} from ${item.brand}. Demo-ready product with selectable options, stock, wishlist, cart and checkout support.`,
      price: item.price.toFixed(2),
      compareAtPrice: item.compareAt.toFixed(2),
      categoryId: catIdBySlug.get(item.category) ?? null,
      sellerId: null,
      brand: item.brand,
      sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
      stock: 35 + (index % 6) * 7,
      isActive: true,
      isFeatured: item.featured ?? index % 4 === 0,
      avgRating: (4.2 + (index % 7) / 10).toFixed(1),
      totalReviews: 18 + index * 3,
      totalSold: 220 - index * 4,
      specifications: { Brand: item.brand, Collection: "Demo collection", Availability: "In stock" },
      tags: ["demo", item.category, item.brand.toLowerCase()],
      createdAt,
      updatedAt: createdAt,
    });
    seededProductImages.push(
      { id: `img-${index + 1}-a`, productId: id, url: image(item.photo), altText: item.name, sortOrder: 0, isPrimary: true },
      { id: `img-${index + 1}-b`, productId: id, url: image(item.photo, 1100), altText: `${item.name} detail`, sortOrder: 1, isPrimary: false },
    );

    if (["men", "women"].includes(item.category)) {
      ["S", "M", "L", "XL"].forEach((val, vi) => {
        seededProductVariants.push({ id: `var-${index + 1}-${vi + 1}`, productId: id, name: "Size", value: val, priceModifier: "0", stock: 12 + vi * 3, sku: `DEMO-${index + 1}-${vi + 1}` });
      });
    } else if (item.category === "footwear") {
      ["6", "7", "8", "9", "10"].forEach((val, vi) => {
        seededProductVariants.push({ id: `var-${index + 1}-${vi + 1}`, productId: id, name: "Size", value: val, priceModifier: "0", stock: 12 + vi * 3, sku: `DEMO-${index + 1}-${vi + 1}` });
      });
    } else if (item.category === "smartphones") {
      ["128GB", "256GB"].forEach((val, vi) => {
        seededProductVariants.push({ id: `var-${index + 1}-${vi + 1}`, productId: id, name: "Storage", value: val, priceModifier: vi ? "10000" : "0", stock: 10 + vi * 4, sku: `DEMO-${index + 1}-${vi + 1}` });
      });
    } else if (["audio", "accessories"].includes(item.category)) {
      ["Black", "Sand"].forEach((val, vi) => {
        seededProductVariants.push({ id: `var-${index + 1}-${vi + 1}`, productId: id, name: "Color", value: val, priceModifier: "0", stock: 14 + vi * 3, sku: `DEMO-${index + 1}-${vi + 1}` });
      });
    }
  });

  const seededBanners: StoreRow[] = [
    { id: "ban-1", title: "THE NEW SEASON EDIT", subtitle: "Fresh silhouettes, standout layers and everyday essentials.", imageUrl: image("photo-1445205170230-053b83016050", 1400), linkType: "category", linkValue: "women", sortOrder: 0, isActive: true, startsAt: null, endsAt: null },
    { id: "ban-2", title: "TECH THAT MOVES WITH YOU", subtitle: "Phones and audio selected for work, play and everything between.", imageUrl: image("photo-1516321318423-f06f85e504b3", 1400), linkType: "category", linkValue: "smartphones", sortOrder: 1, isActive: true, startsAt: null, endsAt: null },
    { id: "ban-3", title: "BEAUTY, EVERY DAY", subtitle: "Small rituals, polished finishes and new signature scents.", imageUrl: image("photo-1596462502278-27bfdc403348", 1400), linkType: "category", linkValue: "beauty", sortOrder: 2, isActive: true, startsAt: null, endsAt: null },
  ];

  const seededCoupons: StoreRow[] = [
    { id: "coup-1", code: "DEMO10", discountType: "percentage", discountValue: "10", minOrderValue: "999", maxDiscount: "750", usageLimit: null, usedCount: 0, validFrom: null, validUntil: null, isActive: true },
    { id: "coup-2", code: "FIRST200", discountType: "fixed", discountValue: "200", minOrderValue: "1499", maxDiscount: "200", usageLimit: null, usedCount: 0, validFrom: null, validUntil: null, isActive: true },
    { id: "coup-3", code: "STYLE15", discountType: "percentage", discountValue: "15", minOrderValue: "2499", maxDiscount: "1000", usageLimit: null, usedCount: 0, validFrom: null, validUntil: null, isActive: true },
  ];

  const seededSettings: StoreRow[] = [
    {
      id: "storefront",
      data: {
        storeName: "FLOMA",
        announcement: "FLOMA Exclusive · Up to 50% OFF · Use DEMO10 at checkout",
        supportEmail: "rememberfrxst@gmail.com",
        deliveryFee: 40,
        freeShippingThreshold: 999,
        returnsHeadline: "Easy returns & exchanges",
        aboutStore: "Explore a complete demo catalog across fashion, beauty, electronics and home.",
      },
      updatedAt: new Date(),
    },
  ];

  tables.set(schema.categories, seededCategories);
  tables.set(schema.products, seededProducts);
  tables.set(schema.productImages, seededProductImages);
  tables.set(schema.productVariants, seededProductVariants);
  tables.set(schema.banners, seededBanners);
  tables.set(schema.coupons, seededCoupons);
  tables.set(schema.storeSettings, seededSettings);
  tables.set(schema.users, []);
  tables.set(schema.orders, []);
  tables.set(schema.orderItems, []);
  tables.set(schema.carts, []);
  tables.set(schema.cartItems, []);
  tables.set(schema.addresses, []);
  tables.set(schema.wishlists, []);
  tables.set(schema.reviews, []);
  tables.set(schema.notifications, []);
  tables.set(schema.userActivity, []);
  tables.set(schema.refreshTokens, []);
  tables.set(schema.adminAuditLogs, []);

  const getRows = (table: unknown): StoreRow[] => tables.get(table) ?? [];

  const makeThenable = (resolveFn: () => any) => {
    const chain: any = {
      _joins: [] as Array<{ type: "inner" | "left"; table: unknown; on: any }>,
      _orderBy: [] as any[],
      from(table: unknown) {
        this._table = table;
        return this;
      },
      leftJoin(table: unknown, on: any) {
        this._joins.push({ type: "left", table, on });
        return this;
      },
      innerJoin(table: unknown, on: any) {
        this._joins.push({ type: "inner", table, on });
        return this;
      },
      where(expr: any) {
        this._where = expr;
        return this;
      },
      groupBy(...cols: any[]) {
        this._groupBy = cols.flat().filter(Boolean);
        return this;
      },
      orderBy(...exprs: any[]) {
        this._orderBy = exprs.flat().filter(Boolean);
        return this;
      },
      limit(n: number) {
        this._limit = n;
        return this;
      },
      offset(n: number) {
        this._offset = n;
        return this;
      },
      for() {
        return this;
      },
      values(vals: any) {
        this._values = vals;
        return this;
      },
      set(vals: any) {
        this._values = vals;
        return this;
      },
      onConflictDoUpdate() {
        return this;
      },
      onConflictDoNothing() {
        return this;
      },
      returning() {
        this._returning = true;
        return this;
      },
      then(onFulfilled: any, onRejected: any) {
        return Promise.resolve()
          .then(() => resolveFn.call(this))
          .then(onFulfilled, onRejected);
      },
    };
    return chain;
  };

  const mockDb: any = {
    select(fields?: Record<string, any>) {
      return makeThenable(function (this: any) {
        const baseRows = getRows(this._table);

        // Expand joins if present
        type Entry = { base: StoreRow; joined: Map<unknown, StoreRow> };
        let entries: Entry[] = baseRows.map((row) => {
          const map = new Map<unknown, StoreRow>();
          map.set(this._table, row);
          return { base: row, joined: map };
        });

        for (const join of this._joins as Array<{ type: "inner" | "left"; table: unknown; on: any }>) {
          const rightRows = getRows(join.table);
          const nextEntries: Entry[] = [];
          for (const entry of entries) {
            let matchedAny = false;
            for (const right of rightRows) {
              const candidateMap = new Map(entry.joined);
              candidateMap.set(join.table, right);
              if (evalCondition(join.on, entry.base, candidateMap)) {
                nextEntries.push({ base: entry.base, joined: candidateMap });
                matchedAny = true;
              }
            }
            if (!matchedAny && join.type === "left") {
              nextEntries.push(entry);
            }
          }
          entries = nextEntries;
        }

        if (this._where) {
          entries = entries.filter((e) => evalCondition(this._where, e.base, e.joined));
        }

        if (this._groupBy && entries.length === 0) {
          return [];
        }

        if (fields && ("count" in fields || "total" in fields)) {
          return [{ count: entries.length, total: entries.length }];
        }

        if (this._orderBy.length > 0) {
          entries = [...entries].sort((a, b) => {
            for (const ord of this._orderBy) {
              const chunks: any[] = ord?.queryChunks;
              if (!Array.isArray(chunks)) continue;
              const col = chunks.find((c) => isColumn(c));
              if (!col) continue;
              const dirText = getSqlText(chunks);
              const direction: "asc" | "desc" = dirText.includes("desc") ? "desc" : "asc";
              const cmp = compareValues(
                getColValue(a.base, col, a.joined),
                getColValue(b.base, col, b.joined),
                direction,
              );
              if (cmp !== 0) return cmp;
            }
            return 0;
          });
        }

        const start = this._offset ?? 0;
        const end = this._limit !== undefined ? start + this._limit : undefined;
        const sliced = entries.slice(start, end);

        if (fields) {
          return sliced.map((e) => projectFields(fields, e.base, e.joined));
        }
        return sliced.map((e) => e.base);
      });
    },
    insert(table: unknown) {
      return makeThenable(function (this: any) {
        const rows = getRows(table);
        const list = Array.isArray(this._values) ? this._values : [this._values];
        const inserted = list.map((item: any, idx: number) => ({
          id: item?.id ?? `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...item,
        }));
        rows.push(...inserted);
        if (!tables.has(table)) tables.set(table, rows);
        return this._returning ? inserted : [];
      });
    },
    update(table: unknown) {
      return makeThenable(function (this: any) {
        const rows = getRows(table);
        const matched = this._where
          ? rows.filter((r) => evalCondition(this._where, r))
          : rows;
        if (this._values) {
          for (const row of matched) {
            Object.assign(row, this._values, { updatedAt: new Date() });
          }
        }
        return this._returning ? matched : [];
      });
    },
    delete(table: unknown) {
      return makeThenable(function (this: any) {
        const rows = getRows(table);
        if (!this._where) {
          const removed = [...rows];
          rows.length = 0;
          return this._returning ? removed : [];
        }
        const kept: StoreRow[] = [];
        const removed: StoreRow[] = [];
        for (const r of rows) {
          if (evalCondition(this._where, r)) {
            removed.push(r);
          } else {
            kept.push(r);
          }
        }
        tables.set(table, kept);
        return this._returning ? removed : [];
      });
    },
    execute: async () => ({ rows: [] }),
    transaction: async (fn: (tx: any) => Promise<any>) => fn(mockDb),
  };

  return mockDb;
}

const fallbackPool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
  end: async () => {},
} as unknown as pg.Pool;

let pool: pg.Pool = fallbackPool;
let db: ReturnType<typeof drizzle<typeof schema>>;

if (!process.env.DATABASE_URL) {
  console.warn("[AI Studio] DATABASE_URL not set — using in-memory mock");
  db = createMockDb();
} else {
  const realPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 1500,
  });
  realPool.on("error", () => {});
  const realDb = drizzle(realPool, { schema });
  let mockDbInstance: any = null;
  let activeDb: any = null;

  const resolveActiveDb = (() => {
    let pending: Promise<any> | null = null;
    return () => {
      if (activeDb) return Promise.resolve(activeDb);
      if (!pending) {
        pending = realPool
          .query("SELECT 1")
          .then(() => {
            pool = realPool;
            activeDb = realDb;
            return activeDb;
          })
          .catch(() => {
            console.warn("[AI Studio] Database unreachable — using in-memory mock");
            realPool.end().catch(() => {});
            pool = fallbackPool;
            mockDbInstance = createMockDb();
            activeDb = mockDbInstance;
            return activeDb;
          });
      }
      return pending;
    };
  })();

  const wrapQueryBuilder = (rootMethod: string, rootArgs: any[]) => {
    const calls: Array<{ method: string; args: any[] }> = [];
    const proxy: any = {
      then(onFulfilled: any, onRejected: any) {
        return resolveActiveDb()
          .then((target) => {
            let q = target[rootMethod](...rootArgs);
            for (const c of calls) {
              if (typeof q?.[c.method] === "function") {
                q = q[c.method](...c.args);
              }
            }
            return q;
          })
          .then(onFulfilled, onRejected);
      },
      catch(onRejected: any) {
        return proxy.then(undefined, onRejected);
      },
    };
    const wrapper: any = new Proxy(proxy, {
      get(target, prop) {
        if (prop === "then" || prop === "catch") return target[prop];
        return (...args: any[]) => {
          calls.push({ method: String(prop), args });
          return wrapper;
        };
      },
    });
    return wrapper;
  };

  db = {
    select: (...args: any[]) => wrapQueryBuilder("select", args),
    insert: (...args: any[]) => wrapQueryBuilder("insert", args),
    update: (...args: any[]) => wrapQueryBuilder("update", args),
    delete: (...args: any[]) => wrapQueryBuilder("delete", args),
    execute: (...args: any[]) =>
      resolveActiveDb().then((target) => target.execute(...args)),
    transaction: (fn: (tx: any) => Promise<any>) =>
      resolveActiveDb().then((target) => target.transaction(fn)),
  } as unknown as ReturnType<typeof drizzle<typeof schema>>;
}

export { pool, db };
export * from "./schema";
