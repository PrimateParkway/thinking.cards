import { Injectable, inject, signal, effect, NgZone } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { AuthService } from './auth.service';

export interface QuizProgress {
  index: number;
  score: number;
  totalAnswered: number;
  completed?: boolean;
  totalCards?: number;
}

export interface MatrixProgress {
  index: number;
  gridStates: Record<number, Record<string, number>>;
  solvedPuzzles: number[];
  gaveUpPuzzles?: number[];
  bestTimes?: Record<number, number>;
}

export interface CryptogramProgress {
  index: number;
  guessStates: Record<number, Record<string, string>>;
  solvedPuzzles: number[];
  gaveUpPuzzles?: number[];
  bestTimes?: Record<number, number>;
}

export interface NonogramProgress {
  index: number;
  gridStates: Record<number, Record<string, number>>;
  solvedPuzzles: number[];
  gaveUpPuzzles?: number[];
  bestTimes?: Record<number, number>;
}

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private db = getFirestore();
  private quizUnsub: Unsubscribe | null = null;
  private matrixUnsub: Unsubscribe | null = null;
  private cryptogramUnsub: Unsubscribe | null = null;
  private nonogramUnsub: Unsubscribe | null = null;

  readonly allQuizProgress = signal<Map<string, QuizProgress>>(new Map());
  readonly allMatrixProgress = signal<Map<string, MatrixProgress>>(new Map());
  readonly allCryptogramProgress = signal<Map<string, CryptogramProgress>>(new Map());
  readonly allNonogramProgress = signal<Map<string, NonogramProgress>>(new Map());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.cleanup();
      if (!user) {
        this.allQuizProgress.set(new Map());
        this.allMatrixProgress.set(new Map());
        this.allCryptogramProgress.set(new Map());
        this.allNonogramProgress.set(new Map());
        return;
      }

      const quizCol = collection(this.db, `users/${user.uid}/quizState`);
      this.quizUnsub = onSnapshot(quizCol, (snap) => {
        this.zone.run(() => {
          const m = new Map<string, QuizProgress>();
          for (const d of snap.docs) m.set(d.id, d.data() as QuizProgress);
          this.allQuizProgress.set(m);
        });
      });

      const matrixCol = collection(this.db, `users/${user.uid}/matrixState`);
      this.matrixUnsub = onSnapshot(matrixCol, (snap) => {
        this.zone.run(() => {
          const m = new Map<string, MatrixProgress>();
          for (const d of snap.docs) m.set(d.id, d.data() as MatrixProgress);
          this.allMatrixProgress.set(m);
        });
      });

      const cryptogramCol = collection(this.db, `users/${user.uid}/cryptogramState`);
      this.cryptogramUnsub = onSnapshot(cryptogramCol, (snap) => {
        this.zone.run(() => {
          const m = new Map<string, CryptogramProgress>();
          for (const d of snap.docs) m.set(d.id, d.data() as CryptogramProgress);
          this.allCryptogramProgress.set(m);
        });
      });

      const nonogramCol = collection(this.db, `users/${user.uid}/nonogramState`);
      this.nonogramUnsub = onSnapshot(nonogramCol, (snap) => {
        this.zone.run(() => {
          const m = new Map<string, NonogramProgress>();
          for (const d of snap.docs) m.set(d.id, d.data() as NonogramProgress);
          this.allNonogramProgress.set(m);
        });
      });
    });
  }

  // ── Card Position ──────────────────────────────────────────────────

  saveCardPosition(categoryId: string, index: number): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const ref = doc(this.db, `users/${user.uid}/cardState`, categoryId);
    setDoc(ref, { index, updatedAt: serverTimestamp() }).catch(() => {});
  }

  async loadCardPosition(categoryId: string): Promise<number> {
    const user = this.auth.currentUser();
    if (!user) return 0;
    const ref = doc(this.db, `users/${user.uid}/cardState`, categoryId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data()['index'] ?? 0) : 0;
  }

  // ── Quiz Progress ──────────────────────────────────────────────────

  saveQuizProgress(categoryId: string, data: QuizProgress): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const ref = doc(this.db, `users/${user.uid}/quizState`, categoryId);
    setDoc(ref, { ...data, updatedAt: serverTimestamp() }).catch(() => {});
  }

  async loadQuizProgress(categoryId: string): Promise<QuizProgress | null> {
    const user = this.auth.currentUser();
    if (!user) return null;
    const ref = doc(this.db, `users/${user.uid}/quizState`, categoryId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as QuizProgress) : null;
  }

  // ── Matrix Progress ────────────────────────────────────────────────

  saveMatrixProgress(categoryId: string, data: MatrixProgress): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const ref = doc(this.db, `users/${user.uid}/matrixState`, categoryId);
    setDoc(ref, { ...data, updatedAt: serverTimestamp() }).catch(() => {});
  }

  async loadMatrixProgress(categoryId: string): Promise<MatrixProgress | null> {
    const user = this.auth.currentUser();
    if (!user) return null;
    const ref = doc(this.db, `users/${user.uid}/matrixState`, categoryId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as MatrixProgress) : null;
  }

  // ── Cryptogram Progress ──────────────────────────────────────────

  saveCryptogramProgress(categoryId: string, data: CryptogramProgress): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const ref = doc(this.db, `users/${user.uid}/cryptogramState`, categoryId);
    setDoc(ref, { ...data, updatedAt: serverTimestamp() }).catch(() => {});
  }

  async loadCryptogramProgress(categoryId: string): Promise<CryptogramProgress | null> {
    const user = this.auth.currentUser();
    if (!user) return null;
    const ref = doc(this.db, `users/${user.uid}/cryptogramState`, categoryId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as CryptogramProgress) : null;
  }

  // ── Nonogram Progress ──────────────────────────────────────────

  saveNonogramProgress(categoryId: string, data: NonogramProgress): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const ref = doc(this.db, `users/${user.uid}/nonogramState`, categoryId);
    setDoc(ref, { ...data, updatedAt: serverTimestamp() }).catch(() => {});
  }

  async loadNonogramProgress(categoryId: string): Promise<NonogramProgress | null> {
    const user = this.auth.currentUser();
    if (!user) return null;
    const ref = doc(this.db, `users/${user.uid}/nonogramState`, categoryId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as NonogramProgress) : null;
  }

  private cleanup(): void {
    this.quizUnsub?.();
    this.quizUnsub = null;
    this.matrixUnsub?.();
    this.matrixUnsub = null;
    this.cryptogramUnsub?.();
    this.cryptogramUnsub = null;
    this.nonogramUnsub?.();
    this.nonogramUnsub = null;
  }
}
