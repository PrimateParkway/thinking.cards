import { Component, inject, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, tap, from } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CelebrationService } from '../../core/services/celebration.service';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { PuzzleStatsComponent } from '../../shared/components/puzzle-stats.component';
import { NoteButtonComponent } from '../../shared/components/note-button.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-codebreaker',
  imports: [CategoryIconComponent, PuzzleStatsComponent, NoteButtonComponent],
  template: `
    <div class="codebreaker container">
      <button class="back-btn" (click)="goBack()">&larr; Back</button>

      @if (category(); as cat) {
        <div class="header-bar" [style.border-color]="cat.color">
          <app-category-icon [name]="cat.name" class="title-icon" />
          <h2 class="cat-title" [style.color]="cat.color">{{ cat.name }}</h2>
          <button class="info-btn" (click)="showInstructions()" title="How to play" aria-label="How to play">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
          <button class="info-btn" (click)="showStats.set(true)" title="Puzzle progress" aria-label="Puzzle progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          @if (!isInstructionCard() && currentCard(); as c) {
            <app-note-button [cardId]="c.id" [cardLabel]="'#' + c.cardNumber + ' · ' + cat.name" />
          }
          <span class="timer">{{ formattedTime() }}</span>
          @if (bestTimeForCurrent()) {
            <span class="best-time">{{ bestTimeForCurrent() }}</span>
          }
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

        <div class="clue-table">
          @for (clue of card.codebreakerClues; track $index) {
            <div class="clue-row">
              <div class="clue-digits">
                @for (digit of clue.guess.split(''); track $index) {
                  <span class="clue-digit">{{ digit }}</span>
                }
              </div>
              <div class="clue-feedback">
                <span class="feedback-correct">{{ clue.correct }}</span> correct
                <span class="feedback-sep">&middot;</span>
                <span class="feedback-misplaced">{{ clue.misplaced }}</span> misplaced
              </div>
            </div>
          }
        </div>

        <div class="answer-section">
          <p class="answer-label">Your Answer</p>
          <div class="answer-row">
            @for (digit of answer(); track $index) {
              <button
                class="answer-digit"
                [class.selected]="selectedDigitIndex() === $index"
                [class.correct]="solved()"
                [class.filled]="digit !== ''"
                (click)="selectDigit($index)"
              >{{ digit || '\u00A0' }}</button>
            }
          </div>
        </div>

        @if (!solved()) {
          <div class="numpad">
            @for (n of numpadKeys; track n) {
              <button class="numpad-btn" (click)="enterDigit(n)">{{ n }}</button>
            }
            <button class="numpad-btn clear-btn" (click)="clearDigit()">&#x232b;</button>
          </div>

          <button class="btn primary check-btn" (click)="checkAnswer()" [disabled]="!isAnswerComplete()">
            Check Answer
          </button>
        }

        @if (solved() && !isGaveUp()) {
          <div class="solved-message">Cracked it!</div>
        }

        <div class="nav-row">
          <button class="nav-btn" [disabled]="currentIndex() <= 0" (click)="prevPuzzle()">&larr;</button>
          <span class="nav-label">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          <button class="nav-btn" [disabled]="currentIndex() >= cards().length - 1" (click)="nextPuzzle()">&rarr;</button>
        </div>

        @if (!solved()) {
          <div class="action-buttons">
            <button class="btn secondary" (click)="useHint()">Hint</button>
            <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
          </div>
          <button class="give-up-btn" (click)="revealAnswer()">I give up — show answer</button>
        } @else {
          <div class="action-buttons">
            <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
          </div>
        }
        }
      }

      @if (showStats()) {
        <app-puzzle-stats
          [cards]="cards()"
          [solvedPuzzles]="solvedPuzzles()"
          [gaveUpPuzzles]="gaveUpPuzzles()"
          [startedPuzzles]="startedPuzzles()"
          [currentIndex]="currentIndex()"
          [completionTimes]="bestTimes"
          (selectPuzzle)="jumpToPuzzle($event)"
          (close)="showStats.set(false)"
        />
      }
    </div>
  `,
  styles: `
    .codebreaker {
      padding-top: 24px;
      padding-bottom: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 480px;
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
    .timer {
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .best-time {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      opacity: 0.6;
      font-variant-numeric: tabular-nums;
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

    /* Clue table */
    .clue-table {
      width: 100%;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .clue-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .clue-digits {
      display: flex;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }
    .clue-digit {
      flex: 1 1 0;
      max-width: 36px;
      min-width: 0;
      height: 40px;
      border-radius: 8px;
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
    }
    .clue-feedback {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .feedback-correct {
      font-weight: 700;
      color: #00b894;
    }
    .feedback-misplaced {
      font-weight: 700;
      color: #fdcb6e;
    }
    .feedback-sep {
      margin: 0 4px;
      opacity: 0.4;
    }

    /* Answer row */
    .answer-section {
      width: 100%;
      margin-bottom: 16px;
      text-align: center;
    }
    .answer-label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin: 0 0 8px;
    }
    .answer-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }
    .answer-digit {
      flex: 1 1 0;
      max-width: 48px;
      min-width: 0;
      height: 56px;
      border-radius: 12px;
      background: var(--bg-surface);
      border: 2px solid transparent;
      font-family: 'Poppins', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { background: var(--hover-overlay); }
    }
    .answer-digit.selected {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.25);
    }
    .answer-digit.filled {
      background: rgba(108, 92, 231, 0.1);
    }
    .answer-digit.correct {
      background: rgba(0, 184, 148, 0.18);
      color: #00b894;
      border-color: transparent;
    }

    /* Numpad */
    .numpad {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      width: 100%;
      margin-bottom: 16px;
    }
    .numpad-btn {
      aspect-ratio: 1.4;
      border-radius: 10px;
      background: var(--bg-surface);
      color: var(--text);
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { background: var(--accent); color: white; }
    }
    .clear-btn {
      font-size: 1.3rem;
    }

    /* Check button */
    .check-btn {
      width: 100%;
      margin-bottom: 16px;
    }

    /* Solved */
    .solved-message {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: #00b894;
      text-align: center;
      margin-bottom: 16px;
      animation: slideIn 0.3s ease-out;
    }

    /* Nav & actions */
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
    .btn.primary { background: var(--accent); color: white; }
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
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 400px) {
      .clue-table { padding: 12px; }
      .clue-row { gap: 8px; }
      .clue-digit { font-size: 0.95rem; height: 36px; }
      .clue-feedback { font-size: 0.72rem; }
      .feedback-sep { margin: 0 2px; }
      .answer-digit { font-size: 1.2rem; height: 50px; }
    }
  `
})
export class CodebreakerComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private userState = inject(UserStateService);
  private celebration = inject(CelebrationService);

  readonly numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  currentIndex = signal(0);
  answer = signal<string[]>([]);
  selectedDigitIndex = signal<number | null>(null);
  solved = signal(false);
  returnIndex = signal<number | null>(null);

  showStats = signal(false);
  elapsedSeconds = signal(0);
  solvedPuzzles = signal<number[]>([]);
  gaveUpPuzzles = signal<number[]>([]);
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private allAnswerStates: Record<number, string[]> = {};
  bestTimes: Record<number, number> = {};

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
          from(this.userState.loadCodebreakerProgress(id)).pipe(
            tap(saved => {
              if (saved) {
                this.currentIndex.set(Math.min(saved.index, cards.length - 1));
                this.solvedPuzzles.set(saved.solvedPuzzles ?? []);
                this.gaveUpPuzzles.set(saved.gaveUpPuzzles ?? []);
                this.allAnswerStates = saved.answerStates ?? {};
                this.bestTimes = saved.bestTimes ?? {};
                const savedAnswer = this.allAnswerStates[this.currentIndex()];
                if (savedAnswer) {
                  this.answer.set([...savedAnswer]);
                } else {
                  this.initAnswer(cards[this.currentIndex()]);
                }
                if (this.solvedPuzzles().includes(this.currentIndex())) {
                  this.solved.set(true);
                }
              } else {
                this.initAnswer(cards[this.currentIndex()]);
              }
              this.startTimer();
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

  isInstructionCard = computed(() => !this.currentCard()?.codebreakerAnswer);

  formattedTime = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });

  bestTimeForCurrent = computed(() => {
    const secs = this.bestTimes[this.currentIndex()];
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `Best: ${m}:${s.toString().padStart(2, '0')}`;
  });

  startedPuzzles = computed(() =>
    Object.keys(this.allAnswerStates)
      .map(Number)
      .filter(i => {
        const a = this.allAnswerStates[i];
        return a && a.some(d => d !== '');
      })
  );

  ngOnDestroy() {
    this.stopTimer();
    this.persistProgress();
  }

  isGaveUp(): boolean {
    return this.gaveUpPuzzles().includes(this.currentIndex());
  }

  isAnswerComplete(): boolean {
    return this.answer().every(d => d !== '');
  }

  selectDigit(index: number): void {
    if (this.solved()) return;
    this.selectedDigitIndex.set(
      this.selectedDigitIndex() === index ? null : index
    );
  }

  enterDigit(digit: string): void {
    if (this.solved()) return;

    // Default to the next empty slot so the player can just start typing.
    const sel = this.selectedDigitIndex() ?? this.firstEmptyIndex();
    if (sel === null) return;

    this.answer.update(a => {
      const updated = [...a];
      updated[sel] = digit;
      return updated;
    });

    this.advanceSelection(sel);
    this.persistProgress();
  }

  private firstEmptyIndex(): number | null {
    const idx = this.answer().findIndex(d => d === '');
    return idx === -1 ? null : idx;
  }

  clearDigit(): void {
    const sel = this.selectedDigitIndex();
    if (sel === null || this.solved()) return;

    this.answer.update(a => {
      const updated = [...a];
      updated[sel] = '';
      return updated;
    });
    this.persistProgress();
  }

  checkAnswer(): void {
    if (!this.isAnswerComplete() || this.solved()) return;

    const card = this.currentCard();
    if (!card?.codebreakerAnswer) return;

    if (this.answer().join('') === card.codebreakerAnswer) {
      this.markSolved();
    }
  }

  useHint(): void {
    if (this.solved()) return;
    const card = this.currentCard();
    if (!card?.codebreakerAnswer) return;

    const answerDigits = card.codebreakerAnswer.split('');
    const current = this.answer();

    const unresolved = answerDigits.findIndex((d, i) => current[i] !== d);
    if (unresolved === -1) return;

    this.answer.update(a => {
      const updated = [...a];
      updated[unresolved] = answerDigits[unresolved];
      return updated;
    });

    if (this.answer().join('') === card.codebreakerAnswer) {
      this.markSolved();
    }
    this.persistProgress();
  }

  revealAnswer(): void {
    const card = this.currentCard();
    if (!card?.codebreakerAnswer) return;

    this.answer.set(card.codebreakerAnswer.split(''));
    this.selectedDigitIndex.set(null);
    this.solved.set(true);
    this.stopTimer();

    const idx = this.currentIndex();
    if (!this.gaveUpPuzzles().includes(idx)) {
      this.gaveUpPuzzles.update(gp => [...gp, idx]);
    }
    this.persistProgress();
  }

  resetPuzzle(): void {
    this.initAnswer(this.currentCard());
    this.solved.set(false);
    this.selectedDigitIndex.set(null);
    this.elapsedSeconds.set(0);

    const idx = this.currentIndex();
    this.solvedPuzzles.update(sp => sp.filter(i => i !== idx));
    this.gaveUpPuzzles.update(gp => gp.filter(i => i !== idx));
    this.persistProgress();
    this.startTimer();
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
    this.stopTimer();
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

  jumpToPuzzle(idx: number): void {
    this.saveCurrent();
    this.currentIndex.set(idx);
    this.loadCurrentPuzzle();
    this.showStats.set(false);
  }

  private initAnswer(card: Card | null): void {
    const len = card?.codebreakerAnswer?.length ?? 3;
    this.answer.set(Array(len).fill(''));
  }

  private advanceSelection(current: number): void {
    const len = this.answer().length;
    for (let i = 1; i < len; i++) {
      const next = (current + i) % len;
      if (this.answer()[next] === '') {
        this.selectedDigitIndex.set(next);
        return;
      }
    }
    this.selectedDigitIndex.set(null);
  }

  private markSolved(): void {
    this.solved.set(true);
    this.stopTimer();
    this.selectedDigitIndex.set(null);
    const idx = this.currentIndex();
    const isFirstSolve = !this.solvedPuzzles().includes(idx);
    if (isFirstSolve) {
      this.solvedPuzzles.update(sp => [...sp, idx]);
      this.celebration.trigger();
    }

    const elapsed = this.elapsedSeconds();
    if (elapsed > 0) {
      const prev = this.bestTimes[idx];
      if (prev === undefined || elapsed < prev) {
        this.bestTimes[idx] = elapsed;
      }
    }
    this.persistProgress();
  }

  private saveCurrent(): void {
    this.persistProgress();
  }

  private loadCurrentPuzzle(): void {
    const idx = this.currentIndex();
    const savedAnswer = this.allAnswerStates[idx];
    if (savedAnswer) {
      this.answer.set([...savedAnswer]);
    } else {
      this.initAnswer(this.cards()[idx]);
    }
    this.solved.set(this.solvedPuzzles().includes(idx) || this.gaveUpPuzzles().includes(idx));
    this.selectedDigitIndex.set(null);
    this.elapsedSeconds.set(0);
    if (this.isInstructionCard()) this.stopTimer();
    else if (!this.solved()) this.startTimer();
    else this.stopTimer();
    this.persistProgress();
  }

  private startTimer(): void {
    this.stopTimer();
    if (this.solved()) return;
    this.timerRef = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  private persistProgress(): void {
    const catId = this.categoryId();
    if (!catId) return;
    this.allAnswerStates[this.currentIndex()] = this.answer();
    this.userState.saveCodebreakerProgress(catId, {
      index: this.currentIndex(),
      answerStates: this.allAnswerStates,
      solvedPuzzles: this.solvedPuzzles(),
      gaveUpPuzzles: this.gaveUpPuzzles(),
      bestTimes: this.bestTimes,
    });
  }
}
