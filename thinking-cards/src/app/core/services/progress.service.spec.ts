import { makeCard } from '../../testing/firebase.mocks';
import { ProgressService } from './progress.service';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('ProgressService.countByCategory', () => {
  let service: ProgressService;

  beforeEach(async () => {
    const { TestBed } = await import('@angular/core/testing');
    const { AuthService } = await import('./auth.service');

    TestBed.configureTestingModule({
      providers: [
        ProgressService,
        { provide: AuthService, useValue: { currentUser: vi.fn().mockReturnValue(null) } },
      ],
    });

    service = TestBed.inject(ProgressService);
  });

  it('groups cards by categoryId', () => {
    const cards = [
      makeCard({ id: 'c1', categoryId: 'cat-a' }),
      makeCard({ id: 'c2', categoryId: 'cat-b' }),
      makeCard({ id: 'c3', categoryId: 'cat-a' }),
    ];

    const result = service.countByCategory(cards);

    expect(result.size).toBe(2);
    expect(result.get('cat-a')!.total).toBe(2);
    expect(result.get('cat-b')!.total).toBe(1);
  });

  it('counts seen cards correctly', () => {
    service.seenIds.set(new Set(['c1', 'c3']));

    const cards = [
      makeCard({ id: 'c1', categoryId: 'cat-a' }),
      makeCard({ id: 'c2', categoryId: 'cat-a' }),
      makeCard({ id: 'c3', categoryId: 'cat-a' }),
    ];

    const progress = service.countByCategory(cards).get('cat-a')!;

    expect(progress.seen).toBe(2);
    expect(progress.total).toBe(3);
  });

  it('calculates percent correctly', () => {
    service.seenIds.set(new Set(['c1']));

    const cards = [
      makeCard({ id: 'c1', categoryId: 'cat-a' }),
      makeCard({ id: 'c2', categoryId: 'cat-a' }),
      makeCard({ id: 'c3', categoryId: 'cat-a' }),
      makeCard({ id: 'c4', categoryId: 'cat-a' }),
    ];

    const progress = service.countByCategory(cards).get('cat-a')!;

    expect(progress.percent).toBe(25);
  });

  it('returns 0 percent when no cards are seen', () => {
    const cards = [makeCard({ id: 'c1', categoryId: 'cat-a' })];
    const progress = service.countByCategory(cards).get('cat-a')!;

    expect(progress.percent).toBe(0);
    expect(progress.seen).toBe(0);
  });

  it('returns 100 percent when all cards are seen', () => {
    service.seenIds.set(new Set(['c1', 'c2']));

    const cards = [
      makeCard({ id: 'c1', categoryId: 'cat-a' }),
      makeCard({ id: 'c2', categoryId: 'cat-a' }),
    ];

    const progress = service.countByCategory(cards).get('cat-a')!;

    expect(progress.percent).toBe(100);
  });

  it('returns empty map for empty cards array', () => {
    const result = service.countByCategory([]);

    expect(result.size).toBe(0);
  });
});
