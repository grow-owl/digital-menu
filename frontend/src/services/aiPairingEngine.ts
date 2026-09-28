import { MenuItem } from '../types/menu.types';

export interface AIPairingAddon {
  id: string;
  name: string;
  price: number;
  reason?: string;
  isPopular?: boolean;
}

export interface AIPairingItem {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  badge?: string;
}

export interface SpendMoreRewardOption {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
}

export interface SpendMoreTier {
  target: number;
  reward: string;
  tierLevel: 1 | 2 | 3;
  rewardOptions: SpendMoreRewardOption[];
  percent: number;
  amountNeeded: number;
  isUnlocked: boolean;
  nextTier?: { target: number; reward: string };
  quickBoosters: { id: number; name: string; price: number; imageUrl: string }[];
}

/**
 * Expanded Universal Popular Add-ons added to every dish selection
 */
export const POPULAR_UNIVERSAL_ADDONS: AIPairingAddon[] = [
  { id: 'add-chai-biscuit', name: 'Handmade Chai Biscuits (2 pcs)', price: 20, reason: 'Chai Dipping Classic', isPopular: true },
  { id: 'add-bun-maska', name: 'Warm Bun Maska Slice', price: 35, reason: 'Buttered Cafe Classic', isPopular: true },
  { id: 'add-cheese-slice', name: 'Melted Amul Cheese Slice', price: 25, reason: 'Gooey Melt', isPopular: true },
  { id: 'add-dalle-chutney', name: 'Darjeeling Dalle Chilli Dip', price: 20, reason: 'Fiery Himalayan Kick', isPopular: true },
  { id: 'add-garlic-mayo', name: 'House Garlic Mayo Dip', price: 20, reason: 'Creamy Dip', isPopular: true },
  { id: 'add-vanilla-scoop', name: 'Vanilla Ice Cream Scoop', price: 35, reason: 'Sweet Float', isPopular: true },
];

/**
 * Dynamic Per-Dish AI Add-on Generator for Siliguri's Chai Addaa
 */
