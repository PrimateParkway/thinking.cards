import { Injectable, signal, computed, NgZone, inject } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();
  private zone = inject(NgZone);

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = signal(false);

  readonly authReady: Promise<void>;

  constructor() {
    let resolveReady: () => void;
    this.authReady = new Promise((r) => (resolveReady = r));
    let first = true;

    onAuthStateChanged(this.auth, (user) => {
      this.zone.run(async () => {
        this.currentUser.set(user);
        if (user) {
          const token = await user.getIdTokenResult();
          this.isAdmin.set(!!token.claims['admin']);
        } else {
          this.isAdmin.set(false);
        }
        if (first) {
          first = false;
          resolveReady!();
        }
      });
    });
  }

  login(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  register(email: string, password: string) {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  loginWithGoogle() {
    return from(signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  logout() {
    return from(signOut(this.auth));
  }
}
