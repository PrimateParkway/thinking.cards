import { CardService } from './card.service';
import { firstValueFrom } from 'rxjs';

const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

function emitSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  const snapshot = {
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
  const callback = mockOnSnapshot.mock.calls[mockOnSnapshot.mock.calls.length - 1][1];
  callback(snapshot);
}

describe('CardService', () => {
  let service: CardService;

  beforeEach(async () => {
    mockOnSnapshot.mockClear();
    mockOnSnapshot.mockReturnValue(vi.fn());

    const { TestBed } = await import('@angular/core/testing');

    TestBed.configureTestingModule({
      providers: [CardService],
    });

    service = TestBed.inject(CardService);
  });

  describe('getCardsByCategory', () => {
    it('sorts cards by cardNumber ascending', async () => {
      const promise = firstValueFrom(service.getCardsByCategory('cat-1'));

      emitSnapshot([
        { id: 'c3', data: { questionText: 'Q3', categoryId: 'cat-1', cardNumber: 3 } },
        { id: 'c1', data: { questionText: 'Q1', categoryId: 'cat-1', cardNumber: 1 } },
        { id: 'c2', data: { questionText: 'Q2', categoryId: 'cat-1', cardNumber: 2 } },
      ]);

      const cards = await promise;

      expect(cards.map((c) => c.cardNumber)).toEqual([1, 2, 3]);
    });

    it('returns empty array when no cards match', async () => {
      const promise = firstValueFrom(service.getCardsByCategory('cat-empty'));

      emitSnapshot([]);

      const cards = await promise;

      expect(cards).toEqual([]);
    });

    it('includes document id on each card', async () => {
      const promise = firstValueFrom(service.getCardsByCategory('cat-1'));

      emitSnapshot([
        { id: 'abc-123', data: { questionText: 'Q1', categoryId: 'cat-1', cardNumber: 1 } },
      ]);

      const cards = await promise;

      expect(cards[0].id).toBe('abc-123');
    });
  });

  describe('getCategories', () => {
    it('returns categories from snapshot', async () => {
      const promise = firstValueFrom(service.getCategories());

      emitSnapshot([
        {
          id: 'cat-1',
          data: { name: 'Philosophy', description: 'Deep Q', icon: 'brain', color: '#FFF', order: 1 },
        },
      ]);

      const categories = await promise;

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Philosophy');
      expect(categories[0].id).toBe('cat-1');
    });
  });
});
