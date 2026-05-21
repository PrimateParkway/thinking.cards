import { createMockUser } from '../../testing/firebase.mocks';
import { FavoritesService } from './favorites.service';

const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn().mockReturnValue('mock-doc-ref'),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue({ _type: 'serverTimestamp' }),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockAuth: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockSetDoc.mockClear();
    mockDeleteDoc.mockClear();

    const { TestBed } = await import('@angular/core/testing');
    const { AuthService } = await import('./auth.service');

    mockAuth = { currentUser: vi.fn().mockReturnValue(null) };

    TestBed.configureTestingModule({
      providers: [
        FavoritesService,
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    service = TestBed.inject(FavoritesService);
  });

  describe('isFavorite', () => {
    it('returns a computed signal that reflects favoriteIds', () => {
      service.favoriteIds.set(new Set(['card-1', 'card-2']));

      const isFav1 = service.isFavorite('card-1');
      const isFav3 = service.isFavorite('card-3');

      expect(isFav1()).toBe(true);
      expect(isFav3()).toBe(false);
    });

    it('updates reactively when favoriteIds change', () => {
      const isFav = service.isFavorite('card-1');

      expect(isFav()).toBe(false);

      service.favoriteIds.set(new Set(['card-1']));

      expect(isFav()).toBe(true);
    });
  });

  describe('toggle', () => {
    it('does nothing when user is not logged in', () => {
      mockAuth.currentUser.mockReturnValue(null);

      service.toggle('card-1');

      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('calls deleteDoc when card is already a favorite', () => {
      mockAuth.currentUser.mockReturnValue(createMockUser());
      service.favoriteIds.set(new Set(['card-1']));

      service.toggle('card-1');

      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('calls setDoc when card is not a favorite', () => {
      mockAuth.currentUser.mockReturnValue(createMockUser());

      service.toggle('card-1');

      expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', {
        addedAt: { _type: 'serverTimestamp' },
      });
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('calls setDoc with serverTimestamp for new favorites', () => {
      mockAuth.currentUser.mockReturnValue(createMockUser());

      service.toggle('new-card');

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const payload = mockSetDoc.mock.calls[0][1];
      expect(payload).toHaveProperty('addedAt');
    });
  });
});
