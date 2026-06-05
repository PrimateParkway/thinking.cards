import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, tap, from } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-cryptogram',
  imports: [CategoryIconComponent],
  template: `
    <div class="cryptogram container">
      <button class="back-btn" (click)="goBack()">&larr; Back</button>

      @if (category(); as cat) {
        <div class="header-bar" [style.border-color]="cat.color">
          <app-category-icon [name]="cat.name" class="title-icon" />
          <h2 class="cat-title" [style.color]="cat.color">{{ cat.name }}</h2>
          <button class="info-btn" (click)="showInstructions()" title="How to play">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
        </div>
      }

      @if (currentCard(); as card) {
        @if (isInstructionCard()) {
          <div class="instructions-panel">
            <h2 class="instructions-title">{{ card.questionText }}</h2>
            <div class="instructions-body">{{ card.explanation }}</div>
            <button class="btn primary start-btn" (click)="closeInstructions()">
              {{ returnIndex() !== null ? 'Back to puzzle' : 'Start puzzles' }} &rarr;
            </button>
          </div>
        } @else {
        <div class="puzzle-title">
          <span>#{{ card.cardNumber }} — {{ card.questionText }}</span>
          @if (card.difficulty) {
            <span class="difficulty-pill" [attr.data-difficulty]="card.difficulty">
              {{ card.difficulty }}
            </span>
          }
        </div>

        @if (cipherTypeLabel(); as label) {
          <div class="cipher-type-label">{{ label }}</div>
        }

        <div class="cipher-display">
          @for (word of cipherWords(); track $index) {
            <span class="cipher-word">
              @for (cell of word; track $index) {
                @if (cell.isLetter) {
                  <span
                    class="cipher-cell"
                    [class.selected]="selectedCipher() === cell.key"
                    [class.correct]="solved()"
                    (click)="selectCipher(cell.key)"
                  >
                    <span class="cipher-char">{{ cell.cipher }}</span>
                    <span class="guess-char" [class.filled]="guessFor(cell.key)">
                      {{ guessFor(cell.key) || '\u00A0' }}
                    </span>
                  </span>
                } @else {
                  <span class="cipher-punct">{{ cell.cipher }}</span>
                }
              }
            </span>
          }
        </div>

        @if (solved()) {
          <div class="author-reveal">
            — {{ currentCard()!.cryptogramAuthor }}
          </div>

          @if (currentCard()!.explanation) {
            <div class="explanation-panel">
              <h3 class="section-label">About this quote</h3>
              <p class="explanation-text">{{ currentCard()!.explanation }}</p>
            </div>
          }
        }

        @if (!solved()) {
          <div class="picker-grid">
            @for (letter of alphabet; track letter) {
              <button
                class="picker-btn"
                [class.used]="isLetterUsed(letter)"
                (click)="assignLetter(letter)"
              >{{ letter }}</button>
            }
            <button class="picker-btn clear-btn" (click)="clearSelected()">&#x232b;</button>
          </div>
        }

        <div class="nav-row">
          <button class="nav-btn" [disabled]="currentIndex() <= 0" (click)="prevPuzzle()">&larr;</button>
          <span class="nav-label">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          <button class="nav-btn" [disabled]="currentIndex() >= cards().length - 1" (click)="nextPuzzle()">&rarr;</button>
        </div>

        @if (!solved()) {
          <div class="action-buttons">
            <button class="btn secondary" (click)="useHint()">Hint ({{ hintsUsed() }})</button>
            <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
          </div>
          <button class="give-up-btn" (click)="revealCryptogram()">I give up — show answer</button>
        } @else {
          <div class="action-buttons">
            <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
          </div>
        }
        }
      }
    </div>
  `,
  styles: `
    .cryptogram {
      padding-top: 24px;
      padding-bottom: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 680px;
    }
    .back-btn {
      align-self: flex-start;
      background: none;
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 16px;
      padding: 4px 0;
      &:hover { color: var(--text); }
    }
    .header-bar {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 16px;
      margin-bottom: 16px;
      border-bottom: 2px solid;
    }
    .title-icon { width: 28px; height: 28px; }
    .cat-title { font-size: 1.3rem; flex: 1; margin: 0; }
    .info-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-surface);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background 0.2s, color 0.2s;
      svg { width: 18px; height: 18px; }
      &:hover { background: var(--accent); color: white; }
    }
    .instructions-panel {
      width: 100%;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      animation: slideIn 0.3s ease-out;
    }
    .instructions-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0 0 16px;
    }
    .instructions-body {
      font-size: 0.92rem;
      line-height: 1.7;
      color: var(--text);
      opacity: 0.85;
      text-align: left;
      white-space: pre-line;
      margin-bottom: 24px;
    }
    .start-btn {
      width: auto;
      padding: 14px 32px;
    }
    .puzzle-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .difficulty-pill {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 3px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .difficulty-pill[data-difficulty="Easy"] {
      background: rgba(0, 184, 148, 0.18);
      color: #00b894;
    }
    .difficulty-pill[data-difficulty="Medium"] {
      background: rgba(253, 203, 110, 0.2);
      color: #fdcb6e;
    }
    .difficulty-pill[data-difficulty="Hard"] {
      background: rgba(225, 112, 85, 0.2);
      color: #e17055;
    }
    .difficulty-pill[data-difficulty="Extreme"] {
      background: rgba(162, 94, 255, 0.2);
      color: #a25eff;
    }

    .cipher-type-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      opacity: 0.6;
      margin-bottom: 8px;
    }
    /* Cipher display */
    .cipher-display {
      width: 100%;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 24px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px 16px;
      justify-content: center;
      line-height: 1;
    }
    .cipher-word {
      display: inline-flex;
      gap: 2px;
    }
    .cipher-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 28px;
      cursor: pointer;
      user-select: none;
      border-radius: 4px;
      transition: background 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { background: var(--hover-overlay); }
    }
    .cipher-cell.selected {
      background: rgba(108, 92, 231, 0.25);
      box-shadow: 0 0 0 2px var(--accent);
    }
    .cipher-cell.correct .guess-char {
      color: #00b894;
    }
    .cipher-char {
      font-size: 0.6rem;
      font-weight: 600;
      color: var(--text-muted);
      opacity: 0.6;
      line-height: 1;
      padding-top: 2px;
    }
    .guess-char {
      font-family: 'Poppins', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text);
      min-height: 1.4em;
      border-bottom: 2px solid var(--grid-border);
      width: 100%;
      text-align: center;
      line-height: 1.4;
    }
    .guess-char.filled {
      border-bottom-color: var(--accent);
    }
    .cipher-punct {
      font-family: 'Poppins', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text);
      opacity: 0.5;
      align-self: flex-end;
      line-height: 1.4;
      min-height: 1.4em;
    }

    /* Author reveal */
    .author-reveal {
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: #00b894;
      text-align: center;
      margin-bottom: 20px;
      animation: slideIn 0.3s ease-out;
    }

    /* Letter picker */
    .picker-grid {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 6px;
      width: 100%;
      margin-bottom: 20px;
    }
    .picker-btn {
      aspect-ratio: 1;
      border-radius: 8px;
      background: var(--bg-surface);
      color: var(--text);
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { background: var(--accent); color: white; }
    }
    .picker-btn.used {
      opacity: 0.3;
    }
    .clear-btn {
      font-size: 1.1rem;
    }

    /* Nav & actions — same as matrix */
    .nav-row {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      margin-bottom: 16px;
    }
    .nav-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--bg-surface);
      color: var(--text);
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, opacity 0.2s;
      &:hover:not(:disabled) { background: var(--accent); }
      &:disabled { opacity: 0.3; cursor: default; }
    }
    .nav-label {
      flex: 1;
      text-align: center;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .action-buttons {
      display: flex;
      gap: 10px;
      width: 100%;
      margin-bottom: 8px;
    }
    .btn {
      flex: 1;
      padding: 14px 16px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
      &:disabled { opacity: 0.4; cursor: default; }
    }
    .btn.secondary { background: var(--bg-surface); color: var(--text-muted); }
    .give-up-btn {
      background: none;
      color: var(--text-muted);
      font-size: 0.8rem;
      opacity: 0.5;
      margin-bottom: 20px;
      padding: 8px 0;
      &:hover { opacity: 0.8; text-decoration: underline; }
    }
    .explanation-panel {
      width: 100%;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      animation: slideIn 0.3s ease-out;
    }
    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0 0 8px;
    }
    .explanation-text {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--text);
      opacity: 0.85;
      margin: 0;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
})
export class CryptogramComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private userState = inject(UserStateService);

  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  currentIndex = signal(0);
  guesses = signal<Record<string, string>>({});
  selectedCipher = signal<string | null>(null);
  solved = signal(false);
  hintsUsed = signal(0);
  returnIndex = signal<number | null>(null);

  private solvedPuzzles = signal<number[]>([]);
  private allGuessStates: Record<number, Record<string, string>> = {};

  private categoryId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id')!))
  );

  private categories = toSignal(this.cardService.getCategories(), {
    initialValue: [] as Category[],
  });

  category = computed(() => {
    const id = this.categoryId();
    if (!id) return null;
    return this.categories().find(c => c.id === id) ?? null;
  });

  cards = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('id')!),
      switchMap(id => this.cardService.getCardsByCategory(id).pipe(
        switchMap(cards =>
          from(this.userState.loadCryptogramProgress(id)).pipe(
            tap(saved => {
              if (saved) {
                this.currentIndex.set(Math.min(saved.index, cards.length - 1));
                this.solvedPuzzles.set(saved.solvedPuzzles ?? []);
                this.allGuessStates = saved.guessStates ?? {};
                const gs = this.allGuessStates[this.currentIndex()] ?? {};
                this.guesses.set(gs);
                if (this.solvedPuzzles().includes(this.currentIndex())) {
                  this.solved.set(true);
                }
              }
            }),
            map(() => cards),
          )
        ),
      )),
    ),
    { initialValue: [] as Card[] }
  );

  currentCard = computed(() => {
    const c = this.cards();
    const i = this.currentIndex();
    return c.length ? c[i] : null;
  });

  isInstructionCard = computed(() => !this.currentCard()?.cryptogramPlaintext);

  isVigenere = computed(() => this.currentCard()?.difficulty === 'Extreme');

  cipherTypeLabel = computed(() => {
    switch (this.currentCard()?.difficulty) {
      case 'Easy': return 'Caesar Shift';
      case 'Medium': return 'Keyword Cipher';
      case 'Hard': return 'Random Substitution';
      case 'Extreme': return 'Vigenère Cipher';
      default: return '';
    }
  });

  private cipherMap = computed(() => {
    const card = this.currentCard();
    if (!card) return new Map<string, string>();
    switch (card.difficulty) {
      case 'Easy': return buildCaesarMap(card.id);
      case 'Medium': return buildKeywordMap(card.id);
      default: return buildRandomMap(card.id);
    }
  });

  private reverseCipherMap = computed(() => {
    const m = new Map<string, string>();
    if (this.isVigenere()) {
      const card = this.currentCard();
      if (!card?.cryptogramPlaintext) return m;
      const text = card.cryptogramPlaintext.toUpperCase();
      let idx = 0;
      for (const ch of text) {
        if (/[A-Z]/.test(ch)) {
          m.set(String(idx), ch);
          idx++;
        }
      }
      return m;
    }
    for (const [plain, cipher] of this.cipherMap()) {
      m.set(cipher, plain);
    }
    return m;
  });

  cipherWords = computed(() => {
    const card = this.currentCard();
    if (!card?.cryptogramPlaintext) return [];
    const text = card.cryptogramPlaintext.toUpperCase();
    const words = text.split(/\s+/);

    if (this.isVigenere()) {
      const keyword = getVigenereKeyword(card.id);
      let letterIdx = 0;
      return words.map(word => {
        const cells: { cipher: string; isLetter: boolean; key: string }[] = [];
        for (const ch of word) {
          if (/[A-Z]/.test(ch)) {
            const shift = keyword.charCodeAt(letterIdx % keyword.length) - 65;
            const cipher = String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
            cells.push({ cipher, isLetter: true, key: String(letterIdx) });
            letterIdx++;
          } else {
            cells.push({ cipher: ch, isLetter: false, key: '' });
          }
        }
        return cells;
      });
    }

    const cmap = this.cipherMap();
    return words.map(word => {
      const cells: { cipher: string; isLetter: boolean; key: string }[] = [];
      for (const ch of word) {
        if (/[A-Z]/.test(ch)) {
          const cipher = cmap.get(ch) ?? ch;
          cells.push({ cipher, isLetter: true, key: cipher });
        } else {
          cells.push({ cipher: ch, isLetter: false, key: '' });
        }
      }
      return cells;
    });
  });

  ngOnDestroy() {
    this.persistProgress();
  }

  guessFor(cipherLetter: string): string {
    return this.guesses()[cipherLetter] ?? '';
  }

  isLetterUsed(letter: string): boolean {
    if (this.isVigenere()) return false;
    return Object.values(this.guesses()).includes(letter);
  }

  selectCipher(cipherLetter: string): void {
    if (this.solved()) return;
    this.selectedCipher.set(
      this.selectedCipher() === cipherLetter ? null : cipherLetter
    );
  }

  assignLetter(letter: string): void {
    const sel = this.selectedCipher();
    if (!sel || this.solved()) return;

    this.guesses.update(g => {
      const updated = { ...g };
      if (!this.isVigenere()) {
        // For substitution ciphers, remove this letter if assigned elsewhere
        for (const [k, v] of Object.entries(updated)) {
          if (v === letter) delete updated[k];
        }
      }
      updated[sel] = letter;
      return updated;
    });

    this.advanceSelection(sel);
    this.checkSolved();
    this.persistProgress();
  }

  clearSelected(): void {
    const sel = this.selectedCipher();
    if (!sel || this.solved()) return;

    this.guesses.update(g => {
      const updated = { ...g };
      delete updated[sel];
      return updated;
    });

    this.persistProgress();
  }

  useHint(): void {
    if (this.solved()) return;
    const reverse = this.reverseCipherMap();
    const current = this.guesses();

    // Find an unguessed or incorrectly guessed key
    const unresolved = [...reverse.entries()].find(
      ([key, plain]) => current[key] !== plain
    );
    if (!unresolved) return;

    const [key, plain] = unresolved;
    this.guesses.update(g => {
      const updated = { ...g };
      if (!this.isVigenere()) {
        // For substitution ciphers, remove plain if used elsewhere
        for (const [k, v] of Object.entries(updated)) {
          if (v === plain) delete updated[k];
        }
      }
      updated[key] = plain;
      return updated;
    });

    this.hintsUsed.update(h => h + 1);
    this.checkSolved();
    this.persistProgress();
  }

  revealCryptogram(): void {
    const reverse = this.reverseCipherMap();
    const allGuesses: Record<string, string> = {};
    for (const [cipher, plain] of reverse) {
      allGuesses[cipher] = plain;
    }
    this.guesses.set(allGuesses);
    this.selectedCipher.set(null);
    this.solved.set(true);
    const idx = this.currentIndex();
    if (!this.solvedPuzzles().includes(idx)) {
      this.solvedPuzzles.update(sp => [...sp, idx]);
    }
    this.persistProgress();
  }

  resetPuzzle(): void {
    this.guesses.set({});
    this.solved.set(false);
    this.selectedCipher.set(null);
    this.hintsUsed.set(0);

    const idx = this.currentIndex();
    this.solvedPuzzles.update(sp => sp.filter(i => i !== idx));
    this.persistProgress();
  }

  prevPuzzle(): void {
    if (this.currentIndex() <= 0) return;
    this.saveCurrent();
    this.currentIndex.update(i => i - 1);
    this.loadCurrentPuzzle();
  }

  nextPuzzle(): void {
    if (this.currentIndex() >= this.cards().length - 1) return;
    this.saveCurrent();
    this.currentIndex.update(i => i + 1);
    this.loadCurrentPuzzle();
  }

  goBack(): void {
    this.router.navigate(['/puzzles']);
  }

  showInstructions(): void {
    if (this.currentIndex() === 0) return;
    this.returnIndex.set(this.currentIndex());
    this.saveCurrent();
    this.currentIndex.set(0);
    this.loadCurrentPuzzle();
  }

  closeInstructions(): void {
    const ri = this.returnIndex();
    this.returnIndex.set(null);
    if (ri !== null) {
      this.currentIndex.set(ri);
      this.loadCurrentPuzzle();
    } else {
      this.nextPuzzle();
    }
  }

  private advanceSelection(current: string): void {
    const reverse = this.reverseCipherMap();
    const cipherLetters = this.orderedCipherLetters();
    const idx = cipherLetters.indexOf(current);
    if (idx === -1) return;

    const guesses = this.guesses();
    for (let i = 1; i < cipherLetters.length; i++) {
      const next = cipherLetters[(idx + i) % cipherLetters.length];
      if (!guesses[next] && reverse.has(next)) {
        this.selectedCipher.set(next);
        return;
      }
    }
    this.selectedCipher.set(null);
  }

  private orderedCipherLetters(): string[] {
    const words = this.cipherWords();
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const word of words) {
      for (const cell of word) {
        if (cell.isLetter && !seen.has(cell.key)) {
          seen.add(cell.key);
          ordered.push(cell.key);
        }
      }
    }
    return ordered;
  }

  private checkSolved(): void {
    const reverse = this.reverseCipherMap();
    const current = this.guesses();

    for (const [cipher, plain] of reverse) {
      if (current[cipher] !== plain) return;
    }

    this.solved.set(true);
    this.selectedCipher.set(null);
    const idx = this.currentIndex();
    if (!this.solvedPuzzles().includes(idx)) {
      this.solvedPuzzles.update(sp => [...sp, idx]);
    }
    this.persistProgress();
  }

  private saveCurrent(): void {
    this.persistProgress();
  }

  private loadCurrentPuzzle(): void {
    const idx = this.currentIndex();
    const gs = this.allGuessStates[idx] ?? {};
    this.guesses.set(gs);
    this.solved.set(this.solvedPuzzles().includes(idx));
    this.selectedCipher.set(null);
    this.hintsUsed.set(0);
    this.persistProgress();
  }

  private persistProgress(): void {
    const catId = this.categoryId();
    if (!catId) return;
    this.allGuessStates[this.currentIndex()] = this.guesses();
    this.userState.saveCryptogramProgress(catId, {
      index: this.currentIndex(),
      guessStates: this.allGuessStates,
      solvedPuzzles: this.solvedPuzzles(),
    });
  }
}

// ── Cipher Generation ───────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0x100000000);
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Easy: every letter shifts by the same amount
function buildCaesarMap(cardId: string): Map<string, string> {
  const rand = seededRandom(hashString(cardId));
  const shift = 3 + Math.floor(rand() * 20);
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const m = new Map<string, string>();
  for (let i = 0; i < 26; i++) {
    m.set(alpha[i], alpha[(i + shift) % 26]);
  }
  return m;
}

// Medium: keyword determines the cipher alphabet
function buildKeywordMap(cardId: string): Map<string, string> {
  const keywords = ['PHILOSOPHY', 'KNOWLEDGE', 'THINKING', 'DISCOVERY', 'SOCRATES'];
  const rand = seededRandom(hashString(cardId));
  const keyword = keywords[Math.floor(rand() * keywords.length)];
  const seen = new Set<string>();
  const cipher: string[] = [];
  for (const ch of keyword) {
    if (!seen.has(ch)) { seen.add(ch); cipher.push(ch); }
  }
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    if (!seen.has(ch)) cipher.push(ch);
  }
  const m = new Map<string, string>();
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 26; i++) {
    m.set(alpha[i], cipher[i]);
  }
  return m;
}

// Hard: random derangement (no letter maps to itself)
function buildRandomMap(cardId: string): Map<string, string> {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const rand = seededRandom(hashString(cardId));
  let shuffled: string[];
  let attempts = 0;
  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (letters.some((ch, i) => ch === shuffled[i]) && attempts < 100);
  for (let i = 0; i < letters.length; i++) {
    if (shuffled[i] === letters[i]) {
      const swap = (i + 1) % letters.length;
      [shuffled[i], shuffled[swap]] = [shuffled[swap], shuffled[i]];
    }
  }
  const m = new Map<string, string>();
  for (let i = 0; i < letters.length; i++) {
    m.set(letters[i], shuffled[i]);
  }
  return m;
}

// Extreme: Vigenere keyword (each position uses a different shift)
function getVigenereKeyword(cardId: string): string {
  const keywords = ['THINK', 'REASON', 'WISDOM', 'TRUTH', 'CIPHER'];
  const rand = seededRandom(hashString(cardId));
  return keywords[Math.floor(rand() * keywords.length)];
}
