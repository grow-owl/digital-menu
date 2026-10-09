/**
 * Multi-Chef Kitchen Scheduling Engine (Backend)
 * Simulates a realistic restaurant kitchen pipeline with parallel chef stations (default 3 chefs).
 * Uses LPT (Longest Processing Time First) greedy multiprocessor scheduling.
 */

// Keyword duration heuristics for dishes and add-ons
const DISH_DURATION_LOOKUP = [
  { keywords: ['water', 'packaged', 'bottle'], minutes: 0 },
  { keywords: ['burger'], minutes: 7 },
  { keywords: ['sandwich', 'toast'], minutes: 6 },
  { keywords: ['fries', 'pakora', 'nugget', 'finger'], minutes: 5 },
  { keywords: ['tea', 'chai', 'coffee', 'latte', 'cappuccino'], minutes: 5 },
  { keywords: ['maggi', 'noodle', 'rice', 'fried rice'], minutes: 7 },
  { keywords: ['pasta'], minutes: 9 },
  { keywords: ['pizza'], minutes: 10 },
  { keywords: ['boba', 'shake', 'cooler', 'mojito', 'soda', 'lassi'], minutes: 5 },
  { keywords: ['ice cream', 'dessert', 'brownie', 'gulab jamun'], minutes: 3 },
];

export const getDishCookMinutes = (name, override) => {
  if (override && Number(override) > 0) return Number(override);
  const clean = String(name || '').toLowerCase().trim();
  if (!clean) return 5;

  for (const entry of DISH_DURATION_LOOKUP) {
    if (entry.keywords.some((kw) => clean.includes(kw))) {
      return entry.minutes;
    }
  }

  return 5; // standard restaurant item default
};

/**
 * Splits comma-delimited add-ons without splitting parentheses
 */
function splitPreservingParentheses(text) {
  const parts = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(' || char === '[' || char === '{') {
      depth++;
    } else if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1);
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Cleans an add-on item string, extracting quantity prefix and removing price tags
 */
export function cleanAddonString(raw) {
  if (!raw || !raw.trim()) return null;
  let str = raw.trim();

  // Strip pricing tags e.g. (+₹10), (+₹ 100), (+Rs. 50), (+100)
  str = str.replace(/\(\+\s*(?:₹|Rs\.?|INR)?\s*[\d,.]+\s*\)/gi, '').trim();
  str = str.replace(/\+\s*(?:₹|Rs\.?|INR)?\s*[\d,.]+\s*$/gi, '').trim();

  let quantity = 1;
  const qtyMatch = str.match(/^(\d+)\s*[xX]\s+(.*)$/);
  if (qtyMatch) {
    quantity = Math.max(1, parseInt(qtyMatch[1], 10) || 1);
    str = qtyMatch[2].trim();
  }

  str = str.replace(/\s+/g, ' ').trim();
  if (!str) return null;

  return { name: str, quantity };
}

/**
 * Parses item notes or addonNames into distinct add-on dishes
 */
export function parseItemAddons(notes, explicitAddons) {
  const addons = [];

  if (Array.isArray(explicitAddons) && explicitAddons.length > 0) {
    for (const raw of explicitAddons) {
      const cleaned = cleanAddonString(raw);
      if (cleaned) addons.push(cleaned);
    }
  }

  const rawNotes = String(notes || '').trim();
  if (rawNotes) {
    const addonRegex = /(?:(?:Note:\s*)?Add-?ons?:?\s*)([^|;\n]+)/i;
    const addonMatch = rawNotes.match(addonRegex);
    if (addonMatch && addons.length === 0) {
      const chunks = splitPreservingParentheses(addonMatch[1].trim());
      for (const chunk of chunks) {
        const cleaned = cleanAddonString(chunk);
        if (cleaned) addons.push(cleaned);
      }
    }
  }

  return addons;
}

/**
 * Simulates a realistic Multi-Chef Kitchen Pipeline (3 Chef Stations by default).
 * Returns total makespan in minutes and seconds.
 */
export const calculateTicketCookingPipeline = (items, chefCapacity = 3) => {
  const activeItems = (items || []).filter((it) => it.status !== 'cancelled');
  if (activeItems.length === 0) {
    return {
      totalEstimatedMinutes: 0,
      totalEstimatedSeconds: 0,
      longestSingleDishMinutes: 0,
      tasks: [],
    };
  }

  const tasks = [];

  for (const item of activeItems) {
    const mainMins = getDishCookMinutes(item.name, item.preparationTimeMinutes);
    const mainQty = Math.max(1, item.quantity || 1);

    tasks.push({
      name: item.name,
      durationMinutes: mainMins,
      quantity: mainQty,
      isAddon: false,
    });

    const parsedAddons = parseItemAddons(item.notes, item.addonNames);
    for (const addon of parsedAddons) {
      const addonMins = getDishCookMinutes(addon.name);
      const totalAddonQty = Math.max(1, (addon.quantity || 1) * mainQty);
      tasks.push({
        name: addon.name,
        durationMinutes: addonMins,
        quantity: totalAddonQty,
        isAddon: true,
      });
    }
  }

  // Filter tasks with cooking duration > 0 (excludes packaged water)
  const cookingTasks = tasks.filter((t) => t.durationMinutes > 0);

  if (cookingTasks.length === 0) {
    const minTime = tasks.length > 0 ? 1 : 0;
    return {
      totalEstimatedMinutes: minTime,
      totalEstimatedSeconds: minTime * 60,
      longestSingleDishMinutes: minTime,
      tasks,
    };
  }

  const longestSingleDishMinutes = Math.max(...cookingTasks.map((t) => t.durationMinutes));

  // Expand tasks by quantity for multi-chef simulation
  const expandedDurations = [];
  for (const t of cookingTasks) {
    for (let q = 0; q < t.quantity; q++) {
      expandedDurations.push(t.durationMinutes);
    }
  }

  // Sort descending: LPT (Longest Processing Time First)
  expandedDurations.sort((a, b) => b - a);

  // Distribute over K chefs
  const chefs = new Array(Math.max(1, chefCapacity)).fill(0);
  for (const duration of expandedDurations) {
    let earliestChefIdx = 0;
    for (let i = 1; i < chefs.length; i++) {
      if (chefs[i] < chefs[earliestChefIdx]) {
        earliestChefIdx = i;
      }
    }
    chefs[earliestChefIdx] += duration;
  }

  const totalEstimatedMinutes = Math.max(...chefs);

  return {
    totalEstimatedMinutes,
    totalEstimatedSeconds: totalEstimatedMinutes * 60,
    longestSingleDishMinutes,
    tasks,
  };
};
