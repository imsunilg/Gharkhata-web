import { Injectable } from '@angular/core';

export interface ParsedExpense {
  amount: number | null;
  /** Category NAME hint (matched to a real category id by the caller). */
  categoryHint: string | null;
  subCategoryHint: string | null;
  title: string | null;
  date: 'today' | 'yesterday' | null;
}

const STOP_WORDS = new Set([
  'spent', 'spend', 'on', 'for', 'paid', 'pay', 'rupees', 'rupee', 'rs', 'inr',
  'a', 'an', 'the', 'to', 'of', 'at', 'was', 'is', 'i', 'my', 'me', 'today', 'yesterday',
]);

const CATEGORY_KEYWORDS: { re: RegExp; category: string; sub?: string }[] = [
  { re: /\b(petrol|fuel|diesel|gas station)\b/i, category: 'Transport', sub: 'Fuel' },
  { re: /\b(taxi|uber|ola|cab|auto)\b/i, category: 'Transport', sub: 'Taxi' },
  { re: /\b(bus|metro|train|local)\b/i, category: 'Transport', sub: 'Public Transport' },
  { re: /\b(swiggy|zomato|delivery)\b/i, category: 'Food', sub: 'Food Delivery' },
  { re: /\b(restaurant|dinner|lunch|cafe|coffee)\b/i, category: 'Food', sub: 'Restaurants' },
  { re: /\b(grocery|groceries|vegetables|veggies|kirana|supermarket|bigbasket)\b/i, category: 'Food', sub: 'Groceries' },
  { re: /\b(electricity|water bill|internet|wifi|broadband|recharge|mobile bill|dth)\b/i, category: 'Utilities' },
  { re: /\b(rent|maintenance|society|cylinder|lpg)\b/i, category: 'Housing' },
  { re: /\b(school|fees|tuition|books|stationery|coaching)\b/i, category: 'Education' },
  { re: /\b(movie|netflix|prime|hotstar|cinema|pvr|spotify)\b/i, category: 'Entertainment' },
  { re: /\b(medicine|pharmacy|doctor|hospital|clinic|medical)\b/i, category: 'Healthcare' },
  { re: /\b(amazon|flipkart|myntra|shopping|clothes|shoes)\b/i, category: 'Shopping' },
];

@Injectable({ providedIn: 'root' })
export class SmartParseService {
  parse(input: string): ParsedExpense {
    const text = (input ?? '').trim();
    if (!text) return { amount: null, categoryHint: null, subCategoryHint: null, title: null, date: null };

    return {
      amount: this.extractAmount(text),
      ...this.extractCategory(text),
      title: this.extractTitle(text),
      date: this.extractDate(text),
    };
  }

  private extractAmount(text: string): number | null {
    // ₹ and comma-grouped: "₹1,200" / "2,500" / "450.50"
    const m = text.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i);
    if (!m) return null;
    const value = Number(m[1].replace(/,/g, ''));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private extractCategory(text: string): { categoryHint: string | null; subCategoryHint: string | null } {
    for (const { re, category, sub } of CATEGORY_KEYWORDS) {
      if (re.test(text)) return { categoryHint: category, subCategoryHint: sub ?? null };
    }
    return { categoryHint: null, subCategoryHint: null };
  }

  private extractTitle(text: string): string | null {
    const withoutAmount = text.replace(/(?:₹|rs\.?|inr)?\s*\d[\d,]*(?:\.\d{1,2})?/gi, ' ');
    const words = withoutAmount
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z]/g, ''))
      .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
    if (words.length === 0) return null;
    return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  private extractDate(text: string): 'today' | 'yesterday' | null {
    if (/\byesterday\b/i.test(text)) return 'yesterday';
    if (/\btoday\b/i.test(text)) return 'today';
    return null;
  }
}
