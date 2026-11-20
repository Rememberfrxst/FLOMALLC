export type MenuTag = "NEW" | "HOT";

export interface MenuSubLink {
  label: string;
  category?: string;
  q?: string;
  sort?: string;
  title?: string;
}

export interface MenuGroup {
  title: string;
  tag?: MenuTag;
  category?: string;
  q?: string;
  sort?: string;
  items?: MenuSubLink[];
}

export interface TopNavMenu {
  key: "men" | "women" | "kids" | "beauty" | "home";
  label: string;
  category: string;
  title: string;
  categoriesColumns: MenuGroup[][];
  brandsColumns: MenuGroup[][];
}

export const AJIO_NAV_MENUS: TopNavMenu[] = [
  {
    key: "men",
    label: "MEN",
    category: "men",
    title: "Men",
    categoriesColumns: [
      [
        { title: "CLOTHING", category: "men" },
        { title: "FOOTWEAR", category: "footwear" },
        { title: "ACCESSORIES", category: "accessories" },
        {
          title: "ALL THATS NEW",
          category: "men",
          sort: "newest",
          items: [
            { label: "Clothing", category: "men", sort: "newest", title: "New in Men's Clothing" },
            { label: "Footwear", category: "footwear", sort: "newest", title: "New in Footwear" },
            { label: "Accessories", category: "accessories", sort: "newest", title: "New in Accessories" },
          ],
        },
        { title: "FLOMA GLOBAL", category: "men", sort: "popular" },
        { title: "PLUS SIZE", category: "men" },
        { title: "NIGHT & LOUNGEWEAR", category: "men" },
        { title: "GROOMING", tag: "NEW", category: "beauty" },
        {
          title: "WINTERWEAR",
          category: "men",
          items: [
            { label: "Blazers & Waistcoats", category: "men", title: "Blazers & Waistcoats" },
            { label: "Jackets & Coats", category: "men", q: "Jacket", title: "Jackets & Coats" },
            { label: "Sweaters & Cardigans", category: "men", title: "Sweaters & Cardigans" },
            { label: "Sweatshirts & Hoodie", category: "men", q: "Hoodie", title: "Sweatshirts & Hoodie" },
          ],
        },
      ],
      [
        {
          title: "WESTERN WEAR",
          category: "men",
          items: [
            { label: "Jeans", category: "men", title: "Men's Jeans" },
            { label: "Shirts", category: "men", title: "Men's Shirts" },
            { label: "Shorts & 3/4ths", category: "men", title: "Shorts & 3/4ths" },
            { label: "Suit Sets", category: "men", title: "Suit Sets" },
            { label: "Track Pants", category: "men", q: "Cargo", title: "Track & Utility Pants" },
            { label: "Tracksuits", category: "men", title: "Tracksuits" },
            { label: "Trousers & Pants", category: "men", q: "Cargo", title: "Trousers & Pants" },
            { label: "Tshirts", category: "men", q: "T-Shirt", title: "Men's T-Shirts" },
          ],
        },
        {
          title: "FOOTWEAR",
          category: "footwear",
          items: [
            { label: "Boots", category: "footwear", q: "Boots", title: "Boots" },
            { label: "Casual Shoes", category: "footwear", q: "Loafers", title: "Casual Shoes" },
            { label: "Flip Flops & Slippers", category: "footwear", q: "Slides", title: "Flip Flops & Slippers" },
            { label: "Formal Shoes", category: "footwear", q: "Loafers", title: "Formal Shoes" },
            { label: "Sandals", category: "footwear", title: "Sandals" },
            { label: "Sneakers", category: "footwear", q: "Sneakers", title: "Sneakers" },
            { label: "Sports Shoes", category: "footwear", q: "Running", title: "Sports Shoes" },
          ],
        },
      ],
      [
        {
          title: "ETHNIC WEAR",
          category: "men",
          items: [
            { label: "Ethnic Jackets", category: "men", title: "Ethnic Jackets" },
            { label: "Ethnic Suit Sets", category: "men", title: "Ethnic Suit Sets" },
            { label: "Kurtas", category: "men", title: "Men's Kurtas" },
            { label: "Pyjamas & Churidars", category: "men", title: "Pyjamas & Churidars" },
            { label: "Sherwani Sets", category: "men", title: "Sherwani Sets" },
            { label: "Stoles", category: "accessories", title: "Stoles" },
          ],
        },
        {
          title: "ACCESSORIES",
          category: "accessories",
          items: [
            { label: "Backpacks", category: "accessories", q: "Backpack", title: "Backpacks" },
            { label: "Belts", category: "accessories", title: "Belts" },
            { label: "Caps & Hats", category: "accessories", title: "Caps & Hats" },
            { label: "Luggage & Trolley Bags", category: "accessories", title: "Luggage & Bags" },
            { label: "Perfumes & Colognes", category: "beauty", q: "Parfum", title: "Perfumes & Colognes" },
            { label: "Socks", category: "accessories", title: "Socks" },
            { label: "Sunglasses", category: "accessories", q: "Sunglasses", title: "Sunglasses" },
            { label: "Wallets", category: "accessories", title: "Wallets" },
            { label: "Watches", category: "accessories", q: "Watch", title: "Watches" },
          ],
        },
      ],
      [
        {
          title: "INNERWEAR",
          category: "men",
          items: [
            { label: "Boxers", category: "men", title: "Boxers" },
            { label: "Briefs", category: "men", title: "Briefs" },
            { label: "Pyjamas", category: "men", title: "Pyjamas" },
            { label: "Thermal Wear", category: "men", title: "Thermal Wear" },
            { label: "Trunks", category: "men", title: "Trunks" },
          ],
        },
        {
          title: "JEWELLERY",
          category: "accessories",
          items: [
            { label: "Bracelets & Kadas", category: "accessories", title: "Bracelets & Kadas" },
            { label: "Chains", category: "accessories", title: "Chains" },
            { label: "Cufflinks & Tiepins", category: "accessories", title: "Cufflinks & Tiepins" },
            { label: "Earrings", category: "accessories", title: "Earrings" },
            { label: "Rings", category: "accessories", title: "Rings" },
          ],
        },
        {
          title: "GADGETS",
          category: "audio",
          items: [
            { label: "Smartphones", category: "smartphones", title: "Smartphones" },
            { label: "Fitness Gadgets", category: "smartphones", title: "Smart & Fitness Tech" },
            { label: "Headphones", category: "audio", q: "Headphones", title: "Headphones" },
            { label: "Speakers", category: "audio", q: "Speaker", title: "Speakers" },
          ],
        },
      ],
    ],
    brandsColumns: [
      [
        {
          title: "PREMIUM BRANDS",
          category: "men",
          items: [
            { label: "FLOMA STUDIO", category: "men", title: "FLOMA Studio" },
            { label: "ANDAMEN", category: "men", title: "Andamen Edit" },
            { label: "ARMANI EXCHANGE", category: "accessories", title: "Armani Exchange" },
            { label: "BROOKS BROTHERS", category: "men", title: "Brooks Brothers" },
            { label: "GAP", category: "men", title: "GAP Men" },
            { label: "SUPERDRY", category: "men", title: "Superdry" },
            { label: "TOMMY HILFIGER", category: "men", title: "Tommy Hilfiger" },
          ],
        },
      ],
      [
        {
          title: "WESTERN WEAR",
          category: "men",
          items: [
            { label: "ALLEN SOLLY", category: "men", title: "Allen Solly" },
            { label: "ARROW", category: "men", title: "Arrow" },
            { label: "LEVIS", category: "men", title: "Levis" },
            { label: "LOUIS PHILIPPE", category: "men", title: "Louis Philippe" },
            { label: "RARE RABBIT", category: "men", title: "Rare Rabbit" },
            { label: "SNITCH", category: "men", title: "Snitch" },
            { label: "SPYKAR", category: "men", title: "Spykar" },
            { label: "U.S. POLO ASSN.", category: "men", title: "U.S. Polo Assn." },
          ],
        },
      ],
      [
        {
          title: "EXCLUSIVE BRANDS",
          category: "men",
          items: [
            { label: "FLOMA BASICS", category: "men", title: "FLOMA Basics" },
            { label: "DNMX", category: "men", title: "DNMX" },
            { label: "JOHN PLAYERS", category: "men", title: "John Players" },
            { label: "NETPLAY", category: "men", title: "Netplay" },
            { label: "TEAMSPIRIT", category: "men", title: "Teamspirit" },
            { label: "INDIE PICKS", category: "men", title: "Indie Picks" },
          ],
        },
      ],
      [
        {
          title: "FOOTWEAR",
          category: "footwear",
          items: [
            { label: "ADIDAS", category: "footwear", title: "Adidas" },
            { label: "ASICS", category: "footwear", title: "Asics" },
            { label: "CLARKS", category: "footwear", title: "Clarks" },
            { label: "NEW BALANCE", category: "footwear", title: "New Balance" },
            { label: "NIKE", category: "footwear", title: "Nike" },
            { label: "PUMA", category: "footwear", title: "Puma" },
            { label: "SKECHERS", category: "footwear", title: "Skechers" },
          ],
        },
      ],
      [
        {
          title: "ACCESSORIES",
          category: "accessories",
          items: [
            { label: "CASIO", category: "accessories", title: "Casio" },
            { label: "FOSSIL", category: "accessories", title: "Fossil" },
            { label: "GUESS", category: "accessories", title: "Guess" },
            { label: "TITAN", category: "accessories", title: "Titan" },
            { label: "SONY AUDIO", category: "audio", title: "Sony Audio" },
          ],
        },
      ],
    ],
  },
  {
    key: "women",
    label: "WOMEN",
    category: "women",
    title: "Women",
    categoriesColumns: [
      [
        { title: "CLOTHING", category: "women" },
        { title: "FOOTWEAR", category: "footwear" },
        { title: "ACCESSORIES", category: "accessories" },
        {
          title: "ALL THATS NEW",
          category: "women",
          sort: "newest",
          items: [
            { label: "Clothing", category: "women", sort: "newest", title: "New in Women's Clothing" },
            { label: "Footwear", category: "footwear", sort: "newest", title: "New in Footwear" },
            { label: "Accessories", category: "accessories", sort: "newest", title: "New in Accessories" },
          ],
        },
        { title: "FLOMA GLOBAL", category: "women", sort: "popular" },
        { title: "CURVE SIZE", category: "women" },
        { title: "NIGHT & LOUNGEWEAR", category: "women" },
        { title: "BEAUTY", tag: "NEW", category: "beauty" },
        { title: "ATHLEISURE", category: "women" },
        {
          title: "WINTERWEAR",
          category: "women",
          items: [
            { label: "Blazers & Waistcoats", category: "women", title: "Blazers & Waistcoats" },
            { label: "Jackets & Coats", category: "women", title: "Jackets & Coats" },
            { label: "Sweaters & Cardigans", category: "women", q: "Cardigan", title: "Sweaters & Cardigans" },
            { label: "Sweatshirts & Hoodies", category: "women", title: "Sweatshirts & Hoodies" },
          ],
        },
      ],
      [
        {
          title: "WESTERN WEAR",
          category: "women",
          items: [
            { label: "Dresses", category: "women", q: "Dress", title: "Women's Dresses" },
            { label: "Jeans & Jeggings", category: "women", q: "Jeans", title: "Jeans & Jeggings" },
            { label: "Tops", category: "women", q: "Top", title: "Women's Tops" },
            { label: "Trousers & Pants", category: "women", title: "Trousers & Pants" },
            { label: "Tshirts", category: "women", title: "Women's T-Shirts" },
            { label: "Track Pants", category: "women", title: "Track Pants" },
            { label: "Shirts", category: "women", title: "Women's Shirts" },
            { label: "Leggings", category: "women", title: "Leggings" },
            { label: "Co-ord Sets", category: "women", q: "Co-ord", title: "Co-ord Sets" },
          ],
        },
      ],
      [
        {
          title: "ETHNIC WEAR",
          category: "women",
          items: [
            { label: "Co-ord Sets", category: "women", q: "Co-ord", title: "Ethnic Co-ord Sets" },
            { label: "Dresses & Gowns", category: "women", q: "Dress", title: "Dresses & Gowns" },
            { label: "Kurta Suit Sets", category: "women", title: "Kurta Suit Sets" },
            { label: "Kurta-Bottom Set", category: "women", title: "Kurta-Bottom Set" },
            { label: "Kurtas", category: "women", title: "Kurtas" },
            { label: "Kurtis & Tunics", category: "women", title: "Kurtis & Tunics" },
            { label: "Lehenga Choli Sets", category: "women", title: "Lehenga Choli Sets" },
            { label: "Salwars & Churidars", category: "women", title: "Salwars & Churidars" },
            { label: "Sarees", category: "women", title: "Sarees" },
          ],
        },
      ],
      [
        {
          title: "FOOTWEAR",
          category: "footwear",
          items: [
            { label: "Boots", category: "footwear", q: "Boots", title: "Boots" },
            { label: "Casual Shoes", category: "footwear", title: "Casual Shoes" },
            { label: "Flip Flops & Slippers", category: "footwear", q: "Slides", title: "Flip Flops & Slippers" },
            { label: "Sandals", category: "footwear", title: "Sandals" },
            { label: "Sneakers", category: "footwear", q: "Sneakers", title: "Sneakers" },
            { label: "Sports Shoes", category: "footwear", q: "Running", title: "Sports Shoes" },
          ],
        },
        {
          title: "JEWELLERY",
          category: "accessories",
          items: [
            { label: "Gold & Silver Coins", category: "accessories", title: "Gold & Silver Coins" },
            { label: "Fashion Jewellery", category: "accessories", title: "Fashion Jewellery" },
            { label: "Silver Jewellery", category: "accessories", title: "Silver Jewellery" },
          ],
        },
      ],
      [
        {
          title: "ACCESSORIES",
          category: "accessories",
          items: [
            { label: "Backpacks", category: "accessories", q: "Backpack", title: "Backpacks" },
            { label: "Belts", category: "accessories", title: "Belts" },
            { label: "Clutches & Wristlets", category: "accessories", title: "Clutches & Wristlets" },
            { label: "Handbags", category: "accessories", q: "Bag", title: "Handbags & Crossbody" },
            { label: "Sunglasses", category: "accessories", q: "Sunglasses", title: "Sunglasses" },
            { label: "Wallets", category: "accessories", title: "Wallets" },
            { label: "Watches", category: "accessories", q: "Watch", title: "Watches" },
          ],
        },
        {
          title: "LINGERIE & INNERWEAR",
          category: "women",
          items: [
            { label: "Night & Lounge Wear Sets", category: "women", title: "Night & Lounge Wear" },
            { label: "Pyjamas & Shorts", category: "women", title: "Pyjamas & Shorts" },
            { label: "Shapewear", category: "women", title: "Shapewear" },
            { label: "Thermal Wear", category: "women", title: "Thermal Wear" },
          ],
        },
      ],
    ],
    brandsColumns: [
      [
        {
          title: "PREMIUM BRANDS",
          category: "women",
          items: [
            { label: "FLOMA STUDIO", category: "women", title: "FLOMA Studio" },
            { label: "ALDO", category: "footwear", title: "Aldo" },
            { label: "FOREVER NEW", category: "women", title: "Forever New" },
            { label: "GUESS", category: "accessories", title: "Guess" },
            { label: "MARKS & SPENCER", category: "women", title: "Marks & Spencer" },
            { label: "STEVE MADDEN", category: "footwear", title: "Steve Madden" },
          ],
        },
      ],
      [
        {
          title: "WESTERN WEAR",
          category: "women",
          items: [
            { label: "DNMX", category: "women", title: "DNMX" },
            { label: "FIG", category: "women", title: "FIG" },
            { label: "KOTTY", category: "women", title: "Kotty" },
            { label: "LEVIS", category: "women", title: "Levis" },
            { label: "ONLY", category: "women", title: "ONLY" },
            { label: "RIO", category: "women", title: "RIO" },
            { label: "VERO MODA", category: "women", title: "Vero Moda" },
          ],
        },
      ],
      [
        {
          title: "ETHNICWEAR",
          category: "women",
          items: [
            { label: "AVAASA MIX N MATCH", category: "women", title: "Avaasa" },
            { label: "BIBA", category: "women", title: "Biba" },
            { label: "FUSION", category: "women", title: "Fusion" },
            { label: "GULMOHAR JAIPUR", category: "women", title: "Gulmohar Jaipur" },
            { label: "SOCH", category: "women", title: "Soch" },
            { label: "W", category: "women", title: "W Woman" },
          ],
        },
      ],
      [
        {
          title: "EXCLUSIVE BRANDS",
          category: "women",
          items: [
            { label: "FLOMA BASICS", category: "women", title: "FLOMA Basics" },
            { label: "ASOS DESIGN", category: "women", title: "ASOS Design" },
            { label: "INDIE PICKS", category: "women", title: "Indie Picks" },
            { label: "NYRIKA", category: "women", title: "Nyrika" },
            { label: "SHEIN", category: "women", title: "Shein" },
            { label: "YOUSTA", category: "women", title: "Yousta" },
          ],
        },
      ],
    ],
  },
  {
    key: "kids",
    label: "KIDS",
    category: "footwear",
    title: "Kids & Youth",
    categoriesColumns: [
      [
        { title: "CLOTHING", category: "men" },
        { title: "FOOTWEAR", category: "footwear" },
        { title: "ACCESSORIES", category: "accessories" },
        {
          title: "ALL THATS NEW",
          category: "men",
          sort: "newest",
          items: [
            { label: "Clothing", category: "men", sort: "newest", title: "Kids New Clothing" },
            { label: "Footwear", category: "footwear", sort: "newest", title: "Kids New Footwear" },
            { label: "Accessories", category: "accessories", sort: "newest", title: "Kids New Accessories" },
          ],
        },
        {
          title: "SHOP BY AGE",
          category: "men",
          items: [
            { label: "0 to 2 Years", category: "men", title: "0 to 2 Years" },
            { label: "3 to 5 Years", category: "men", title: "3 to 5 Years" },
            { label: "6 to 8 Years", category: "women", title: "6 to 8 Years" },
            { label: "9 to 12 Years", category: "women", title: "9 to 12 Years" },
            { label: "12 Years & Above", category: "men", title: "Teens & Youth" },
          ],
        },
      ],
      [
        {
          title: "WINTERWEAR",
          category: "men",
          items: [
            { label: "Jackets & Coats", category: "men", q: "Jacket", title: "Jackets & Coats" },
            { label: "Sweaters & Cardigans", category: "women", q: "Cardigan", title: "Sweaters & Cardigans" },
            { label: "Sweatshirts & Hoodie", category: "men", q: "Hoodie", title: "Sweatshirts & Hoodie" },
          ],
        },
        {
          title: "BOYS",
          category: "men",
          items: [
            { label: "Jeans", category: "men", title: "Boys Jeans" },
            { label: "Shirts", category: "men", title: "Boys Shirts" },
            { label: "Track Pants", category: "men", title: "Boys Track Pants" },
            { label: "Tshirts", category: "men", q: "T-Shirt", title: "Boys T-Shirts" },
          ],
        },
      ],
      [
        {
          title: "GIRLS",
          category: "women",
          items: [
            { label: "Dresses & Frocks", category: "women", q: "Dress", title: "Dresses & Frocks" },
            { label: "Jeans & Jeggings", category: "women", q: "Jeans", title: "Jeans & Jeggings" },
            { label: "Tops & Tunics", category: "women", q: "Top", title: "Tops & Tunics" },
            { label: "Tshirts", category: "women", title: "Girls T-Shirts" },
          ],
        },
        {
          title: "INFANTS",
          category: "women",
          items: [
            { label: "2 Piece-Sets", category: "women", q: "Co-ord", title: "2 Piece Sets" },
            { label: "Rompers & Onesies", category: "women", title: "Rompers & Onesies" },
            { label: "Winterwear", category: "women", title: "Infant Winterwear" },
          ],
        },
      ],
      [
        {
          title: "FOOTWEAR",
          category: "footwear",
          items: [
            { label: "Shoes", category: "footwear", title: "Kids Shoes" },
            { label: "Sneakers", category: "footwear", q: "Sneakers", title: "Kids Sneakers" },
            { label: "Casual Shoes", category: "footwear", title: "Casual Shoes" },
            { label: "Flip Flops & Slippers", category: "footwear", q: "Slides", title: "Flip Flops & Slippers" },
          ],
        },
        {
          title: "ACCESSORIES",
          category: "accessories",
          items: [
            { label: "Backpacks", category: "accessories", q: "Backpack", title: "School Backpacks" },
            { label: "Sunglasses & Watches", category: "accessories", title: "Kids Accessories" },
          ],
        },
      ],
    ],
    brandsColumns: [
      [
        {
          title: "FEATURED BRANDS",
          category: "footwear",
          items: [
            { label: "ADIDAS KIDS", category: "footwear", title: "Adidas Kids" },
            { label: "GAP KIDS", category: "men", title: "GAP Kids" },
            { label: "HOPSCOTCH", category: "women", title: "Hopscotch" },
            { label: "MAX", category: "women", title: "MAX Kids" },
            { label: "U.S. POLO ASSN.", category: "men", title: "U.S. Polo Assn." },
          ],
        },
      ],
      [
        {
          title: "FLOMA EXCLUSIVES",
          category: "men",
          items: [
            { label: "KB TEAM SPIRIT", category: "men", title: "KB Team Spirit" },
            { label: "KG FRENDZ", category: "women", title: "KG Frendz" },
            { label: "RIO GIRLS", category: "women", title: "Rio Girls" },
            { label: "YB DNMX", category: "men", title: "YB DNMX" },
            { label: "YOUSTA", category: "men", title: "Yousta" },
          ],
        },
      ],
    ],
  },
  {
    key: "beauty",
    label: "BEAUTY",
    category: "beauty",
    title: "Beauty",
    categoriesColumns: [
      [
        { title: "BEST SELLERS", category: "beauty", sort: "popular" },
        { title: "TRENDING", category: "beauty", sort: "popular" },
        { title: "WHATS NEW", category: "beauty", sort: "newest" },
        { title: "FLOMA LUXE", category: "beauty" },
        { title: "BABY CARE", category: "beauty" },
        { title: "APPLIANCES", category: "audio" },
        {
          title: "SKIN CARE",
          category: "beauty",
          items: [
            { label: "Cleanser", category: "beauty", title: "Cleansers" },
            { label: "Moisturisers", category: "beauty", title: "Moisturisers" },
            { label: "Serum", category: "beauty", q: "Serum", title: "Serums & Treatments" },
            { label: "Sunscreen", category: "beauty", title: "Sunscreen" },
            { label: "Face Wash", category: "beauty", title: "Face Wash" },
          ],
        },
      ],
      [
        {
          title: "MAKEUP",
          category: "beauty",
          items: [
            { label: "Lipstick", category: "beauty", q: "Lip", title: "Lipsticks" },
            { label: "Lip Gloss", category: "beauty", q: "Lip", title: "Lip Gloss" },
            { label: "Mascara", category: "beauty", title: "Mascara" },
            { label: "Eyeliner & Kajals", category: "beauty", title: "Eyeliner & Kajals" },
            { label: "Foundation", category: "beauty", title: "Foundation" },
            { label: "Concealer", category: "beauty", title: "Concealer" },
            { label: "Primer", category: "beauty", title: "Primer" },
            { label: "Nail Polish", category: "beauty", title: "Nail Polish" },
          ],
        },
      ],
      [
        {
          title: "HAIR CARE",
          category: "beauty",
          items: [
            { label: "Shampoo", category: "beauty", title: "Shampoo" },
            { label: "Conditioner", category: "beauty", title: "Conditioner" },
            { label: "Hair Oil", category: "beauty", title: "Hair Oil" },
            { label: "Hair Serum", category: "beauty", title: "Hair Serum" },
          ],
        },
        {
          title: "BATH & BODY",
          category: "beauty",
          items: [
            { label: "Body Wash", category: "beauty", title: "Body Wash" },
            { label: "Body Scrub", category: "beauty", title: "Body Scrub" },
            { label: "Body Lotion", category: "beauty", title: "Body Lotion" },
          ],
        },
        {
          title: "FRAGRANCES",
          category: "beauty",
          items: [
            { label: "Perfumes", category: "beauty", q: "Parfum", title: "Eau de Parfum" },
            { label: "Deodorants", category: "beauty", title: "Deodorants" },
            { label: "Spray Mist", category: "beauty", title: "Body Mists" },
          ],
        },
      ],
      [
        {
          title: "MEN GROOMING",
          category: "beauty",
          items: [
            { label: "Shaving Essentials", category: "beauty", title: "Shaving Essentials" },
            { label: "Beard Essentials", category: "beauty", title: "Beard Essentials" },
            { label: "Colognes", category: "beauty", q: "Parfum", title: "Men's Colognes" },
          ],
        },
        {
          title: "GIFTING SETS",
          category: "beauty",
          items: [
            { label: "Skincare Sets", category: "beauty", title: "Skincare Gift Sets" },
            { label: "Makeup Kits", category: "beauty", title: "Makeup Kits" },
          ],
        },
        { title: "WELLNESS & HYGIENE", category: "beauty" },
      ],
      [
        {
          title: "FEATURED BRANDS",
          category: "beauty",
          items: [
            { label: "FLOMA BOTANICALS", category: "beauty", title: "FLOMA Botanicals" },
            { label: "BEAUTY OF JOSEON", category: "beauty", title: "Beauty of Joseon" },
            { label: "CETAPHIL", category: "beauty", title: "Cetaphil" },
            { label: "COSRX", category: "beauty", title: "COSRX" },
            { label: "HUDA BEAUTY", category: "beauty", title: "Huda Beauty" },
            { label: "LAKME", category: "beauty", title: "Lakme" },
            { label: "M.A.C", category: "beauty", title: "M.A.C" },
            { label: "MINIMALIST", category: "beauty", title: "Minimalist" },
            { label: "THE ORDINARY", category: "beauty", title: "The Ordinary" },
          ],
        },
      ],
    ],
    brandsColumns: [
      [
        {
          title: "SKINCARE BRANDS",
          category: "beauty",
          items: [
            { label: "BEAUTY OF JOSEON", category: "beauty", title: "Beauty of Joseon" },
            { label: "CETAPHIL", category: "beauty", title: "Cetaphil" },
            { label: "MINIMALIST", category: "beauty", title: "Minimalist" },
            { label: "PLUM", category: "beauty", title: "Plum" },
            { label: "THE ORDINARY", category: "beauty", title: "The Ordinary" },
          ],
        },
      ],
      [
        {
          title: "MAKEUP & FRAGRANCE",
          category: "beauty",
          items: [
            { label: "FLOMA ATELIER", category: "beauty", title: "FLOMA Atelier" },
            { label: "HUDA BEAUTY", category: "beauty", title: "Huda Beauty" },
            { label: "LAKME", category: "beauty", title: "Lakme" },
            { label: "M.A.C", category: "beauty", title: "M.A.C" },
            { label: "MAYBELLINE NEW YORK", category: "beauty", title: "Maybelline" },
          ],
        },
      ],
      [
        {
          title: "GROOMING & TECH",
          category: "audio",
          items: [
            { label: "PHILIPS", category: "beauty", title: "Philips" },
            { label: "SAMSUNG TECH", category: "smartphones", title: "Galaxy Tech" },
            { label: "APPLE TECH", category: "smartphones", title: "Apple Tech" },
          ],
        },
      ],
    ],
  },
  {
    key: "home",
    label: "HOME & KITCHEN",
    category: "home-living",
    title: "Home & Living",
    categoriesColumns: [
      [
        {
          title: "BED LINEN",
          category: "home-living",
          items: [
            { label: "Bedsheets", category: "home-living", title: "Bedsheets" },
            { label: "Bedding Sets", category: "home-living", title: "Bedding Sets" },
            { label: "Blankets & Quilts", category: "home-living", title: "Blankets & Quilts" },
            { label: "Comforters", category: "home-living", title: "Comforters" },
          ],
        },
        {
          title: "CUSHIONS & PILLOWS",
          category: "home-living",
          items: [
            { label: "Cushions", category: "home-living", q: "Cushion", title: "Cushions" },
            { label: "Pillows", category: "home-living", title: "Pillows" },
            { label: "Cushion Covers", category: "home-living", q: "Cushion", title: "Cushion Covers" },
          ],
        },
        { title: "RUGS, CARPETS & MATS", category: "home-living" },
      ],
      [
        {
          title: "CURTAIN & ACCESSORIES",
          tag: "HOT",
          category: "home-living",
          items: [
            { label: "Window Curtains", category: "home-living", title: "Window Curtains" },
            { label: "Door Curtains", category: "home-living", title: "Door Curtains" },
          ],
        },
        {
          title: "KITCHEN",
          tag: "NEW",
          category: "home-living",
          items: [
            { label: "Cookware & Cutlery", category: "home-living", title: "Cookware & Cutlery" },
            { label: "Bakeware", category: "home-living", title: "Bakeware" },
            { label: "Kitchen Organisers", category: "home-living", title: "Kitchen Organisers" },
          ],
        },
        {
          title: "DINING",
          tag: "NEW",
          category: "home-living",
          items: [
            { label: "Serveware & Drinkware", category: "home-living", title: "Serveware & Drinkware" },
            { label: "Table Linen Sets", category: "home-living", title: "Table Linen Sets" },
          ],
        },
      ],
      [
        {
          title: "HOME DECOR",
          tag: "HOT",
          category: "home-living",
          items: [
            { label: "Table Lamps", category: "home-living", q: "Lamp", title: "Table Lamps" },
            { label: "Wall Decor", category: "home-living", title: "Wall Decor" },
            { label: "Clocks & Mirrors", category: "home-living", title: "Clocks & Mirrors" },
            { label: "Plants & Flowers", category: "home-living", title: "Plants & Planters" },
            { label: "Home Fragrances", category: "beauty", q: "Parfum", title: "Home Fragrances" },
          ],
        },
        {
          title: "SMART AUDIO & TECH",
          category: "audio",
          items: [
            { label: "Bluetooth Speakers", category: "audio", q: "Speaker", title: "Bluetooth Speakers" },
            { label: "Wireless Headphones", category: "audio", q: "Headphones", title: "Headphones" },
            { label: "Smartphones", category: "smartphones", title: "Smartphones" },
          ],
        },
      ],
      [
        {
          title: "BATH",
          category: "home-living",
          items: [
            { label: "Bath Towel & Robes", category: "home-living", title: "Bath Towels & Robes" },
            { label: "Towel Sets", category: "home-living", title: "Towel Sets" },
            { label: "Bath Mats", category: "home-living", title: "Bath Mats" },
          ],
        },
        { title: "HOME ESSENTIALS", category: "home-living" },
        {
          title: "FEATURED STORIES",
          category: "home-living",
          items: [
            { label: "Gifts Under ₹999", category: "home-living", sort: "price_asc", title: "Gifts Under ₹999" },
            { label: "Heritage Of India", category: "home-living", title: "Heritage Of India" },
          ],
        },
      ],
    ],
    brandsColumns: [
      [
        {
          title: "EXCLUSIVE BRANDS",
          category: "home-living",
          items: [
            { label: "FLOMA LIVING", category: "home-living", title: "FLOMA Living" },
            { label: "PORTICO", category: "home-living", title: "Portico" },
            { label: "HOME EXPRESSIONS", category: "home-living", title: "Home Expressions" },
            { label: "MUJI", category: "home-living", title: "Muji" },
            { label: "INDIE PICKS", category: "home-living", title: "Indie Picks" },
          ],
        },
      ],
      [
        {
          title: "FEATURED BRANDS",
          category: "home-living",
          items: [
            { label: "HOME CENTRE", category: "home-living", title: "Home Centre" },
            { label: "RAYMOND HOME", category: "home-living", title: "Raymond Home" },
            { label: "SPACES", category: "home-living", title: "Spaces" },
            { label: "TRIDENT", category: "home-living", title: "Trident" },
            { label: "D'DECOR", category: "home-living", title: "D'Decor" },
          ],
        },
      ],
      [
        {
          title: "SMART LIVING & AUDIO",
          category: "audio",
          items: [
            { label: "SONY", category: "audio", title: "Sony" },
            { label: "APPLE", category: "smartphones", title: "Apple" },
            { label: "SAMSUNG", category: "smartphones", title: "Samsung" },
            { label: "GOOGLE", category: "smartphones", title: "Google Pixel" },
          ],
        },
      ],
    ],
  },
];
