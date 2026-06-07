import { Injectable, inject, signal, NgZone, effect } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { Card } from '../models/card.model';

export interface CategoryProgress {
  seen: number;
  total: number;
  percent: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private db = getFirestore();
  private unsub: Unsubscribe | null = null;

  readonly seenIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.cleanup();
      if (!user) {
        this.seenIds.set(new Set());
        return;
      }
      const colRef = collection(this.db, `users/${user.uid}/progress`);
      this.unsub = onSnapshot(colRef, (snapshot) => {
        this.zone.run(() => {
          this.seenIds.set(new Set(snapshot.docs.map((d) => d.id)));
        });
      });
    });
  }

  markSeen(cardId: string): void {
    const user = this.auth.currentUser();
    if (!user || this.seenIds().has(cardId)) return;
    const ref = doc(this.db, `users/${user.uid}/progress`, cardId);
    setDoc(ref, { seenAt: serverTimestamp() }).catch(() => {});
  }

  countByCategory(cards: Card[]): Map<string, CategoryProgress> {
    const result = new Map<string, CategoryProgress>();
    const groups = new Map<string, Card[]>();

    for (const card of cards) {
      const list = groups.get(card.categoryId) ?? [];
      list.push(card);
      groups.set(card.categoryId, list);
    }

    const seen = this.seenIds();
    for (const [catId, catCards] of groups) {
      const seenCount = catCards.filter((c) => seen.has(c.id)).length;
      const total = catCards.length;
      result.set(catId, {
        seen: seenCount,
        total,
        percent: total > 0 ? Math.round((seenCount / total) * 100) : 0,
      });
    }

    return result;
  }

  private cleanup(): void {
    this.unsub?.();
    this.unsub = null;
  }
}
