import { Card } from '../core/models/card.model';
import { Category } from '../core/models/category.model';

export function createMockUser(overrides: Partial<{ uid: string; email: string }> = {}) {
  return {
    uid: overrides.uid ?? 'test-uid',
    email: overrides.email ?? 'test@example.com',
  };
}

export function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: overrides.id ?? 'card-1',
    questionText: overrides.questionText ?? 'What is testing?',
    categoryId: overrides.categoryId ?? 'cat-1',
    cardNumber: overrides.cardNumber ?? 1,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: overrides.id ?? 'cat-1',
    name: overrides.name ?? 'Philosophy',
    description: overrides.description ?? 'Deep questions',
    icon: overrides.icon ?? 'brain',
    color: overrides.color ?? '#FF5733',
    order: overrides.order ?? 1,
  };
}

export function createMockSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
}
