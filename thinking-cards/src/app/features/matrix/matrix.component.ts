import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, tap, from } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

interface GridSection {
  rowGroup: string;
  colGroup: string;
  rows: string[];
  cols: string[];
  rowLabels: string[];
  colLabels: string[];
}

@Component({
  selector: 'app-matrix',
  imports: [CategoryIconComponent],
  template: `
    <div class="matrix container">
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
          <span class="timer">{{ formattedTime() }}</span>
        </div>
      }

      @if (currentCard(); as card) {
        @if (isInstructionCard()) {
          <div class="instructions-panel">
            <h2 class="instructions-title">{{ card.questionText }}</h2>
            <div class="instructions-body">{{ card.explanation }}</div>
            <button class="btn primary start-btn" (click)="nextPuzzle()">
              Start puzzles &rarr;
            </button>
          </div>
        } @else {
        <div class="puzzle-title">
          <span>#{{ card.cardNumber }} — {{ card.questionText }}</span>
          @if (card.difficulty) {
            <span class="difficulty-pill" [attr.data-difficulty]="card.difficulty">{{ card.difficulty }}</span>
          }
        </div>

        @if (card.matrixScenario) {
          <div class="scenario-strip">{{ card.matrixScenario }}</div>
        }

        <div class="clues-section">
          <h3 class="section-label">Clues</h3>
          <ol class="clues-list">
            @for (clue of card.matrixClues ?? []; track $index) {
              <li
                class="clue-item"
                [class.struck]="clueStruck()[$index]"
                (click)="toggleClue($index)"
              >{{ clue }}</li>
            }
          </ol>
        </div>

        @if (groups().length === 3) {
          <div class="grid-scroll">
            <table class="logic-grid">
              <thead>
                <tr class="group-header-row">
                  <th class="corner-cell"></th>
                  <th class="group-header" [attr.colspan]="groups()[0].items.length">{{ groups()[0].name }}</th>
                  <th class="group-header" [attr.colspan]="groups()[1].items.length">{{ groups()[1].name }}</th>
                </tr>
                <tr>
                  <th class="corner-cell"></th>
                  @for (label of groups()[0].labels; track $index) {
                    <th class="col-header" [title]="groups()[0].items[$index]">{{ label }}</th>
                  }
                  @for (label of groups()[1].labels; track $index) {
                    <th class="col-header" [title]="groups()[1].items[$index]">{{ label }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (ri of rowIndices(2); track ri) {
                  <tr [class.block-start]="ri === 0">
                    <th class="row-header" [title]="groups()[2].items[ri]">{{ groups()[2].labels[ri] }}</th>
                    @for (ci of rowIndices(0); track ci) {
                      <td
                        class="grid-cell"
                        [class.cell-x]="cellAt(0, ri, ci) === 1"
                        [class.cell-check]="cellAt(0, ri, ci) === 2"
                        (click)="cycleAt(0, ri, ci)"
                      >
                        @switch (cellAt(0, ri, ci)) {
                          @case (1) { <span class="cell-mark x-mark">&times;</span> }
                          @case (2) { <span class="cell-mark check-mark">&#10003;</span> }
                        }
                      </td>
                    }
                    @for (ci of rowIndices(1); track ci) {
                      <td
                        class="grid-cell"
                        [class.cell-x]="cellAt(1, ri, ci) === 1"
                        [class.cell-check]="cellAt(1, ri, ci) === 2"
                        [class.section-border-left]="ci === 0"
                        (click)="cycleAt(1, ri, ci)"
                      >
                        @switch (cellAt(1, ri, ci)) {
                          @case (1) { <span class="cell-mark x-mark">&times;</span> }
                          @case (2) { <span class="cell-mark check-mark">&#10003;</span> }
                        }
                      </td>
                    }
                  </tr>
                }
                @for (ri of rowIndices(1); track ri) {
                  <tr [class.block-start]="ri === 0">
                    <th class="row-header" [title]="groups()[1].items[ri]">{{ groups()[1].labels[ri] }}</th>
                    @for (ci of rowIndices(0); track ci) {
                      <td
                        class="grid-cell"
                        [class.cell-x]="cellAt(2, ri, ci) === 1"
                        [class.cell-check]="cellAt(2, ri, ci) === 2"
                        (click)="cycleAt(2, ri, ci)"
                      >
                        @switch (cellAt(2, ri, ci)) {
                          @case (1) { <span class="cell-mark x-mark">&times;</span> }
                          @case (2) { <span class="cell-mark check-mark">&#10003;</span> }
                        }
                      </td>
                    }
                    @for (_ of rowIndices(1); track $index) {
                      <td class="void-cell"></td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (feedbackMsg()) {
          <div class="feedback" [class.success]="feedbackType() === 'success'" [class.error]="feedbackType() === 'error'">
            {{ feedbackMsg() }}
          </div>
        }

        <div class="nav-row">
          <button class="nav-btn" [disabled]="currentIndex() <= 0" (click)="prevPuzzle()">&larr;</button>
          <span class="nav-label">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          <button class="nav-btn" [disabled]="currentIndex() >= cards().length - 1" (click)="nextPuzzle()">&rarr;</button>
        </div>

        @if (!solved()) {
          <div class="action-buttons">
            <button class="btn primary" (click)="checkAnswers()">Check Grid</button>
            <button class="btn secondary" (click)="resetMatrix()">Reset</button>
          </div>
          <button class="give-up-btn" (click)="revealMatrix()">I give up — show answer</button>
        }

        @if (solved()) {
          @if (currentCard()?.matrixExplanation?.length) {
            <div class="explanation-panel">
              <h3 class="section-label">How to solve it</h3>
              <ol class="explanation-list">
                @for (step of currentCard()!.matrixExplanation!; track $index) {
                  <li>{{ step }}</li>
                }
              </ol>
            </div>
          }
          <div class="action-buttons">
            <button class="btn secondary" (click)="resetMatrix()">Reset</button>
          </div>
        }
        }
      }
    </div>
  `,
  styles: `
    .matrix {
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
    .timer {
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .puzzle-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 12px;
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
    .scenario-strip {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--text);
      opacity: 0.85;
      margin-bottom: 16px;
      width: 100%;
    }
    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0 0 8px;
    }
    .clues-section {
      width: 100%;
      margin-bottom: 20px;
      background: var(--bg-card);
      border-radius: 14px;
      padding: 16px 20px;
    }
    .clues-list {
      margin: 0;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .clue-item {
      font-size: 0.92rem;
      line-height: 1.55;
      cursor: pointer;
      user-select: none;
      transition: opacity 0.2s;
      padding: 4px 0;
      &:hover { opacity: 0.8; }
    }
    .clue-item.struck {
      text-decoration: line-through;
      opacity: 0.4;
    }

    /* Unified grid */
    .grid-scroll {
      width: 100%;
      margin-bottom: 20px;
    }
    .logic-grid {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
    }
    .corner-cell {
      width: 22%;
    }
    .group-header-row th {
      padding: 0;
    }
    .group-header {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-align: center;
      padding: 6px 2px 2px !important;
    }
    .col-header {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text);
      writing-mode: vertical-lr;
      transform: rotate(180deg);
      padding: 4px 2px;
      height: 72px;
      vertical-align: bottom;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row-header {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text);
      text-align: right;
      padding-right: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .grid-cell {
      height: 48px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      text-align: center;
      vertical-align: middle;
      cursor: pointer;
      background: var(--bg-surface);
      transition: background 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { background: var(--hover-overlay); }
      &:active { background: rgba(255, 255, 255, 0.08); }
    }
    .cell-x { background: rgba(233, 69, 96, 0.12); }
    .cell-check { background: rgba(0, 184, 148, 0.18); }
    .cell-mark {
      font-size: 1.3rem;
      font-weight: 700;
      line-height: 1;
      pointer-events: none;
    }
    .x-mark { color: #e94560; }
    .check-mark { color: #00b894; }

    .section-border-left {
      border-left: 3px solid rgba(255, 255, 255, 0.3);
    }
    tr.block-start td,
    tr.block-start th {
      border-top: 3px solid rgba(255, 255, 255, 0.3);
    }
    .void-cell {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .feedback {
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 16px;
      animation: slideIn 0.25s ease-out;
    }
    .feedback.success { background: rgba(0, 184, 148, 0.15); color: #00b894; }
    .feedback.error { background: rgba(233, 69, 96, 0.15); color: #e94560; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
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
    .explanation-panel {
      width: 100%;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      animation: slideIn 0.3s ease-out;
    }
    .explanation-list {
      margin: 0;
      padding-left: 20px;
      li {
        font-size: 0.88rem;
        line-height: 1.6;
        margin-bottom: 4px;
      }
    }
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
  `
})
export class MatrixComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private userState = inject(UserStateService);

  currentIndex = signal(0);
  gridState = signal<Record<string, number>>({});
  solved = signal(false);
  elapsedSeconds = signal(0);
  feedbackMsg = signal('');
  feedbackType = signal<'success' | 'error'>('success');
  clueStruck = signal<Record<number, boolean>>({});

  private timerRef: ReturnType<typeof setInterval> | null = null;
  private solvedPuzzles = signal<number[]>([]);
  private allGridStates: Record<number, Record<string, number>> = {};

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
      switchMap(id => this.cardService.getCardsByCategory(id)),
      switchMap(cards =>
        from(this.userState.loadMatrixProgress(this.categoryId()!)).pipe(
          tap(saved => {
            if (saved) {
              this.currentIndex.set(Math.min(saved.index, cards.length - 1));
              this.solvedPuzzles.set(saved.solvedPuzzles ?? []);
              this.allGridStates = saved.gridStates ?? {};
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
    ),
    { initialValue: [] as Card[] }
  );

  currentCard = computed(() => {
    const c = this.cards();
    const i = this.currentIndex();
    return c.length ? c[i] : null;
  });

  isInstructionCard = computed(() => !this.currentCard()?.matrixGroups?.length);

  groups = computed(() => this.currentCard()?.matrixGroups ?? []);

  gridSections = computed<GridSection[]>(() => {
    const g = this.groups();
    if (g.length < 3) return [];
    const [g0, g1, g2] = g;
    return [
      { rowGroup: g2.name, colGroup: g0.name, rows: g2.items, cols: g0.items, rowLabels: g2.labels, colLabels: g0.labels },
      { rowGroup: g2.name, colGroup: g1.name, rows: g2.items, cols: g1.items, rowLabels: g2.labels, colLabels: g1.labels },
      { rowGroup: g1.name, colGroup: g0.name, rows: g1.items, cols: g0.items, rowLabels: g1.labels, colLabels: g0.labels },
    ];
  });

  formattedTime = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });

  ngOnDestroy() {
    this.stopTimer();
  }

  rowIndices(groupIdx: number): number[] {
    const g = this.groups();
    if (!g[groupIdx]) return [];
    return g[groupIdx].items.map((_, i) => i);
  }

  cellAt(sectionIdx: number, ri: number, ci: number): number {
    const section = this.gridSections()[sectionIdx];
    if (!section) return 0;
    return this.gridState()[this.cellKey(section, ri, ci)] ?? 0;
  }

  cycleAt(sectionIdx: number, ri: number, ci: number): void {
    if (this.solved()) return;
    const section = this.gridSections()[sectionIdx];
    if (!section) return;
    const key = this.cellKey(section, ri, ci);
    const current = this.gridState()[key] ?? 0;
    const next = (current + 1) % 3;
    this.gridState.update(gs => ({ ...gs, [key]: next }));
    this.clearFeedback();
    this.persistProgress();
    this.checkWin();
  }

  toggleClue(index: number): void {
    this.clueStruck.update(cs => ({ ...cs, [index]: !cs[index] }));
  }

  checkAnswers(): void {
    const card = this.currentCard();
    if (!card?.matrixSolution || !Object.keys(card.matrixSolution).length) {
      this.feedbackMsg.set('No solution data for this puzzle.');
      this.feedbackType.set('error');
      return;
    }

    const checkedCells = Object.values(this.gridState()).filter(v => v === 2).length;
    const expectedChecks = this.expectedCheckCount();
    if (checkedCells < expectedChecks) {
      this.feedbackMsg.set(`Place all checkmarks first (${checkedCells}/${expectedChecks}).`);
      this.feedbackType.set('error');
      return;
    }

    const errors = this.countErrors();
    if (errors === 0) {
      this.markSolved();
    } else {
      this.feedbackMsg.set(`${errors} cell${errors > 1 ? 's are' : ' is'} incorrect.`);
      this.feedbackType.set('error');
    }
  }

  revealMatrix(): void {
    const card = this.currentCard();
    if (!card?.matrixSolution || !card.matrixGroups) return;
    const sections = this.gridSections();
    const newState: Record<string, number> = {};

    for (const section of sections) {
      for (let ri = 0; ri < section.rows.length; ri++) {
        for (let ci = 0; ci < section.cols.length; ci++) {
          const key = this.cellKey(section, ri, ci);
          newState[key] = this.isSolutionCell(card, section, ri, ci) ? 2 : 1;
        }
      }
    }
    this.gridState.set(newState);
    this.markSolved();
  }

  resetMatrix(): void {
    this.gridState.set({});
    this.solved.set(false);
    this.clueStruck.set({});
    this.clearFeedback();
    this.elapsedSeconds.set(0);

    const idx = this.currentIndex();
    this.solvedPuzzles.update(sp => sp.filter(i => i !== idx));
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
    this.saveCurrent();
    this.currentIndex.set(0);
    this.loadCurrentPuzzle();
  }

  private expectedCheckCount(): number {
    const sections = this.gridSections();
    return sections.reduce((sum, s) => sum + s.rows.length, 0);
  }

  private cellKey(section: GridSection, ri: number, ci: number): string {
    return `${section.rowGroup}:${section.rows[ri]}|${section.colGroup}:${section.cols[ci]}`;
  }

  private isSolutionCell(card: Card, section: GridSection, ri: number, ci: number): boolean {
    const solution = card.matrixSolution!;
    const rowItem = section.rows[ri];
    const colItem = section.cols[ci];

    for (const [item, pairings] of Object.entries(solution)) {
      const group = [item, ...Object.values(pairings)];
      if (group.includes(rowItem) && group.includes(colItem)) {
        return true;
      }
    }
    return false;
  }

  private countErrors(): number {
    const card = this.currentCard();
    if (!card?.matrixSolution || !Object.keys(card.matrixSolution).length) return -1;
    const sections = this.gridSections();
    let errors = 0;

    for (const section of sections) {
      for (let ri = 0; ri < section.rows.length; ri++) {
        for (let ci = 0; ci < section.cols.length; ci++) {
          const key = this.cellKey(section, ri, ci);
          const value = this.gridState()[key] ?? 0;
          const shouldBeChecked = this.isSolutionCell(card, section, ri, ci);
          if (shouldBeChecked && value !== 2) errors++;
          if (!shouldBeChecked && value === 2) errors++;
        }
      }
    }
    return errors;
  }

  private checkWin(): void {
    const card = this.currentCard();
    if (!card?.matrixSolution) return;
    const sections = this.gridSections();

    for (const section of sections) {
      for (let ri = 0; ri < section.rows.length; ri++) {
        for (let ci = 0; ci < section.cols.length; ci++) {
          const key = this.cellKey(section, ri, ci);
          const value = this.gridState()[key] ?? 0;
          if (value === 0) return;
          const shouldBeChecked = this.isSolutionCell(card, section, ri, ci);
          if (shouldBeChecked && value !== 2) return;
          if (!shouldBeChecked && value === 2) return;
        }
      }
    }
    this.markSolved();
  }

  private markSolved(): void {
    this.solved.set(true);
    this.stopTimer();
    this.feedbackMsg.set('Puzzle solved!');
    this.feedbackType.set('success');

    const idx = this.currentIndex();
    if (!this.solvedPuzzles().includes(idx)) {
      this.solvedPuzzles.update(sp => [...sp, idx]);
    }
    this.persistProgress();
  }

  private clearFeedback(): void {
    this.feedbackMsg.set('');
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

  private saveCurrent(): void {
    this.persistProgress();
  }

  private loadCurrentPuzzle(): void {
    const idx = this.currentIndex();
    const gs = this.allGridStates[idx] ?? {};
    this.gridState.set(gs);
    this.solved.set(this.solvedPuzzles().includes(idx));
    this.clueStruck.set({});
    this.clearFeedback();
    this.elapsedSeconds.set(0);
    if (!this.solved()) this.startTimer();
    else this.stopTimer();
    this.persistProgress();
  }

  private persistProgress(): void {
    const catId = this.categoryId();
    if (!catId) return;
    this.allGridStates[this.currentIndex()] = this.gridState();
    this.userState.saveMatrixProgress(catId, {
      index: this.currentIndex(),
      gridStates: this.allGridStates,
      solvedPuzzles: this.solvedPuzzles(),
    });
  }
}
