/**
 * Robust parser for Order Item Add-ons & Chef Cooking Instructions.
 * Transforms raw database note strings (e.g. "Note: Add-ons: Mineral Water (+₹10), Fries (+₹100)")
 * and explicit addon arrays into clean, structured items for the Kitchen Display System (KDS)
 * and Customer Tracking views.
 */

export interface ParsedAddonItem {
  name: string;
  quantity: number;
  raw: string;
}

export interface ParsedItemAddonsAndNotes {
  addons: ParsedAddonItem[];
  specialInstruction: string;
  hasAddons: boolean;
}

/**
 * Splits a comma-separated list of items without splitting inside parentheses or brackets.
 * e.g. "Water (500ml), Fries (+₹100)" -> ["Water (500ml)", "Fries (+₹100)"]
 */
function splitPreservingParentheses(text: string): string[] {
  const parts: string[] = [];
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
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Cleans a single add-on string by stripping billing price clutter (e.g. "(+₹100)")
 * and extracting quantity prefixes (e.g. "2x Fries" -> qty 2, name "Fries").
 */
export function cleanAddonString(raw: string): ParsedAddonItem | null {
  if (!raw || !raw.trim()) return null;
  let str = raw.trim();

  // Strip pricing tags in parentheses, e.g. (+₹10), (+₹ 100), (+Rs. 50), (+₹120)
  str = str.replace(/\(\+\s*(?:₹|Rs\.?|INR)?\s*[\d,.]+\s*\)/gi, '').trim();

  // Strip standalone pricing at the end if present, e.g. "+₹100" or "+100"
  str = str.replace(/\+\s*(?:₹|Rs\.?|INR)?\s*[\d,.]+\s*$/gi, '').trim();

  // Extract quantity prefix if present: e.g. "2x ", "3X ", "1 x "
  let quantity = 1;
  const qtyMatch = str.match(/^(\d+)\s*[xX]\s+(.*)$/);
  if (qtyMatch) {
    quantity = Math.max(1, parseInt(qtyMatch[1], 10) || 1);
    str = qtyMatch[2].trim();
  }

  // Normalize multiple spaces
  str = str.replace(/\s+/g, ' ').trim();
  if (!str) return null;

  return {
    name: str,
    quantity,
    raw: raw.trim(),
  };
}

/**
 * Parses an order item's notes or addonNames into distinct add-on dishes
 * and separate chef cooking instructions.
 */
export function parseItemAddonsAndNotes(
  notes?: string | null,
  explicitAddons?: string[] | null
): ParsedItemAddonsAndNotes {
  const result: ParsedItemAddonsAndNotes = {
    addons: [],
    specialInstruction: '',
    hasAddons: false,
  };

  // 1. Process explicitAddons array if supplied
  if (Array.isArray(explicitAddons) && explicitAddons.length > 0) {
    for (const rawAddon of explicitAddons) {
      const cleaned = cleanAddonString(rawAddon);
      if (cleaned) {
        result.addons.push(cleaned);
      }
    }
  }

  const rawNotes = String(notes || '').trim();
  if (!rawNotes) {
    result.hasAddons = result.addons.length > 0;
    return result;
  }

  // 2. Detect "Add-ons:" or "Addons:" segment in notes string
  const addonRegex = /(?:(?:Note:\s*)?Add-?ons?:?\s*)([^|;\n]+)/i;
  const addonMatch = rawNotes.match(addonRegex);

  if (addonMatch) {
    // If no explicitAddons were provided, extract them from the notes string
    if (result.addons.length === 0) {
      const addonBody = addonMatch[1].trim();
      const chunks = splitPreservingParentheses(addonBody);
      for (const chunk of chunks) {
        const cleaned = cleanAddonString(chunk);
        if (cleaned) {
          result.addons.push(cleaned);
        }
      }
    }

    // Extract any remaining text outside the Add-ons segment as chef instruction
    let remaining = rawNotes
      .replace(/(?:Note:\s*)?Add-?ons?:?\s*[^|;\n]+/i, '')
      .replace(/^[|;\n,.\s-]+/, '')
      .replace(/[|;\n,.\s-]+$/, '')
      .trim();

    remaining = remaining.replace(/^Note:\s*/i, '').trim();

    if (remaining) {
      result.specialInstruction = remaining;
    }
  } else {
    // No Add-ons keyword found: treat notes as chef cooking instruction
    const cleanedNotes = rawNotes.replace(/^Note:\s*/i, '').trim();
    result.specialInstruction = cleanedNotes;
  }

  result.hasAddons = result.addons.length > 0;
  return result;
}
