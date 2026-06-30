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
import { Card, EscapeStation, EscapeFinal } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-escape',
  imports: [CategoryIconComponent, PuzzleStatsComponent, NoteButtonComponent],
  template: `
    <div class="escape container">
      <button class="back-btn" (click)="goBack()">&larr; Back</button>

      @if (category(); as cat) {
        <div class="header-bar" [style.border-color]="cat.color">
          <app-category-icon [name]="cat.name" class="title-icon" />
          <h2 class="cat-title" [style.color]="cat.color">{{ cat.name }}</h2>
          <button class="info-btn" (click)="showInstructions()" title="How to play" aria-label="How to play">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
          <button class="info-btn" (click)="showStats.set(true)" title="Puzzle progress" aria-label="Puzzle progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          @if (!isInstructionCard() && currentCard(); as c) {
            <app-note-button [cardId]="c.id" [cardLabel]="'#' + c.cardNumber + ' · ' + cat.name" />
          }
          <span class="timer">{{ formattedTime() }}</span>
          @if (bestTimeForCurrent()) { <span class="best-time">{{ bestTimeForCurrent() }}</span> }
        </div>
      }

      @if (currentCard(); as card) {
        @if (isInstructionCard()) {
          <div class="instructions-panel">
            <h2 class="instructions-title">{{ card.questionText }}</h2>
            <div class="instructions-body">{{ card.explanation }}</div>
            <button class="btn primary start-btn" (click)="closeInstructions()">
              {{ returnIndex() !== null ? 'Back to room' : 'Enter the rooms' }} &rarr;
            </button>
          </div>
        } @else {
        <div class="puzzle-title">
          <span>#{{ card.cardNumber }} — {{ card.questionText }}</span>
          @if (card.difficulty) {
            <span class="difficulty-pill" [attr.data-difficulty]="card.difficulty">{{ card.difficulty }}</span>
          }
        </div>

        @if (card.escapeIntro) { <div class="intro-strip">{{ card.escapeIntro }}</div> }

        <div class="station-list">
          @for (st of stations(); track $index; let i = $index) {
            <div class="station-card" [class.done]="stationSolved(i)">
              <div class="station-head">
                <span class="station-title">
                  <span class="station-num">{{ i + 1 }}</span>{{ st.title }}
                </span>
                @if (stationSolved(i)) { <span class="station-chip">✓ {{ takeOf(st) }}</span> }
              </div>
              <p class="station-prompt">{{ st.prompt }}</p>
              @if (stationSolved(i)) {
                <div class="station-answer">{{ normUpper(confirmed()[i]) }}<span class="contributes"> → {{ takeOf(st) }}</span></div>
                @if (solved() && st.reveal) { <p class="station-reveal">{{ st.reveal }}</p> }
              } @else {
                <div class="station-entry">
                  <input class="station-input" type="text" autocomplete="off" autocapitalize="characters"
                    [value]="stationInputs()[i] ?? ''" (input)="onStation(i, $event)"
                    (keyup.enter)="checkStation(i)" placeholder="Answer" />
                  <button class="btn small" (click)="checkStation(i)">Check</button>
                </div>
                @if (stationFeedback()[i]) { <p class="mini-error">{{ stationFeedback()[i] }}</p> }
                @if (st.hint && hintShown()['s' + i]) { <p class="hint-text">Hint: {{ st.hint }}</p> }
                @else if (st.hint) { <button class="hint-link" (click)="showHint('s' + i)">Need a hint?</button> }
              }
            </div>
          }
        </div>

        @if (finalPuzzle(); as fin) {
          <div class="final-panel" [class.open]="solved()">
            <h3 class="final-title">🔒 Final Lock</h3>
            <p class="final-rule">{{ fin.rule }}</p>
            <div class="lock-assembly">
              @for (st of stations(); track $index; let i = $index) {
                <div class="lock-slot" [class.filled]="stationSolved(i)">{{ stationSolved(i) ? takeOf(st) : '?' }}</div>
              }
            </div>
            <p class="final-prompt">{{ fin.prompt }}</p>
            @if (!solved()) {
              <div class="station-entry">
                <input class="station-input final-input" type="text" autocomplete="off" autocapitalize="characters"
                  [value]="finalInput()" (input)="onFinal($event)" (keyup.enter)="tryEscape()" placeholder="Final answer" />
                <button class="btn primary small" (click)="tryEscape()">Escape</button>
              </div>
              @if (finalFeedback()) { <p class="mini-error">{{ finalFeedback() }}</p> }
              @if (fin.hint && hintShown()['final']) { <p class="hint-text">Hint: {{ fin.hint }}</p> }
              @else if (fin.hint) { <button class="hint-link" (click)="showHint('final')">Need a hint?</button> }
            } @else {
              <div class="escaped-banner">{{ isGaveUp() ? 'Answer revealed' : 'You escaped!' }} — {{ normUpper(fin.answer) }}</div>
            }
          </div>
        }

        <div class="nav-row">
          <button class="nav-btn" [disabled]="currentIndex() <= 0" (click)="prevPuzzle()">&larr;</button>
          <span class="nav-label">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          <button class="nav-btn" [disabled]="currentIndex() >= cards().length - 1" (click)="nextPuzzle()">&rarr;</button>
        </div>

        <div class="action-buttons">
          <button class="btn secondary" (click)="resetPuzzle()">Reset</button>
        </div>
        @if (!solved()) {
          <button class="give-up-btn" (click)="revealAll()">I give up — show answers</button>
        }
        }
      }

      @if (showStats()) {
        <app-puzzle-stats
          [cards]="cards()" [solvedPuzzles]="solvedPuzzles()" [gaveUpPuzzles]="gaveUpPuzzles()"
          [startedPuzzles]="startedPuzzles()" [currentIndex]="currentIndex()" [completionTimes]="bestTimes"
          (selectPuzzle)="jumpToPuzzle($event)" (close)="showStats.set(false)"
        />
      }
    </div>
  `,
  styles: `
    .escape { padding-top: 24px; padding-bottom: 64px; display: flex; flex-direction: column; align-items: center; max-width: 620px; }
    .back-btn { align-self: flex-start; background: none; color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px; padding: 4px 0; &:hover { color: var(--text); } }
    .header-bar { width: 100%; display: flex; align-items: center; gap: 10px; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 2px solid; }
    .title-icon { width: 28px; height: 28px; }
    .cat-title { font-size: 1.3rem; flex: 1; margin: 0; }
    .info-btn { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-surface); color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.2s, color 0.2s; svg { width: 18px; height: 18px; } &:hover { background: var(--accent); color: white; } }
    .timer { font-family: 'Poppins', sans-serif; font-size: 1rem; font-weight: 600; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .best-time { font-family: 'Poppins', sans-serif; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); opacity: 0.6; font-variant-numeric: tabular-nums; }
    .instructions-panel { width: 100%; background: var(--bg-card); border-radius: 16px; padding: 32px 24px; text-align: center; animation: slideIn 0.3s ease-out; }
    .instructions-title { font-family: 'Poppins', sans-serif; font-size: 1.4rem; font-weight: 700; margin: 0 0 16px; }
    .instructions-body { font-size: 0.92rem; line-height: 1.7; color: var(--text); opacity: 0.85; text-align: left; white-space: pre-line; margin-bottom: 24px; }
    .start-btn { width: auto; padding: 14px 32px; }
    .puzzle-title { font-family: 'Poppins', sans-serif; font-size: 1.1rem; font-weight: 600; text-align: center; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .difficulty-pill { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
    .difficulty-pill[data-difficulty="Easy"] { background: rgba(0, 184, 148, 0.18); color: #00b894; }
    .difficulty-pill[data-difficulty="Medium"] { background: rgba(253, 203, 110, 0.2); color: #fdcb6e; }
    .difficulty-pill[data-difficulty="Hard"] { background: rgba(225, 112, 85, 0.2); color: #e17055; }
    .difficulty-pill[data-difficulty="Extreme"] { background: rgba(162, 94, 255, 0.2); color: #a25eff; }
    .intro-strip { width: 100%; background: var(--bg-surface); border-radius: 10px; padding: 12px 16px; font-size: 0.9rem; line-height: 1.55; color: var(--text); opacity: 0.92; margin-bottom: 18px; text-align: center; font-style: italic; }

    .station-list { width: 100%; display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .station-card { background: var(--bg-card); border-radius: 14px; padding: 14px 16px; border-left: 3px solid transparent; transition: border-color 0.2s; }
    .station-card.done { border-left-color: #00b894; }
    .station-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
    .station-title { font-family: 'Poppins', sans-serif; font-size: 0.98rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .station-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--bg-surface); font-size: 0.78rem; }
    .station-chip { font-family: 'Poppins', sans-serif; font-size: 0.78rem; font-weight: 700; color: #00b894; background: rgba(0,184,148,0.15); padding: 3px 10px; border-radius: 999px; }
    .station-prompt { font-size: 0.92rem; line-height: 1.5; margin: 0 0 10px; }
    .station-entry { display: flex; gap: 8px; }
    .station-input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 8px; background: var(--bg-surface); border: 1.5px solid transparent; color: var(--text); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.04em; &:focus { outline: none; border-color: var(--accent); } }
    .final-input { font-family: 'Poppins', sans-serif; font-weight: 700; }
    .station-answer { font-family: 'Poppins', sans-serif; font-weight: 700; color: #00b894; letter-spacing: 0.05em; }
    .contributes { color: var(--text-muted); font-weight: 600; }
    .station-reveal { font-size: 0.85rem; color: var(--text-muted); margin: 6px 0 0; line-height: 1.5; }
    .mini-error { font-size: 0.82rem; color: #e94560; margin: 6px 0 0; }
    .hint-link { background: none; color: var(--text-muted); font-size: 0.8rem; text-decoration: underline; opacity: 0.7; margin-top: 6px; padding: 0; &:hover { opacity: 1; } }
    .hint-text { font-size: 0.84rem; color: var(--text-muted); margin: 6px 0 0; }

    .final-panel { width: 100%; background: var(--bg-card); border-radius: 16px; padding: 18px 20px; margin-bottom: 20px; border: 2px dashed var(--grid-border); }
    .final-panel.open { border-style: solid; border-color: #00b894; }
    .final-title { font-family: 'Poppins', sans-serif; font-size: 1.05rem; font-weight: 700; margin: 0 0 4px; }
    .final-rule { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 12px; }
    .lock-assembly { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 12px; }
    .lock-slot { width: 38px; height: 46px; border-radius: 8px; background: var(--bg-surface); display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--text-muted); }
    .lock-slot.filled { background: rgba(0,184,148,0.15); color: #00b894; }
    .final-prompt { font-size: 0.92rem; line-height: 1.5; margin: 0 0 10px; text-align: center; }
    .escaped-banner { text-align: center; font-family: 'Poppins', sans-serif; font-weight: 700; color: #00b894; font-size: 1.05rem; padding: 6px 0; letter-spacing: 0.05em; }

    .nav-row { display: flex; align-items: center; gap: 16px; width: 100%; margin-bottom: 16px; }
    .nav-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); color: var(--text); font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s, opacity 0.2s; &:hover:not(:disabled) { background: var(--accent); } &:disabled { opacity: 0.3; cursor: default; } }
    .nav-label { flex: 1; text-align: center; font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .action-buttons { display: flex; gap: 10px; width: 100%; margin-bottom: 8px; }
    .btn { padding: 14px 16px; border-radius: 10px; font-size: 0.95rem; font-weight: 600; transition: opacity 0.2s; &:hover { opacity: 0.9; } &:disabled { opacity: 0.4; cursor: default; } }
    .btn.small { padding: 10px 16px; font-size: 0.85rem; flex: 0 0 auto; }
    .btn.primary { background: var(--accent); color: white; }
    .btn.secondary { background: var(--bg-surface); color: var(--text-muted); flex: 1; }
    .give-up-btn { background: none; color: var(--text-muted); font-size: 0.8rem; opacity: 0.5; margin-bottom: 20px; padding: 8px 0; &:hover { opacity: 0.8; text-decoration: underline; } }
    @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `
})
export class EscapeComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private userState = inject(UserStateService);
  private celebration = inject(CelebrationService);

  currentIndex = signal(0);
  stationInputs = signal<Record<number, string>>({});
  confirmed = signal<Record<number, string>>({});
  finalInput = signal('');
  returnIndex = signal<number | null>(null);
  stationFeedback = signal<Record<number, string>>({});
  finalFeedback = signal('');
  hintShown = signal<Record<string, boolean>>({});

  showStats = signal(false);
  elapsedSeconds = signal(0);
  solvedPuzzles = signal<number[]>([]);
  gaveUpPuzzles = signal<number[]>([]);
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private allRoomStates: Record<number, { stations: Record<number, string>; final: string }> = {};
  bestTimes: Record<number, number> = {};

  private categoryId = toSignal(this.route.paramMap.pipe(map(p => p.get('id')!)));
  private categories = toSignal(this.cardService.getCategories(), { initialValue: [] as Category[] });

  category = computed(() => {
    const id = this.categoryId();
    return id ? this.categories().find(c => c.id === id) ?? null : null;
  });

  cards = toSignal(
    this.route.paramMap.pipe(
      map(p => p.get('id')!),
      switchMap(id => this.cardService.getCardsByCategory(id).pipe(
        switchMap(cards => from(this.userState.loadEscapeProgress(id)).pipe(
          tap(saved => {
            if (saved) {
              this.currentIndex.set(Math.min(saved.index, cards.length - 1));
              this.solvedPuzzles.set(saved.solvedPuzzles ?? []);
              this.gaveUpPuzzles.set(saved.gaveUpPuzzles ?? []);
              this.allRoomStates = saved.roomStates ?? {};
              this.bestTimes = saved.bestTimes ?? {};
              this.restoreRoom(this.currentIndex());
            }
            this.startTimer();
          }),
          map(() => cards),
        )),
      )),
    ),
    { initialValue: [] as Card[] }
  );

  currentCard = computed(() => {
    const c = this.cards();
    return c.length ? c[this.currentIndex()] : null;
  });

  isInstructionCard = computed(() => !this.currentCard()?.escapeStations?.length);
  stations = computed<EscapeStation[]>(() => this.currentCard()?.escapeStations ?? []);
  finalPuzzle = computed<EscapeFinal | null>(() => this.currentCard()?.escapeFinal ?? null);
  isGaveUp = computed(() => this.gaveUpPuzzles().includes(this.currentIndex()));
  solved = computed(() => this.solvedPuzzles().includes(this.currentIndex()) || this.isGaveUp());

  formattedTime = computed(() => {
    const s = this.elapsedSeconds();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  });
  bestTimeForCurrent = computed(() => {
    const secs = this.bestTimes[this.currentIndex()];
    if (!secs) return '';
    return `Best: ${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  });

  startedPuzzles = computed(() =>
    Object.keys(this.allRoomStates).map(Number).filter(i => {
      const r = this.allRoomStates[i];
      return r && (r.final || Object.values(r.stations ?? {}).some(v => v));
    })
  );

  private norm(s: string | undefined): string {
    return (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  normUpper(s: string | undefined): string { return (s ?? '').toUpperCase(); }
  takeOf(st: EscapeStation): string { return st.takeChar.toUpperCase(); }

  stationSolved(i: number): boolean {
    const st = this.stations()[i];
    return !!st && this.norm(this.confirmed()[i]) === this.norm(st.answer);
  }

  onStation(i: number, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.stationInputs.update(s => ({ ...s, [i]: v }));
    if (this.stationFeedback()[i]) this.stationFeedback.update(f => ({ ...f, [i]: '' }));
  }
  onFinal(e: Event): void {
    this.finalInput.set((e.target as HTMLInputElement).value);
    if (this.finalFeedback()) this.finalFeedback.set('');
  }

  checkStation(i: number): void {
    if (this.solved()) return;
    const entered = this.stationInputs()[i] ?? '';
    this.confirmed.update(c => ({ ...c, [i]: entered }));
    if (this.stationSolved(i)) {
      this.stationFeedback.update(f => ({ ...f, [i]: '' }));
    } else {
      this.stationFeedback.update(f => ({ ...f, [i]: 'Not the right answer — try again.' }));
    }
    this.persistProgress();
  }

  tryEscape(): void {
    if (this.solved()) return;
    const fin = this.finalPuzzle();
    if (!fin) return;
    if (this.norm(this.finalInput()) === this.norm(fin.answer)) {
      this.markSolved();
    } else {
      const unsolved = this.stations().filter((_, i) => !this.stationSolved(i)).length;
      this.finalFeedback.set(unsolved
        ? `The lock won't budge. ${unsolved} station${unsolved > 1 ? 's' : ''} still unsolved.`
        : `The lock won't budge — check how the letters combine.`);
      this.persistProgress();
    }
  }

  showHint(key: string): void { this.hintShown.update(h => ({ ...h, [key]: true })); }

  revealAll(): void {
    const sts = this.stations();
    const filled: Record<number, string> = {};
    sts.forEach((st, i) => filled[i] = st.answer);
    this.stationInputs.set({ ...filled });
    this.confirmed.set({ ...filled });
    this.finalInput.set(this.finalPuzzle()?.answer ?? '');
    this.stationFeedback.set({});
    this.finalFeedback.set('');
    const idx = this.currentIndex();
    if (!this.gaveUpPuzzles().includes(idx)) this.gaveUpPuzzles.update(gp => [...gp, idx]);
    this.stopTimer();
    this.persistProgress();
  }

  resetPuzzle(): void {
    this.stationInputs.set({});
    this.confirmed.set({});
    this.finalInput.set('');
    this.stationFeedback.set({});
    this.finalFeedback.set('');
    this.hintShown.set({});
    this.elapsedSeconds.set(0);
    const idx = this.currentIndex();
    this.solvedPuzzles.update(sp => sp.filter(i => i !== idx));
    this.gaveUpPuzzles.update(gp => gp.filter(i => i !== idx));
    this.persistProgress();
    this.startTimer();
  }

  prevPuzzle(): void { if (this.currentIndex() <= 0) return; this.saveCurrent(); this.currentIndex.update(i => i - 1); this.loadCurrentPuzzle(); }
  nextPuzzle(): void { if (this.currentIndex() >= this.cards().length - 1) return; this.saveCurrent(); this.currentIndex.update(i => i + 1); this.loadCurrentPuzzle(); }
  goBack(): void { this.router.navigate(['/puzzles']); }

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
    if (ri !== null) { this.currentIndex.set(ri); this.loadCurrentPuzzle(); }
    else { this.nextPuzzle(); }
  }
  jumpToPuzzle(idx: number): void { this.saveCurrent(); this.currentIndex.set(idx); this.loadCurrentPuzzle(); this.showStats.set(false); }

  ngOnDestroy() { this.stopTimer(); this.persistProgress(); }

  private markSolved(): void {
    this.stopTimer();
    this.finalFeedback.set('');
    const idx = this.currentIndex();
    if (!this.solvedPuzzles().includes(idx)) {
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

  private saveCurrent(): void { this.persistProgress(); }

  private restoreRoom(idx: number): void {
    const r = this.allRoomStates[idx];
    const stations = r?.stations ? { ...r.stations } : {};
    this.stationInputs.set({ ...stations });
    this.confirmed.set({ ...stations });
    this.finalInput.set(r?.final ?? '');
    this.stationFeedback.set({});
    this.finalFeedback.set('');
    this.hintShown.set({});
  }

  private loadCurrentPuzzle(): void {
    this.restoreRoom(this.currentIndex());
    this.elapsedSeconds.set(0);
    if (this.isInstructionCard() || this.solved()) this.stopTimer();
    else this.startTimer();
    this.persistProgress();
  }

  private startTimer(): void {
    this.stopTimer();
    if (this.solved()) return;
    this.timerRef = setInterval(() => this.elapsedSeconds.update(s => s + 1), 1000);
  }
  private stopTimer(): void { if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; } }

  private persistProgress(): void {
    const catId = this.categoryId();
    if (!catId) return;
    this.allRoomStates[this.currentIndex()] = { stations: this.confirmed(), final: this.finalInput() };
    this.userState.saveEscapeProgress(catId, {
      index: this.currentIndex(),
      roomStates: this.allRoomStates,
      solvedPuzzles: this.solvedPuzzles(),
      gaveUpPuzzles: this.gaveUpPuzzles(),
      bestTimes: this.bestTimes,
    });
  }
}
