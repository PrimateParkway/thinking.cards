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

type Verdict = 'Knight' | 'Knave' | '';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-knights',
  imports: [CategoryIconComponent, PuzzleStatsComponent, NoteButtonComponent],
  template: `
    <div class="knights container">
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
            <span class="difficulty-pill" [attr.data-difficulty]="card.difficulty">{{ card.difficulty }}</span>
          }
        </div>

        @if (card.knightsScenario) {
          <div class="scenario-strip">{{ card.knightsScenario }}</div>
        }

        <div class="char-list">
          @for (ch of card.knightsCharacters ?? []; track ch.name) {
            <div class="character-card" [class.solved]="solved()">
              <div class="char-head">
                <span class="char-name">{{ ch.name }}</span>
                @if (solved()) {
                  <span class="verdict-badge" [attr.data-type]="solutionFor(ch.name)">{{ solutionFor(ch.name) }}</span>
                } @else {
                  <div class="type-toggle">
                    <button
                      class="toggle-btn knight"
                      [class.active]="answer()[ch.name] === 'Knight'"
                      (click)="select(ch.name, 'Knight')"
                    >Knight</button>
                    <button
                      class="toggle-btn knave"
                      [class.active]="answer()[ch.name] === 'Knave'"
                      (click)="select(ch.name, 'Knave')"
                    >Knave</button>
                  </div>
                }
              </div>
              <ul class="statements">
                @for (s of ch.statements; track $index) {
                  <li class="statement">&ldquo;{{ s }}&rdquo;</li>
                }
              </ul>
            </div>
          }
        </div>

        @if (feedbackMsg()) {
          <div class="feedback" [class.error]="true">{{ feedbackMsg() }}</div>
        }

        <div class="nav-row">
          <button class="nav-btn" [disabled]="currentIndex() <= 0" (click)="prevPuzzle()">&larr;</button>
          <span class="nav-label">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          <button class="nav-btn" [disabled]="currentIndex() >= cards().length - 1" (click)="nextPuzzle()">&rarr;</button>
        </div>

        @if (!solved()) {
          <button class="btn primary check-btn" (click)="checkAnswer()" [disabled]="!isComplete()">Check</button>
          <div class="action-buttons">
            <button class="btn secondary" (click)="useHint()">Hint</button>
            <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
          </div>
          <button class="give-up-btn" (click)="revealAnswer()">I give up — show answer</button>
        } @else {
          @if (isGaveUp()) {
            @if (currentCard()?.knightsExplanation?.length) {
              <div class="explanation-panel">
                <h3 class="section-label">How to solve it</h3>
                <ol class="explanation-list">
                  @for (step of currentCard()!.knightsExplanation!; track $index) {
                    <li>{{ step }}</li>
                  }
                </ol>
              </div>
            }
          } @else {
            <div class="solution-panel">
              <h3 class="section-label">Solution</h3>
              <table class="solution-table">
                @if (hasTag()) {
                  <thead>
                    <tr><th>Islander</th><th>Type</th><th>{{ tagLabel() }}</th></tr>
                  </thead>
                }
                <tbody>
                  @for (ch of currentCard()?.knightsCharacters ?? []; track ch.name) {
                    <tr>
                      <td class="solution-primary">{{ ch.name }}</td>
                      <td><span class="verdict-badge" [attr.data-type]="solutionFor(ch.name)">{{ solutionFor(ch.name) }}</span></td>
                      @if (hasTag()) {
                        <td class="tag-cell" [class.tag-guilty]="tagFor(ch.name) === 'Guilty'">{{ tagFor(ch.name) }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
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
    .knights {
      padding-top: 24px;
      padding-bottom: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 600px;
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
    .start-btn { width: auto; padding: 14px 32px; }
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
    .difficulty-pill[data-difficulty="Easy"] { background: rgba(0, 184, 148, 0.18); color: #00b894; }
    .difficulty-pill[data-difficulty="Medium"] { background: rgba(253, 203, 110, 0.2); color: #fdcb6e; }
    .difficulty-pill[data-difficulty="Hard"] { background: rgba(225, 112, 85, 0.2); color: #e17055; }
    .difficulty-pill[data-difficulty="Extreme"] { background: rgba(162, 94, 255, 0.2); color: #a25eff; }

    .scenario-strip {
      width: 100%;
      background: var(--bg-surface);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 0.88rem;
      line-height: 1.5;
      color: var(--text);
      opacity: 0.9;
      margin-bottom: 16px;
      text-align: center;
    }

    .char-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .character-card {
      background: var(--bg-card);
      border-radius: 14px;
      padding: 14px 16px;
      transition: background 0.2s;
    }
    .char-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    .char-name {
      font-family: 'Poppins', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .type-toggle {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .toggle-btn {
      padding: 6px 14px;
      border-radius: 999px;
      background: var(--bg-surface);
      color: var(--text-muted);
      font-family: 'Poppins', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { color: var(--text); }
    }
    .toggle-btn.knight.active { background: rgba(0, 184, 148, 0.2); color: #00b894; box-shadow: inset 0 0 0 1.5px #00b894; }
    .toggle-btn.knave.active { background: rgba(233, 69, 96, 0.18); color: #e94560; box-shadow: inset 0 0 0 1.5px #e94560; }
    .statements {
      margin: 0;
      padding-left: 18px;
      li {
        font-size: 0.92rem;
        line-height: 1.5;
        color: var(--text);
        margin-bottom: 2px;
      }
    }
    .verdict-badge {
      font-family: 'Poppins', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 12px;
      border-radius: 999px;
    }
    .verdict-badge[data-type="Knight"] { background: rgba(0, 184, 148, 0.2); color: #00b894; }
    .verdict-badge[data-type="Knave"] { background: rgba(233, 69, 96, 0.18); color: #e94560; }

    .feedback {
      width: 100%;
      text-align: center;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 10px;
      border-radius: 10px;
      margin-bottom: 12px;
    }
    .feedback.error { background: rgba(233, 69, 96, 0.15); color: #e94560; }

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
    .check-btn { width: 100%; margin-bottom: 10px; }
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
    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0 0 8px;
    }
    .explanation-panel, .solution-panel {
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
      li { font-size: 0.88rem; line-height: 1.6; margin-bottom: 6px; }
    }
    .solution-table {
      width: 100%;
      border-collapse: collapse;
      th {
        text-align: left;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        padding: 4px 4px 8px;
      }
      th:last-child { text-align: right; }
      td {
        padding: 8px 4px;
        border-bottom: 1px solid var(--grid-border);
      }
      tbody tr:last-child td { border-bottom: none; }
      td.solution-primary {
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
      }
      td:last-child:not(.solution-primary) { text-align: right; }
      .tag-cell {
        font-size: 0.9rem;
        color: var(--text-muted);
      }
      .tag-guilty {
        color: #e94560;
        font-weight: 700;
      }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
})
export class KnightsComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private userState = inject(UserStateService);
  private celebration = inject(CelebrationService);

  currentIndex = signal(0);
  answer = signal<Record<string, Verdict>>({});
  solved = signal(false);
  returnIndex = signal<number | null>(null);
  feedbackMsg = signal('');

  showStats = signal(false);
  elapsedSeconds = signal(0);
  solvedPuzzles = signal<number[]>([]);
  gaveUpPuzzles = signal<number[]>([]);
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private allAnswerStates: Record<number, Record<string, Verdict>> = {};
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
          from(this.userState.loadKnightsProgress(id)).pipe(
            tap(saved => {
              if (saved) {
                this.currentIndex.set(Math.min(saved.index, cards.length - 1));
                this.solvedPuzzles.set(saved.solvedPuzzles ?? []);
                this.gaveUpPuzzles.set(saved.gaveUpPuzzles ?? []);
                this.allAnswerStates = (saved.answerStates as Record<number, Record<string, Verdict>>) ?? {};
                this.bestTimes = saved.bestTimes ?? {};
                this.answer.set(this.allAnswerStates[this.currentIndex()] ?? {});
                if (this.solvedPuzzles().includes(this.currentIndex())
                  || this.gaveUpPuzzles().includes(this.currentIndex())) {
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

  isInstructionCard = computed(() => !this.currentCard()?.knightsCharacters?.length);
  isGaveUp = computed(() => this.gaveUpPuzzles().includes(this.currentIndex()));

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
      .filter(i => Object.values(this.allAnswerStates[i] ?? {}).some(v => v !== ''))
  );

  private characterNames(): string[] {
    return (this.currentCard()?.knightsCharacters ?? []).map(c => c.name);
  }

  solutionFor(name: string): string {
    return this.currentCard()?.knightsSolution?.[name] ?? '';
  }

  hasTag = computed(() => !!this.currentCard()?.knightsTagSolution);
  tagLabel = computed(() => this.currentCard()?.knightsTagLabel ?? '');
  tagFor(name: string): string {
    return this.currentCard()?.knightsTagSolution?.[name] ?? '';
  }

  isComplete(): boolean {
    const names = this.characterNames();
    if (!names.length) return false;
    const a = this.answer();
    return names.every(n => a[n] === 'Knight' || a[n] === 'Knave');
  }

  select(name: string, verdict: Verdict): void {
    if (this.solved()) return;
    this.clearFeedback();
    this.answer.update(a => ({ ...a, [name]: a[name] === verdict ? '' : verdict }));
    this.persistProgress();
  }

  checkAnswer(): void {
    if (this.solved() || !this.isComplete()) return;
    const sol = this.currentCard()?.knightsSolution;
    if (!sol) return;
    const a = this.answer();
    const wrong = this.characterNames().filter(n => a[n] !== sol[n]).length;
    if (wrong === 0) {
      this.markSolved();
    } else {
      this.feedbackMsg.set(`${wrong} islander${wrong > 1 ? 's are' : ' is'} mislabeled.`);
    }
  }

  useHint(): void {
    if (this.solved()) return;
    const sol = this.currentCard()?.knightsSolution;
    if (!sol) return;
    const a = this.answer();
    const target = this.characterNames().find(n => a[n] !== sol[n]);
    if (!target) return;
    this.answer.update(prev => ({ ...prev, [target]: sol[target] }));
    this.clearFeedback();
    if (this.characterNames().every(n => this.answer()[n] === sol[n])) this.markSolved();
    else this.persistProgress();
  }

  revealAnswer(): void {
    const sol = this.currentCard()?.knightsSolution;
    if (!sol) return;
    this.answer.set({ ...sol });
    this.solved.set(true);
    this.clearFeedback();
    this.stopTimer();
    const idx = this.currentIndex();
    if (!this.gaveUpPuzzles().includes(idx)) this.gaveUpPuzzles.update(gp => [...gp, idx]);
    this.persistProgress();
  }

  resetPuzzle(): void {
    this.answer.set({});
    this.solved.set(false);
    this.clearFeedback();
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

  ngOnDestroy() {
    this.stopTimer();
    this.persistProgress();
  }

  private clearFeedback(): void {
    if (this.feedbackMsg()) this.feedbackMsg.set('');
  }

  private markSolved(): void {
    this.solved.set(true);
    this.stopTimer();
    this.clearFeedback();
    const idx = this.currentIndex();
    const isFirstSolve = !this.solvedPuzzles().includes(idx);
    if (isFirstSolve) {
      this.solvedPuzzles.update(sp => [...sp, idx]);
      this.celebration.trigger();
    }
    const elapsed = this.elapsedSeconds();
    if (elapsed > 0) {
      const prev = this.bestTimes[idx];
      if (prev === undefined || elapsed < prev) this.bestTimes[idx] = elapsed;
    }
    this.persistProgress();
  }

  private saveCurrent(): void {
    this.persistProgress();
  }

  private loadCurrentPuzzle(): void {
    const idx = this.currentIndex();
    this.answer.set(this.allAnswerStates[idx] ?? {});
    this.solved.set(this.solvedPuzzles().includes(idx) || this.gaveUpPuzzles().includes(idx));
    this.clearFeedback();
    this.elapsedSeconds.set(0);
    if (this.isInstructionCard()) this.stopTimer();
    else if (!this.solved()) this.startTimer();
    else this.stopTimer();
    this.persistProgress();
  }

  private startTimer(): void {
    this.stopTimer();
    if (this.solved()) return;
    this.timerRef = setInterval(() => this.elapsedSeconds.update(s => s + 1), 1000);
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
    this.userState.saveKnightsProgress(catId, {
      index: this.currentIndex(),
      answerStates: this.allAnswerStates,
      solvedPuzzles: this.solvedPuzzles(),
      gaveUpPuzzles: this.gaveUpPuzzles(),
      bestTimes: this.bestTimes,
    });
  }
}
