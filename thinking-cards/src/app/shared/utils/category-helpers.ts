import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

const DEFAULT_ACCENT = '#e94560';

function isStandardCategory(category: Category): boolean {
  return !category.type || category.type === 'standard';
}

export function filterStandardCards(
  cards: Card[],
  categories: Category[],
): Card[] {
  const standardIds = new Set(
    categories.filter(isStandardCategory).map((c) => c.id),
  );
  return cards.filter((card) => standardIds.has(card.categoryId));
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
