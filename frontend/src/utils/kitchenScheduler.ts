import { SILIGURI_MENU_ITEMS } from '../data/siliguriMenuData';
import { parseItemAddonsAndNotes } from './addonParser';

// Catalog lookup map for dish preparation durations (in minutes)
const DISH_PREP_MAP = new Map<string, number>(
  SILIGURI_MENU_ITEMS.map((item) => [item.name.toLowerCase().trim(), item.preparationTimeMinutes || 5])
);

/**
 * Returns estimated cooking minutes for any dish or add-on by name.
 * Uses exact match, substring lookup, category heuristics, with sensible fallbacks.
 */
export const getDishCookMinutes = (name: string, override?: number): number => {
  if (override && override > 0) return override;
  const clean = String(name || '').toLowerCase().trim();
  if (!clean) return 5;

  // Packaged water is instant / 0 cooking time
  if (clean.includes('water') || clean.includes('packaged')) return 0;

  if (DISH_PREP_MAP.has(clean)) return DISH_PREP_MAP.get(clean)!;

  for (const [k, v] of DISH_PREP_MAP.entries()) {
    if (clean.includes(k) || k.includes(clean)) return v;
  }

  // Fallbacks by food type keywords
  if (clean.includes('tea') || clean.includes('chai') || clean.includes('coffee') || clean.includes('latte')) return 5;
  if (clean.includes('burger')) return 7;
  if (clean.includes('sandwich')) return 6;
  if (clean.includes('fries') || clean.includes('pakora')) return 5;
  if (clean.includes('nugget') || clean.includes('babycorn') || clean.includes('appetiser')) return 6;
  if (clean.includes('maggi') || clean.includes('noodle') || clean.includes('rice')) return 7;
  if (clean.includes('pasta')) return 9;
  if (clean.includes('pizza')) return 10;
  if (clean.includes('boba') || clean.includes('shake') || clean.includes('cooler') || clean.includes('soda')) return 5;
  if (clean.includes('ice cream') || clean.includes('dessert') || clean.includes('brownie')) return 3;

  return 5; // standard fallback
};

export interface CookingTask {
  name: string;
  durationMinutes: number;
  quantity: number;
  isAddon: boolean;
}

export interface TicketPipelineResult {
  totalEstimatedMinutes: number;
  totalEstimatedSeconds: number;
  longestSingleDishMinutes: number;
  tasks: CookingTask[];
  tasksCount: number;
}

/**
 * Simulates a realistic Multi-Chef Kitchen Pipeline (3 Chef Stations by default).
 * Dispatches active main dishes and add-on food items to parallel chefs.
 * Uses LPT (Longest Processing Time First) scheduling to find total makespan.
 */
export const calculateTicketCookingPipeline = (
  items: Array<{
    name: string;
    quantity?: number;
    notes?: string;
    addonNames?: string[];
    preparationTimeMinutes?: number;
    status?: string;
    isPrepared?: boolean;
  }>,
  chefCapacity: number = 3
): TicketPipelineResult => {
  const activeItems = (items || []).filter((it) => it.status !== 'cancelled');
  if (activeItems.length === 0) {
    return {
      totalEstimatedMinutes: 0,
      totalEstimatedSeconds: 0,
      longestSingleDishMinutes: 0,
      tasks: [],
      tasksCount: 0,
    };
  }

  const tasks: CookingTask[] = [];

  for (const item of activeItems) {
    const mainMins = getDishCookMinutes(item.name, item.preparationTimeMinutes);
    const mainQty = Math.max(1, item.quantity || 1);

    // Add main dish task
    tasks.push({
      name: item.name,
      durationMinutes: mainMins,
      quantity: mainQty,
      isAddon: false,
    });

    // Extract and add all active add-ons
    const parsed = parseItemAddonsAndNotes(item.notes, item.addonNames);
    if (parsed.hasAddons) {
      for (const addon of parsed.addons) {
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
  }

  // Filter tasks with cooking time > 0 (excluding instant items like water bottles)
  const cookingTasks = tasks.filter((t) => t.durationMinutes > 0);

  if (cookingTasks.length === 0) {
    const minTime = tasks.length > 0 ? 1 : 0;
    return {
      totalEstimatedMinutes: minTime,
      totalEstimatedSeconds: minTime * 60,
      longestSingleDishMinutes: minTime,
      tasks,
      tasksCount: tasks.length,
    };
  }

  const longestSingleDishMinutes = Math.max(...cookingTasks.map((t) => t.durationMinutes));

  // Expand tasks by quantity for simulation
  const expandedDurations: number[] = [];
  for (const t of cookingTasks) {
    for (let q = 0; q < t.quantity; q++) {
      expandedDurations.push(t.durationMinutes);
    }
  }

  // Sort tasks in descending order (LPT Scheduling)
  expandedDurations.sort((a, b) => b - a);

  // Multi-Chef simulation queue (K chefs)
  const chefs = new Array(Math.max(1, chefCapacity)).fill(0);
  for (const duration of expandedDurations) {
    // Find chef who gets free earliest
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
    tasksCount: tasks.length,
  };
};
