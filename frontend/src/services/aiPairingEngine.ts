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
 * Universal Mineral Water Add-on (Must be present on every food & beverage dish)
 */
export const MINERAL_WATER_ADDON: AIPairingAddon = {
  id: 'addon-mineral-water-10',
  name: 'Packaged Mineral Water (500ml)',
  price: 10,
  reason: 'Sealed 500ml Bottle',
  isPopular: true,
};

/**
 * Universal Popular Add-ons based strictly on Siliguri Chai Addaa real menu
 */
export const POPULAR_UNIVERSAL_ADDONS: AIPairingAddon[] = [
  MINERAL_WATER_ADDON,
  { id: 'add-classic-fries', name: 'Classic Salted Fries', price: 100, reason: 'Crispy Snack', isPopular: true },
  { id: 'add-veg-sandwich', name: 'Veg Cheese Sandwich', price: 100, reason: 'Toasted Cafe Classic', isPopular: true },
  { id: 'add-coke-sprite', name: 'Coke / Sprite (Chilled Can)', price: 50, reason: 'Chilled Drink', isPopular: true },
];

/**
 * Dynamic Per-Dish Add-on Generator for Siliguri's Chai Addaa
 * Strictly matches genuine physical menu items with exact prices and zero hallucinations.
 */
export const getSmartAddonsForDish = (dish: MenuItem): AIPairingAddon[] => {
  const name = (dish.name || '').toLowerCase();
  const category = (dish.categoryName || '').toLowerCase();
  const isDishMineralWater = name.includes('mineral water') || dish.id === 95;

  let specificAddons: AIPairingAddon[] = [];

  // 1. Milkshakes & Shakes (Matching physical menu: Ice Cream Add On ₹30)
  if (
    category.includes('shake') ||
    category.includes('boba') ||
    category.includes('matcha') ||
    name.includes('shake') ||
    name.includes('blast') ||
    name.includes('cream') ||
    name.includes('frappe')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-icecream`, name: 'Ice Cream Add-on', price: 30, reason: 'Make it even more indulgent!' },
    ];
  }
  // 2. Artisanal Pastas (Matching physical menu: Garlic Bread ₹59, Extra Cheese ₹49, Extra Chicken ₹79)
  else if (
    category.includes('pasta') ||
    name.includes('pasta') ||
    name.includes('arrabbiata') ||
    name.includes('alfredo')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-garlic-bread`, name: 'Garlic Bread (2 pcs)', price: 59, reason: 'Italian Classic' },
      { id: `add-${dish.id}-extra-cheese`, name: 'Extra Cheese', price: 49, reason: 'Melted Mozzarella' },
      { id: `add-${dish.id}-extra-chicken`, name: 'Extra Chicken', price: 79, reason: 'Seared Chicken Strips' },
    ];
  }
  // 3. Chai & Hot Teas & Coffees (Pair with Sandwiches, Burgers, Fries from actual menu)
  else if (
    category.includes('chai') ||
    category.includes('tea') ||
    category.includes('coffee') ||
    name.includes('tea') ||
    name.includes('chai') ||
    name.includes('coffee') ||
    name.includes('cappuccino') ||
    name.includes('latte') ||
    name.includes('espresso') ||
    name.includes('brew')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-salted-fries`, name: 'Classic Salted Fries', price: 100, reason: 'Crispy Snack' },
      { id: `add-${dish.id}-veg-sandwich`, name: 'Veg Cheese Sandwich', price: 100, reason: 'Toasted Cafe Classic' },
      { id: `add-${dish.id}-veg-burger`, name: 'Veg Cheese Burger', price: 100, reason: 'Hearty Bite' },
      { id: `add-${dish.id}-peri-fries`, name: 'Peri Peri Fries', price: 120, reason: 'Spicy & Crispy' },
    ];
  }
  // 4. Noodles & Fried Rice (Pair with Appetisers & Cold Drinks from actual menu)
  else if (
    category.includes('noodle') ||
    category.includes('rice') ||
    category.includes('chowmein') ||
    name.includes('chowmein') ||
    name.includes('noodle') ||
    name.includes('fried rice')
  ) {
    const isChickenDish = name.includes('chicken') || dish.isNonVeg;
    specificAddons = [
      { id: `add-${dish.id}-chilli-babycorn`, name: 'Crispy Chilli Babycorn', price: 160, reason: 'Hot Appetiser' },
      isChickenDish
        ? { id: `add-${dish.id}-chicken-nuggets`, name: 'Chicken Nuggets (8pcs)', price: 150, reason: 'Crispy Non-Veg' }
        : { id: `add-${dish.id}-cheese-nuggets`, name: 'Veg Cheese Corn Nuggets (8pcs)', price: 150, reason: 'Cheesy Bites' },
      { id: `add-${dish.id}-coke-sprite`, name: 'Coke / Sprite (Chilled Can)', price: 50, reason: 'Chilled Drink' },
      { id: `add-${dish.id}-masala-coke`, name: 'Masala Coke / Sprite', price: 70, reason: 'Spicy Cooler' },
    ];
  }
  // 5. Burgers & Sandwiches
  else if (
    category.includes('burger') ||
    category.includes('sandwich') ||
    name.includes('burger') ||
    name.includes('sandwich')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-peri-fries`, name: 'Peri Peri Fries', price: 120, reason: 'Signature Fries' },
      { id: `add-${dish.id}-coke-sprite`, name: 'Coke / Sprite (Chilled Can)', price: 50, reason: 'Chilled Drink' },
      { id: `add-${dish.id}-pizza-fingers`, name: 'Cheesy Pizza Fingers', price: 170, reason: 'Crunchy Bites' },
    ];
  }
  // 6. Crispy Fries & Appetisers
  else if (
    category.includes('fries') ||
    category.includes('appetiser') ||
    name.includes('fries') ||
    name.includes('nuggets') ||
    name.includes('paneer pops')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-coke-sprite`, name: 'Coke / Sprite (Chilled Can)', price: 50, reason: 'Chilled Drink' },
      { id: `add-${dish.id}-masala-coke`, name: 'Masala Coke / Sprite', price: 70, reason: 'Spicy Cooler' },
      { id: `add-${dish.id}-lime-soda`, name: 'Fresh Lime Soda', price: 60, reason: 'Sparkling Citrus' },
    ];
  }
  // 7. Desserts & Ice Cream
  else if (
    category.includes('dessert') ||
    category.includes('ice cream') ||
    name.includes('ice cream') ||
    name.includes('brownie')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-extra-scoop`, name: 'Extra Ice Cream Scoop', price: 30, reason: 'Double Indulgence' },
    ];
  }
  // 8. Coolers & Traditional Lassi
  else if (
    category.includes('cooler') ||
    category.includes('lassi') ||
    name.includes('lassi') ||
    name.includes('mojito') ||
    name.includes('soda')
  ) {
    specificAddons = [
      { id: `add-${dish.id}-salted-fries`, name: 'Classic Salted Fries', price: 100, reason: 'Crispy Snack' },
      { id: `add-${dish.id}-veg-sandwich`, name: 'Veg Cheese Sandwich', price: 100, reason: 'Cafe Classic' },
    ];
  }
  // 9. Chef's Specials & Tandoor
  else {
    specificAddons = [
      { id: `add-${dish.id}-coke-sprite`, name: 'Coke / Sprite (Chilled Can)', price: 50, reason: 'Chilled Drink' },
      { id: `add-${dish.id}-lime-soda`, name: 'Fresh Lime Soda', price: 60, reason: 'Sparkling Citrus' },
      { id: `add-${dish.id}-peri-fries`, name: 'Peri Peri Fries', price: 120, reason: 'Crispy Snack' },
    ];
  }

  // Prepend Packaged Mineral Water (+₹10) to every dish (except when ordering mineral water itself)
  if (!isDishMineralWater) {
    return [MINERAL_WATER_ADDON, ...specificAddons];
  }

  return specificAddons;
};

