import { AdminService } from './admin.service';
import { firstValueFrom } from 'rxjs';

const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn().mockReturnValue('mock-col-ref'),
  doc: vi.fn().mockReturnValue('mock-doc-ref'),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
}));

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    mockAddDoc.mockClear();
    mockUpdateDoc.mockClear();
    mockDeleteDoc.mockClear();

    mockAddDoc.mockResolvedValue({ id: 'new-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);

    const { TestBed } = await import('@angular/core/testing');

    TestBed.configureTestingModule({
      providers: [AdminService],
    });

    service = TestBed.inject(AdminService);
  });

  it('addCategory calls addDoc with category data', async () => {
    const data = { name: 'Ethics', description: 'Moral Q', icon: 'heart', color: '#F00', order: 1 };

    await firstValueFrom(service.addCategory(data));

    expect(mockAddDoc).toHaveBeenCalledWith('mock-col-ref', data);
  });

  it('updateCategory calls updateDoc with partial data', async () => {
    await firstValueFrom(service.updateCategory('cat-1', { name: 'Updated' }));

    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { name: 'Updated' });
  });

  it('deleteCategory calls deleteDoc', async () => {
    await firstValueFrom(service.deleteCategory('cat-1'));

    expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
  });

  it('addCard calls addDoc with card data', async () => {
    const data = { questionText: 'What?', categoryId: 'cat-1', cardNumber: 1 };

    await firstValueFrom(service.addCard(data));

    expect(mockAddDoc).toHaveBeenCalledWith('mock-col-ref', data);
  });

  it('updateCard calls updateDoc with partial data', async () => {
    await firstValueFrom(service.updateCard('card-1', { questionText: 'Updated?' }));

    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { questionText: 'Updated?' });
  });

  it('deleteCard calls deleteDoc', async () => {
    await firstValueFrom(service.deleteCard('card-1'));

    expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
  });
});