export const getSmartAddonsForDish = (dish: MenuItem): AIPairingAddon[] => {
  const name = (dish.name || '').toLowerCase();
  const category = (dish.categoryName || '').toLowerCase();

  let specificAddons: AIPairingAddon[] = [];

  // 1. Chai & Artisan Teas & Coffees
  if (
    category.includes('chai') ||
    category.includes('tea') ||
    category.includes('coffee') ||
    name.includes('tea') ||
    name.includes('chai') ||
    name.includes('coffee') ||
    name.includes('cappuccino') ||
    name.includes('espresso') ||
    name.includes('americano')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-biscuits`, name: 'Handmade Chai Biscuits (2 pcs)', price: 20, reason: 'Chai Dipping Classic' },
      { id: `add-${dish.id}-ginger-elaichi`, name: 'Fresh Crushed Ginger & Elaichi', price: 15, reason: 'Aromatic Infusion' },
      { id: `add-${dish.id}-bun-maska`, name: 'Warm Bun Maska Slice', price: 35, reason: 'Traditional Cafe Pairing' },
      { id: `add-${dish.id}-honey`, name: 'Pure Honey Drizzle', price: 20, reason: 'Natural Sweetener' },
    ];
  }
  // 2. Boba Teas, Shakes & Cold Refreshers
  else if (
    category.includes('boba') ||
    category.includes('refresher') ||
    category.includes('shake') ||
    name.includes('boba') ||
    name.includes('shake') ||
    name.includes('mojito') ||
    name.includes('soda') ||
    name.includes('lassi')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-boba`, name: 'Extra Tapioca Boba Pearls', price: 30, reason: 'Chewy & Sweet' },
      { id: `add-${dish.id}-icecream`, name: 'Vanilla Ice Cream Scoop', price: 35, reason: 'Creamy Float' },
      { id: `add-${dish.id}-choco-drizzle`, name: 'Rich Chocolate Drizzle', price: 20, reason: 'Sweet Topping' },
    ];
  }
  // 3. Momos (Steamed, Fried, Kurkure)
  else if (category.includes('momo') || name.includes('momo')) {
    specificAddons = [
      { id: `add-${dish.id}-dalle-dip`, name: 'Spicy Darjeeling Dalle Chilli Dip', price: 20, reason: 'Fiery Himalayan Kick' },
      { id: `add-${dish.id}-garlic-mayo`, name: 'Creamy Garlic Mayo Dip', price: 25, reason: 'Cooling Dip' },
      { id: `add-${dish.id}-momo-soup`, name: 'Warm Clear Momo Soup Bowl', price: 30, reason: 'Comfort Broth' },
    ];
  }
  // 4. Burgers, Sandwiches, Quick Bites & Fries
  else if (
    category.includes('burger') ||
    category.includes('sandwich') ||
    category.includes('quick bite') ||
    category.includes('fries') ||
    name.includes('burger') ||
    name.includes('sandwich') ||
    name.includes('fries') ||
    name.includes('spring roll')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-cheese-slice`, name: 'Melted Amul Cheese Slice', price: 25, reason: 'Gooey Melt' },
      { id: `add-${dish.id}-peri-peri`, name: 'Peri Peri Seasoning Shake', price: 15, reason: 'Zesty Kick' },
      { id: `add-${dish.id}-garlic-dip`, name: 'Signature House Mayo Dip', price: 20, reason: 'Creamy Sauce' },
    ];
  }
  // 5. Maggi & Noodles
  else if (
    category.includes('maggi') ||
    category.includes('noodle') ||
    name.includes('maggi') ||
    name.includes('wai wai') ||
    name.includes('hakka') ||
    name.includes('noodles')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-cheese-grated`, name: 'Grated Amul Cheese Topping', price: 30, reason: 'Cheesy Twist' },
      { id: `add-${dish.id}-egg`, name: 'Fried Sunny / Boiled Egg', price: 20, reason: 'Protein Boost' },
      { id: `add-${dish.id}-veggies`, name: 'Extra Veggie Toss', price: 20, reason: 'Fresh Crunch' },
    ];
  }
  // 6. Pastas
  else if (category.includes('pasta') || name.includes('pasta') || name.includes('arrabbiata') || name.includes('alfredo')) {
    specificAddons = [
      { id: `add-${dish.id}-garlic-toast`, name: 'Crispy Garlic Toast (2 pcs)', price: 35, reason: 'Crispy Bread' },
      { id: `add-${dish.id}-extra-cheese`, name: 'Extra Melted Mozzarella', price: 35, reason: 'Cheese Pull' },
      { id: `add-${dish.id}-herbs`, name: 'Herb & Chilli Flakes Toss', price: 15, reason: 'Aromatic Seasoning' },
    ];
  }
  // 7. Bakery & Desserts
  else if (category.includes('dessert') || category.includes('bakery') || name.includes('brownie') || name.includes('cheesecake') || name.includes('cake')) {
    specificAddons = [
      { id: `add-${dish.id}-vanilla-gelato`, name: 'Vanilla Ice Cream Scoop', price: 35, reason: 'Hot & Cold Contrast' },
      { id: `add-${dish.id}-choco-fudge`, name: 'Warm Chocolate Fudge Drizzle', price: 25, reason: 'Decadent Cocoa' },
    ];
  }
  // 8. General Cafe Default
  else {
    specificAddons = [
      { id: `add-${dish.id}-biscuits`, name: 'Handmade Chai Biscuits (2 pcs)', price: 20, reason: 'Chai Dipping Classic' },
      { id: `add-${dish.id}-bun-maska`, name: 'Warm Bun Maska Slice', price: 35, reason: 'Traditional Cafe Pairing' },
      { id: `add-${dish.id}-cheese-slice`, name: 'Melted Amul Cheese Slice', price: 25, reason: 'Gooey Melt' },
    ];
  }

  // Cap to 4 relevant pairings for clear, un-cluttered display on mobile
  return specificAddons.slice(0, 4);
};

/**
 * Spend-More Gamified Tiered Discount & Freebie Calculator
 */