/**
 * Spend-More Tiered Discount & Freebie Calculator (100% Real Menu Items)
 */
export const getSpendMoreProgress = (subtotal: number): SpendMoreTier => {
  const TIER_1_OPTIONS: SpendMoreRewardOption[] = [
    {
      id: 95,
      name: 'Packaged Mineral Water 500ml (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
      description: 'Chilled sealed packaged mineral water bottle (Save ₹10)',
    },
    {
      id: 70,
      name: 'Chilled Coke / Sprite (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      description: 'Ice-cold classic Coke or Sprite can (Save ₹50)',
    },
  ];

  const TIER_2_OPTIONS: SpendMoreRewardOption[] = [
    {
      id: 72,
      name: 'Fresh Lime Soda (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
      description: 'Sparkling freshly squeezed mint lime soda (Save ₹60)',
    },
    {
      id: 48,
      name: 'Classic Salted French Fries (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
      description: 'Golden crispy thin-cut fries with sea salt (Save ₹100)',
    },
  ];

  const TIER_3_OPTIONS: SpendMoreRewardOption[] = [
    {
      id: 89,
      name: 'Vanilla Ice Cream (3 scoops) (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
      description: 'Madagascar vanilla bean ice cream (Save ₹120)',
    },
    {
      id: 49,
      name: 'Peri Peri Fries (Free)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=400&q=80',
      description: 'Crispy fries tossed in African peri peri seasoning (Save ₹120)',
    },
  ];

  const QUICK_BOOSTERS = [
    { id: 95, name: 'Mineral Water 500ml', price: 10, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=200&q=80' },
    { id: 70, name: 'Coke / Sprite', price: 50, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80' },
    { id: 72, name: 'Fresh Lime Soda', price: 60, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80' },
    { id: 48, name: 'Classic French Fries', price: 100, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=200&q=80' },
    { id: 41, name: 'Veg Cheese Sandwich', price: 100, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=200&q=80' },
    { id: 49, name: 'Peri Peri Fries', price: 120, imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=200&q=80' },
  ];

  if (subtotal >= 2000) {
    return {
      target: 2000,
      reward: '👑 TIER 3 VIP: Free Vanilla Ice Cream (3 scoops) or Peri Peri Fries (Save ₹120)',
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
      reward: '🍹 TIER 2: Free Fresh Lime Soda or Classic Fries (Save up to ₹100)',
      tierLevel: 2,
      rewardOptions: TIER_2_OPTIONS,
      percent: 100,
      amountNeeded: 2000 - subtotal,
      isUnlocked: true,
      nextTier: { target: 2000, reward: 'Vanilla Ice Cream (3 scoops) (₹120)' },
      quickBoosters: QUICK_BOOSTERS,
    };
  }

  if (subtotal >= 500) {
    return {
      target: 500,
      reward: '🥤 TIER 1: Free Chilled Coke / Sprite or Mineral Water (Save ₹50)',
      tierLevel: 1,
      rewardOptions: TIER_1_OPTIONS,
      percent: 100,
      amountNeeded: 1000 - subtotal,
      isUnlocked: true,
      nextTier: { target: 1000, reward: 'Fresh Lime Soda / Classic Fries (₹100)' },
      quickBoosters: QUICK_BOOSTERS,
    };
  }

  return {
    target: 500,
    reward: 'Free Chilled Coke / Sprite (Save ₹50)',
    tierLevel: 1,
    rewardOptions: TIER_1_OPTIONS,
    percent: Math.min(100, Math.round((subtotal / 500) * 100)),
    amountNeeded: 500 - subtotal,
    isUnlocked: false,
    nextTier: { target: 500, reward: 'Free Chilled Drink (₹50)' },
    quickBoosters: QUICK_BOOSTERS,
  };
};

/**
 * Authentic AI Recommended Pairings for Cart & Menu Detail Modals (Real Menu Items Only)
 */
export const AI_RECOMMENDED_PAIRINGS: AIPairingItem[] = [
  {
    id: 1,
    name: 'Masala Tea',
    price: 40,
    description: 'Hot clay-cup milk tea with visible whole spices, fresh ginger and cardamom.',
    category: 'Chai & Hot Teas',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    badge: 'Signature Chai',
  },
  {
    id: 49,
    name: 'Peri Peri Fries',
    price: 120,
    description: 'Crispy golden French fries tossed in fiery African peri peri spice.',
    category: 'Crispy Fries & Appetisers',
    imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80',
    badge: 'Crispy Favorite',
  },
  {
    id: 7,
    name: 'Cold Coffee',
    price: 120,
    description: 'Thick blended artisanal cold coffee with rich cocoa dusting.',
    category: 'Coffee & Brews',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    badge: 'Cafe Bestseller',
  },
  {
    id: 26,
    name: 'Oreo Blast Milkshake',
    price: 130,
    description: 'Thick creamy milkshake blended with crunchy Oreo cookies & chocolate drizzle.',
    category: 'Matcha, Boba & Shakes',
    imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    badge: 'Sweet Special',
  },
  {
    id: 41,
    name: 'Veg Cheese Sandwich',
    price: 100,
    description: 'Toasted golden sandwich with crisp fresh veggies & melted cheese, served with fries.',
    category: 'Burgers & Sandwiches',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    badge: 'All-Day Favorite',
  },
  {
    id: 89,
    name: 'Vanilla Ice Cream (3 scoops)',
    price: 120,
    description: 'Rich & creamy Madagascar vanilla bean ice cream served chilled.',
    category: 'Desserts & Ice Cream',
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80',
    badge: 'Dessert Classic',
  },
  {
    id: 48,
    name: 'Classic Salted French Fries',
    price: 100,
    description: 'Crispy golden French fries tossed in fine sea salt.',
    category: 'Crispy Fries & Appetisers',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    badge: 'Quick Snack',
  },
  {
    id: 95,
    name: 'Packaged Mineral Water (500ml)',
    price: 10,
    description: 'Chilled sealed packaged mineral water bottle (500ml).',
    category: 'Coolers & Traditional Lassi',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
    badge: 'Essential',
  },
];
