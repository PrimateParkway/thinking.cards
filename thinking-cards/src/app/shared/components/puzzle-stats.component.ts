import { Component, input, output, computed , ChangeDetectionStrategy } from '@angular/core';
import { Card } from '../../core/models/card.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-puzzle-stats',
  template: `
    <div class="stats-backdrop" (click)="close.emit()">
      <div class="stats-card" (click)="$event.stopPropagation()">
        <div class="stats-header">
          <h3 class="stats-title">Puzzle Progress</h3>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>
        <p class="stats-summary">{{ solvedPuzzles().length }} / {{ puzzleCards().length }} solved</p>

        <div class="stats-grid">
          @for (card of puzzleCards(); track card.cardNumber) {
            <button
              class="stat-cell"
              [class.solved]="isSolved(card.cardNumber)"
              [class.gave-up]="isGaveUp(card.cardNumber)"
              [class.in-progress]="isStarted(card.cardNumber)"
              [class.current]="currentIndex() === indexOf(card)"
              (click)="selectPuzzle.emit(indexOf(card))"
            >
              <span class="cell-number">{{ card.cardNumber }}</span>
              @if (card.difficulty) {
                <span class="cell-diff" [attr.data-difficulty]="card.difficulty"></span>
              }
              @if (isSolved(card.cardNumber)) {
                <span class="cell-icon">&#10003;</span>
                @if (timeFor(card.cardNumber); as t) {
                  <span class="cell-time">{{ t }}</span>
                }
              } @else if (isGaveUp(card.cardNumber)) {
                <span class="cell-icon">&times;</span>
              } @else if (isStarted(card.cardNumber)) {
                <span class="cell-icon dot">&bull;</span>
              }
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .stats-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fadeIn 0.2s ease-out;
    }
    .stats-card {
      background: var(--bg-card);
      border-radius: 20px;
      padding: 24px;
      max-width: 420px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      animation: slideUp 0.25s ease-out;
    }
    .stats-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .stats-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }
    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-surface);
      color: var(--text-muted);
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
      &:hover { background: var(--accent); color: white; }
    }
    .stats-summary {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0 0 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
      gap: 8px;
    }
    .stat-cell {
      position: relative;
      aspect-ratio: 1;
      border-radius: 10px;
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      -webkit-tap-highlight-color: transparent;
      &:hover { transform: scale(1.08); }
    }
    .stat-cell.solved {
      background: rgba(0, 184, 148, 0.18);
    }
    .stat-cell.gave-up {
      background: rgba(233, 69, 96, 0.15);
    }
    .stat-cell.in-progress {
      background: rgba(253, 203, 110, 0.2);
    }
    .stat-cell.current {
      box-shadow: 0 0 0 2px var(--accent);
    }
    .cell-number {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text);
    }
    .cell-diff {
      width: 16px;
      height: 3px;
      border-radius: 2px;
    }
    .cell-diff[data-difficulty="Easy"] { background: #00b894; }
    .cell-diff[data-difficulty="Medium"] { background: #fdcb6e; }
    .cell-diff[data-difficulty="Hard"] { background: #e17055; }
    .cell-diff[data-difficulty="Extreme"] { background: #a25eff; }
    .cell-icon {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 1;
    }
    .stat-cell.solved .cell-icon { color: #00b894; }
    .stat-cell.gave-up .cell-icon { color: #e94560; }
    .stat-cell.in-progress .cell-icon.dot { color: #fdcb6e; font-size: 1rem; }
    .cell-time {
      font-family: 'Poppins', sans-serif;
      font-size: 0.55rem;
      font-weight: 600;
      color: #00b894;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `
})
export class PuzzleStatsComponent {
  cards = input.required<Card[]>();
  solvedPuzzles = input.required<number[]>();
  gaveUpPuzzles = input.required<number[]>();
  startedPuzzles = input.required<number[]>();
  currentIndex = input.required<number>();
  completionTimes = input<Record<number, number>>({});

  selectPuzzle = output<number>();
  close = output<void>();

  puzzleCards = computed(() =>
    this.cards().filter(c => c.cardNumber > 0),
  );

  private cardNumToIndex = computed(() => {
    const map = new Map<number, number>();
    this.cards().forEach((c, i) => map.set(c.cardNumber, i));
    return map;
  });

  private solvedSet = computed(() => new Set(this.solvedPuzzles()));
  private gaveUpSet = computed(() => new Set(this.gaveUpPuzzles()));
  private startedSet = computed(() => new Set(this.startedPuzzles()));

  indexOf(card: Card): number {
    return this.cardNumToIndex().get(card.cardNumber) ?? 0;
  }

  isSolved(cardNumber: number): boolean {
    const idx = this.cardNumToIndex().get(cardNumber);
    return idx !== undefined && this.solvedSet().has(idx);
  }

  isGaveUp(cardNumber: number): boolean {
    const idx = this.cardNumToIndex().get(cardNumber);
    return idx !== undefined && !this.solvedSet().has(idx) && this.gaveUpSet().has(idx);
  }

  isStarted(cardNumber: number): boolean {
    const idx = this.cardNumToIndex().get(cardNumber);
    return idx !== undefined
      && !this.solvedSet().has(idx)
      && !this.gaveUpSet().has(idx)
      && this.startedSet().has(idx);
  }

  timeFor(cardNumber: number): string {
    const idx = this.cardNumToIndex().get(cardNumber);
    if (idx === undefined) return '';
    const secs = this.completionTimes()[idx];
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