export const getSpendMoreProgress = (subtotal: number): SpendMoreTier => {
  const TIER_1_OPTIONS: SpendMoreRewardOption[] = [
    {
      id: 9902,
      name: 'Wood-Fired Garlic Butter Naan (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
      description: 'Clay-oven naan brushed with garlic herb butter (Save ₹90)',
    },
    {
      id: 9903,
      name: 'Chilled Coca-Cola 330ml (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      description: 'Ice-cold classic Coca-Cola can (Save ₹60)',
    },
  ];

  const TIER_2_OPTIONS: SpendMoreRewardOption[] = [
    {
      id: 9904,
      name: 'Fresh Mint Lime Soda (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
      description: 'Sparkling mint lime mocktail (Save ₹85)',
    },
    {
      id: 9906,
      name: 'Artisanal Truffle Butter Dip (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=400&q=80',
      description: 'Rich French black truffle butter dip (Save ₹65)',
    },
  ];

  const TIER_3_OPTIONS: SpendMoreRewardOption[] = [
    {
      id: 9907,
      name: 'Valrhona Chocolate Lava Cake (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
      description: 'Warm molten Belgian chocolate lava cake (Save ₹220)',
    },
    {
      id: 9908,
      name: 'Madagascar Vanilla Gelato (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
      description: 'Slow-churned Bourbon vanilla gelato (Save ₹140)',
    },
  ];

  const QUICK_BOOSTERS = [
    { id: 201, name: 'Chilled Coca-Cola', price: 60, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80' },
    { id: 202, name: 'Extra Melted Cheese', price: 75, imageUrl: 'https://images.unsplash.com/photo-1552590635-27c2c2128abf?auto=format&fit=crop&w=200&q=80' },
    { id: 203, name: 'Garlic Butter Naan', price: 90, imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=200&q=80' },
    { id: 204, name: 'Fresh Mint Lime Soda', price: 85, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80' },
    { id: 205, name: 'Garlic Mayo Dip', price: 45, imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=200&q=80' },
    { id: 206, name: 'Truffle Fries Side', price: 180, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=200&q=80' },
  ];

  if (subtotal >= 2000) {
    return {
      target: 2000,
      reward: '👑 TIER 3 VIP: Free Valrhona Lava Cake or Gelato (Save ₹220)',
      tierLevel: 3,
      rewardOptions: TIER_3_OPTIONS,
      percent: 100,
      amountNeeded: 0,
      isUnlocked: true,
      quickBoosters: QUICK_BOOSTERS,
    };
  }

  if (subtotal >= 1000) {
    return {
      target: 1000,
      reward: '🍹 TIER 2: Free Mint Lime Soda or Truffle Dip (Save ₹85)',
      tierLevel: 2,
      rewardOptions: TIER_2_OPTIONS,
      percent: 100,
      amountNeeded: 2000 - subtotal,
      isUnlocked: true,
      nextTier: { target: 2000, reward: 'Valrhona Chocolate Lava Cake (₹220)' },
      quickBoosters: QUICK_BOOSTERS,
    };
  }

  if (subtotal >= 500) {
    return {
      target: 500,
      reward: '🫓 TIER 1: Free Garlic Butter Naan or Coca-Cola (Save ₹90)',
      tierLevel: 1,
      rewardOptions: TIER_1_OPTIONS,
      percent: 100,
      amountNeeded: 1000 - subtotal,
      isUnlocked: true,
      nextTier: { target: 1000, reward: 'Fresh Mint Lime Soda (₹85)' },
      quickBoosters: QUICK_BOOSTERS,
    };
  }

  return {
    target: 500,
    reward: 'Free Garlic Naan / Drink (Save ₹90)',
    tierLevel: 1,
    rewardOptions: TIER_1_OPTIONS,
    percent: Math.min(100, Math.round((subtotal / 500) * 100)),
    amountNeeded: 500 - subtotal,
    isUnlocked: false,
    nextTier: { target: 500, reward: 'Free Garlic Naan / Drink (₹90)' },
    quickBoosters: QUICK_BOOSTERS,
  };
};

/**
 * Expanded AI Recommended Pairings for Cart & Menu Detail Modals
 */
export const AI_RECOMMENDED_PAIRINGS: AIPairingItem[] = [
  {
    id: 1,
    name: 'Masala Tea',
    price: 40,
    description: 'A hot glass of milk tea, rich with visible whole spices and aromatics.',
    category: 'Chai & Hot Teas',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    badge: 'Adda Bestseller',
  },
  {
    id: 20,
    name: 'Peri Peri Fries',
    price: 90,
    description: 'French fries dusted with fiery, zesty peri peri spice seasoning.',
    category: 'Crispy Fries & Appetisers',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    badge: 'Crispy Favorite',
  },
  {
    id: 7,
    name: 'Cold Coffee',
    price: 120,
    description: 'A frosted glass of thick blended cold coffee topped with cocoa powder.',
    category: 'Coffee & Brews',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    badge: 'Cafe Bestseller',
  },
  {
    id: 27,
    name: 'Kala Khatta',
    price: 80,
    description: 'Tangy, sweet, and spiced blackberry cooler served over crushed ice.',
    category: 'Coolers & Traditional Lassi',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    badge: 'Local Special',
  },
  {
    id: 5,
    name: 'Peach Ice Tea',
    price: 150,
    description: 'A tall, condensation-covered glass of iced tea with peach slices.',
    category: 'Chai & Hot Teas',
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80',
    badge: 'Cool Refresher',
  },
  {
    id: 14,
    name: 'Oreo Blast Milkshake',
    price: 130,
    description: 'Thick creamy milkshake blended with Oreo cookies and chocolate drizzle.',
    category: 'Matcha, Boba & Shakes',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    badge: 'Sweet Finish',
  },
  {
    id: 31,
    name: 'Vanilla Ice Cream',
    price: 50,
    description: 'Classic velvety vanilla ice cream served in a glass dessert cup.',
    category: 'Desserts & Ice Cream',
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80',
    badge: 'Dessert',
  },
  {
    id: 19,
    name: 'Salted Classic French Fries',
    price: 80,
    description: 'Crispy skin-on french fries seasoned with fine sea salt.',
    category: 'Crispy Fries & Appetisers',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    badge: 'Quick Snack',
  },
];
