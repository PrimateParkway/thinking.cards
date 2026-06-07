import { Injectable, inject, computed, signal, effect, NgZone } from '@angular/core';
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

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
}

export function computeStreak(dateKeys: string[]): StreakInfo {
  if (dateKeys.length === 0) {
    return { current: 0, longest: 0, activeToday: false };
  }

  const daySet = new Set(dateKeys);
  const sorted = [...daySet].sort();

  const today = toDateKey(new Date());
  const activeToday = daySet.has(today);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  let current = 0;
  let checkKey = activeToday ? today : yesterday(today);
  while (daySet.has(checkKey)) {
    current++;
    checkKey = yesterday(checkKey);
  }

  return { current, longest, activeToday };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterday(key: string): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

function isConsecutive(a: string, b: string): boolean {
  const next = new Date(a + 'T00:00:00');
  next.setDate(next.getDate() + 1);
  return toDateKey(next) === b;
}

@Injectable({ providedIn: 'root' })
export class StreakService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private db = getFirestore();
  private unsub: Unsubscribe | null = null;
  private todayRecorded = false;

  readonly activityDates = signal<string[]>([]);
  readonly streak = computed(() => computeStreak(this.activityDates()));

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.cleanup();
      this.todayRecorded = false;
      if (!user) {
        this.activityDates.set([]);
        return;
      }
      const colRef = collection(this.db, `users/${user.uid}/activity`);
      this.unsub = onSnapshot(colRef, (snapshot) => {
        this.zone.run(() => {
          this.activityDates.set(snapshot.docs.map((d) => d.id));
        });
      });
    });
  }

  recordActivity(): void {
    if (this.todayRecorded) return;
    const user = this.auth.currentUser();
    if (!user) return;
    const today = toDateKey(new Date());
    this.todayRecorded = true;
    const ref = doc(this.db, `users/${user.uid}/activity`, today);
    setDoc(ref, { lastActiveAt: serverTimestamp() }, { merge: true }).catch(() => {
      this.todayRecorded = false;
    });
  }

  private cleanup(): void {
    this.unsub?.();
    this.unsub = null;
  }
}
