import { Injectable, signal, computed, NgZone, inject } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { from, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();
  private db = getFirestore();
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
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      tap((cred) => this.saveUserDoc(cred.user)),
    );
  }

  loginWithGoogle() {
    return from(signInWithPopup(this.auth, new GoogleAuthProvider())).pipe(
      tap((cred) => this.saveUserDoc(cred.user)),
    );
  }

  private saveUserDoc(user: User): void {
    const ref = doc(this.db, 'users', user.uid);
    setDoc(ref, {
      email: user.email ?? '',
      createdAt: user.metadata.creationTime ?? new Date().toISOString(),
    }, { merge: true });
  }

  sendPasswordReset(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  logout() {
    return from(signOut(this.auth));
  }
}
