import { TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuth: { isLoggedIn: ReturnType<typeof vi.fn>; authReady: Promise<void> };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };
  let injector: Injector;
  const fakeUrlTree = {} as UrlTree;

  beforeEach(() => {
    mockAuth = { isLoggedIn: vi.fn(), authReady: Promise.resolve() };
    mockRouter = { createUrlTree: vi.fn().mockReturnValue(fakeUrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });

    injector = TestBed.inject(Injector);
  });

  it('returns true when user is logged in', async () => {
    mockAuth.isLoggedIn.mockReturnValue(true);

    const result = await runInInjectionContext(injector, () =>
      authGuard({} as any, {} as any),
    );

    expect(result).toBe(true);
  });

  it('redirects to /login when user is not logged in', async () => {
    mockAuth.isLoggedIn.mockReturnValue(false);

    const result = await runInInjectionContext(injector, () =>
      authGuard({} as any, {} as any),
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(fakeUrlTree);
  });
});
