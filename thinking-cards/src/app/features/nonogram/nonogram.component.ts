import { Component, inject, signal, computed, OnDestroy , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, tap, from } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CelebrationService } from '../../core/services/celebration.service';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { PuzzleStatsComponent } from '../../shared/components/puzzle-stats.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-nonogram',
  imports: [CategoryIconComponent, PuzzleStatsComponent],
  template: `
    <div class="nonogram container">
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
          <button class="info-btn" (click)="showStats.set(true)" title="Puzzle progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
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
            <span>#{{ card.cardNumber }} &mdash; {{ card.questionText }}</span>
            @if (card.difficulty) {
              <span class="difficulty-pill" [attr.data-difficulty]="card.difficulty">
                {{ card.difficulty }}
              </span>
            }
          </div>

          <div class="grid-wrapper" [class]="gridSizeClass()">
            <div class="nonogram-grid"
                 [style.grid-template-columns]="'auto repeat(' + gridCols() + ', 1fr)'"
                 [style.grid-template-rows]="'auto repeat(' + gridRows() + ', 1fr)'">

              <!-- Corner spacer -->
              <div class="corner-spacer"></div>

              <!-- Column clues -->
              @for (clues of colClues(); track $index) {
                <div class="col-clue-cell">
                  @for (n of clues; track $index) {
                    <span class="clue-num">{{ n }}</span>
                  }
                </div>
              }

              <!-- Rows: row clue + cells -->
              @for (r of rowRange(); track r) {
                <div class="row-clue-cell">
                  @for (n of rowClues()[r]; track $index) {
                    <span class="clue-num">{{ n }}</span>
                  }
                </div>
                @for (c of colRange(); track c) {
                  <div
                    class="nono-cell"
                    [class.cell-filled]="cellAt(r, c) === 1"
                    [class.cell-solved]="solved()"
                    (click)="toggleCell(r, c)"
                  >
                  </div>
                }
              }
            </div>
          </div>

          @if (solved()) {
            @if (card.explanation) {
              <div class="explanation-panel">
                <h3 class="section-label">About this puzzle</h3>
                <p class="explanation-text">{{ card.explanation }}</p>
              </div>
            }
          }

          <div class="nav-row">
            <button class="nav-btn" [disabled]="currentIndex() <= 0" (click)="prevPuzzle()">&larr;</button>
            <span class="nav-label">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
            <button class="nav-btn" [disabled]="currentIndex() >= cards().length - 1" (click)="nextPuzzle()">&rarr;</button>
          </div>

          @if (!solved()) {
            <div class="action-buttons">
              <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
            </div>
            <button class="give-up-btn" (click)="revealPuzzle()">I give up &mdash; show answer</button>
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
    .nonogram {
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

    /* Instructions */
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

    /* Grid */
    .grid-wrapper {
      width: 100%;
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
    }
    .nonogram-grid {
      display: inline-grid;
      gap: 0;
    }
    .corner-spacer {
      /* empty top-left corner */
    }
    .col-clue-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding: 2px 1px 4px;
      gap: 3px;
    }
    .row-clue-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 1px 6px 1px 2px;
      gap: 6px;
    }
    .clue-num {
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      line-height: 1.1;
    }
    .nono-cell {
      border: 1px solid var(--grid-border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--grid-cell-bg);
      transition: background 0.12s;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      &:hover { background: rgba(255, 255, 255, 0.06); }
    }
    .nono-cell.cell-filled {
      background: var(--text);
    }
    .nono-cell.cell-filled.cell-solved {
      background: #00b894;
    }
    /* Responsive cell sizes */
    .grid-5 .nono-cell { width: 48px; height: 48px; }
    .grid-8 .nono-cell { width: 36px; height: 36px; }
    .grid-10 .nono-cell { width: 30px; height: 30px; }
    .grid-15 .nono-cell { width: 22px; height: 22px; }
    .grid-8 .clue-num { font-size: 0.65rem; }
    .grid-10 .clue-num { font-size: 0.6rem; }
    .grid-15 .clue-num { font-size: 0.52rem; }
    .grid-15 .row-clue-cell { gap: 4px; }
    .grid-15 .col-clue-cell { gap: 2px; }

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
export class NonogramComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private userState = inject(UserStateService);
  private celebration = inject(CelebrationService);

  currentIndex = signal(0);
  gridState = signal<Record<string, number>>({});
  solved = signal(false);
  returnIndex = signal<number | null>(null);
  elapsedSeconds = signal(0);

  showStats = signal(false);
  solvedPuzzles = signal<number[]>([]);
  gaveUpPuzzles = signal<number[]>([]);
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private allGridStates: Record<number, Record<string, number>> = {};
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
          from(this.userState.loadNonogramProgress(id)).pipe(
            tap(saved => {
              if (saved) {
                this.currentIndex.set(Math.min(saved.index, cards.length - 1));
                this.solvedPuzzles.set(saved.solvedPuzzles ?? []);
                this.gaveUpPuzzles.set(saved.gaveUpPuzzles ?? []);
                this.allGridStates = saved.gridStates ?? {};
                this.bestTimes = saved.bestTimes ?? {};
                const gs = this.allGridStates[this.currentIndex()] ?? {};
                this.gridState.set(gs);
                if (this.solvedPuzzles().includes(this.currentIndex())) {
                  this.solved.set(true);
                }
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

  isInstructionCard = computed(() => !this.currentCard()?.nonogramSolution?.length);

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

  private solution = computed(() => {
    const card = this.currentCard();
    if (!card?.nonogramSolution?.length || !card.nonogramCols) return [];
    const flat = card.nonogramSolution;
    const cols = card.nonogramCols;
    const rows: number[][] = [];
    for (let i = 0; i < flat.length; i += cols) {
      rows.push(flat.slice(i, i + cols));
    }
    return rows;
  });

  gridRows = computed(() => this.solution().length);
  gridCols = computed(() => this.solution()[0]?.length ?? 0);

  rowRange = computed(() => Array.from({ length: this.gridRows() }, (_, i) => i));
  colRange = computed(() => Array.from({ length: this.gridCols() }, (_, i) => i));

  gridSizeClass = computed(() => {
    const cols = this.gridCols();
    if (cols <= 5) return 'grid-5';
    if (cols <= 8) return 'grid-8';
    if (cols <= 10) return 'grid-10';
    return 'grid-15';
  });

  rowClues = computed(() => this.solution().map(row => computeClues(row)));

  colClues = computed(() => {
    const sol = this.solution();
    if (!sol.length) return [];
    const cols = sol[0].length;
    const result: number[][] = [];
    for (let c = 0; c < cols; c++) {
      const col = sol.map(row => row[c]);
      result.push(computeClues(col));
    }
    return result;
  });

  ngOnDestroy() {
    this.stopTimer();
    this.persistProgress();
  }

  cellAt(row: number, col: number): number {
    return this.gridState()[`${row},${col}`] ?? 0;
  }

  toggleCell(row: number, col: number): void {
    if (this.solved()) return;
    const key = `${row},${col}`;
    const current = this.gridState()[key] ?? 0;
    this.gridState.update(gs => ({ ...gs, [key]: current === 1 ? 0 : 1 }));
    this.checkSolved();
    this.persistProgress();
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
    const ret = this.returnIndex();
    this.returnIndex.set(null);
    if (ret !== null) {
      this.currentIndex.set(ret);
      this.loadCurrentPuzzle();
    } else {
      this.nextPuzzle();
    }
  }

  startedPuzzles = computed(() =>
    Object.keys(this.allGridStates)
      .map(Number)
      .filter(i => Object.keys(this.allGridStates[i] ?? {}).length > 0)
  );

  jumpToPuzzle(idx: number): void {
    this.saveCurrent();
    this.currentIndex.set(idx);
    this.loadCurrentPuzzle();
    this.showStats.set(false);
  }

  revealPuzzle(): void {
    const sol = this.solution();
    const newState: Record<string, number> = {};
    for (let r = 0; r < sol.length; r++) {
      for (let c = 0; c < sol[r].length; c++) {
        newState[`${r},${c}`] = sol[r][c];
      }
    }
    this.gridState.set(newState);
    this.solved.set(true);
    this.stopTimer();

    const idx = this.currentIndex();
    if (!this.gaveUpPuzzles().includes(idx)) {
      this.gaveUpPuzzles.update(gp => [...gp, idx]);
    }
    this.persistProgress();
  }

  resetPuzzle(): void {
    this.gridState.set({});
    this.solved.set(false);
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

  private checkSolved(): void {
    const sol = this.solution();
    if (!sol.length) return;
    const gs = this.gridState();

    for (let r = 0; r < sol.length; r++) {
      for (let c = 0; c < sol[r].length; c++) {
        const state = gs[`${r},${c}`] ?? 0;
        if (sol[r][c] === 1 && state !== 1) return;
        if (sol[r][c] === 0 && state === 1) return;
      }
    }
    this.markSolved();
  }

  private markSolved(): void {
    this.solved.set(true);
    this.stopTimer();
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
    const gs = this.allGridStates[idx] ?? {};
    this.gridState.set(gs);
    this.solved.set(this.solvedPuzzles().includes(idx) || this.gaveUpPuzzles().includes(idx));
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
    this.allGridStates[this.currentIndex()] = this.gridState();
    this.userState.saveNonogramProgress(catId, {
      index: this.currentIndex(),
      gridStates: this.allGridStates,
      solvedPuzzles: this.solvedPuzzles(),
      gaveUpPuzzles: this.gaveUpPuzzles(),
      bestTimes: this.bestTimes,
    });
  }
}

function computeClues(line: number[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell === 1) {
      run++;
    } else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length ? clues : [0];
}
