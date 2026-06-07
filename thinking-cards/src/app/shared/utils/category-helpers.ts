import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

const DEFAULT_ACCENT = '#e94560';

const EXCLUDED_TYPES = new Set(['quiz', 'matrix', 'cryptogram', 'nonogram']);

export function filterStandardCards(
  cards: Card[],
  categories: Category[],
): Card[] {
  const excludedIds = new Set(
    categories.filter((c) => EXCLUDED_TYPES.has(c.type ?? '')).map((c) => c.id),
  );
  return cards.filter((card) => !excludedIds.has(card.categoryId));
}

export function categoryColorFor(
  card: Card | null,
  categories: Category[],
): string {
  if (!card) return DEFAULT_ACCENT;
  return categories.find((c) => c.id === card.categoryId)?.color ?? DEFAULT_ACCENT;
}

export function categoryNameFor(
  card: Card | null,
  categories: Category[],
): string {
  if (!card) return '';
  return categories.find((c) => c.id === card.categoryId)?.name ?? '';
}
