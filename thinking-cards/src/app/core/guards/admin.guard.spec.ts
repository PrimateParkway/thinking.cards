import { TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let mockAuth: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };
  let injector: Injector;
  const fakeUrlTree = {} as UrlTree;

  beforeEach(() => {
    mockAuth = {
      isLoggedIn: vi.fn(),
      isAdmin: vi.fn(),
    };
    mockRouter = { createUrlTree: vi.fn().mockReturnValue(fakeUrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });

    injector = TestBed.inject(Injector);
  });

  it('allows access when user is logged in and admin', () => {
    mockAuth.isLoggedIn.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(true);

    const result = runInInjectionContext(injector, () =>
      adminGuard({} as any, {} as any),
    );

    expect(result).toBe(true);
  });

  it('denies access when user is logged in but not admin', () => {
    mockAuth.isLoggedIn.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(false);

    const result = runInInjectionContext(injector, () =>
      adminGuard({} as any, {} as any),
    );

    expect(result).toBe(fakeUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('denies access when user is not logged in', () => {
    mockAuth.isLoggedIn.mockReturnValue(false);
    mockAuth.isAdmin.mockReturnValue(false);

    const result = runInInjectionContext(injector, () =>
      adminGuard({} as any, {} as any),
    );

    expect(result).toBe(fakeUrlTree);
  });

  it('denies access when user is not logged in even if admin flag is set', () => {
    mockAuth.isLoggedIn.mockReturnValue(false);
    mockAuth.isAdmin.mockReturnValue(true);

    const result = runInInjectionContext(injector, () =>
      adminGuard({} as any, {} as any),
    );

    expect(result).toBe(fakeUrlTree);
  });
});
