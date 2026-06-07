import { Injectable, inject, signal, computed, effect, NgZone } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private db = getFirestore();
  private unsub: Unsubscribe | null = null;

  readonly favoriteIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.cleanup();
      if (!user) {
        this.favoriteIds.set(new Set());
        return;
      }
      const colRef = collection(this.db, `users/${user.uid}/favorites`);
      this.unsub = onSnapshot(colRef, (snapshot) => {
        this.zone.run(() => {
          this.favoriteIds.set(new Set(snapshot.docs.map((d) => d.id)));
        });
      });
    });
  }

  toggle(cardId: string): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const ref = doc(this.db, `users/${user.uid}/favorites`, cardId);
    if (this.favoriteIds().has(cardId)) {
      deleteDoc(ref).catch(() => {});
    } else {
      setDoc(ref, { addedAt: serverTimestamp() }).catch(() => {});
    }
  }

  isFavorite(cardId: string) {
    return computed(() => this.favoriteIds().has(cardId));
  }

  private cleanup(): void {
    this.unsub?.();
    this.unsub = null;
  }
}
