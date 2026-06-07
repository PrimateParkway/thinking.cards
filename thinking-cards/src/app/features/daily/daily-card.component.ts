import { Component, inject, computed, effect , ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardService } from '../../core/services/card.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ProgressService } from '../../core/services/progress.service';
import { StreakService } from '../../core/services/streak.service';
import { QuestionCardComponent } from '../../shared/components/question-card.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';
import { filterStandardCards, categoryColorFor, categoryNameFor } from '../../shared/utils/category-helpers';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-daily-card',
  imports: [QuestionCardComponent],
  template: `
    <div class="viewer container">
      <h2 class="title">Daily Card</h2>

      <div class="streak-row">
        <svg class="fire-icon" viewBox="0 0 24 24"
             [attr.fill]="streak().activeToday ? '#ff6b6b' : 'none'"
             stroke="#ff6b6b" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/>
        </svg>
        <span class="streak-count">{{ streak().current }}</span>
        <span class="streak-label">day streak</span>
      </div>

      @if (dailyCard(); as card) {
        <div class="category-badge" [style.background]="categoryColor()">
          {{ categoryName() }}
        </div>

        <div class="card-stage">
          <app-question-card
            [card]="card"
            [color]="categoryColor()"
            [categoryName]="categoryName()"
            [favorited]="isFavorited()"
            (toggleFavorite)="onToggleFavorite()"
          />
        </div>

        <p class="hint">Come back tomorrow for a new card</p>
      } @else {
        <p class="loading">Loading today's card...</p>
      }
    </div>
  `,
  styles: `
    .viewer {
      padding-top: 24px;
      padding-bottom: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title {
      font-size: 1.5rem;
      margin-bottom: 12px;
      color: var(--text);
    }
    .streak-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 20px;
    }
    .fire-icon {
      width: 22px;
      height: 22px;
    }
    .streak-count {
      font-family: 'Poppins', sans-serif;
      font-size: 1.3rem;
      font-weight: 800;
      color: #ff6b6b;
    }
    .streak-label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .category-badge {
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-stage {
      width: 100%;
      max-width: 520px;
    }
    .hint {
      margin-top: 28px;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-style: italic;
    }
    .loading {
      color: var(--text-muted);
      margin-top: 64px;
    }
  `,
})
export class DailyCardComponent {
  private cardService = inject(CardService);
  private favoritesService = inject(FavoritesService);
  private progressService = inject(ProgressService);
  private streakService = inject(StreakService);

  private allCards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });
  private categories = toSignal(this.cardService.getCategories(), {
    initialValue: [] as Category[],
  });

  streak = this.streakService.streak;

  private standardCards = computed(() =>
    filterStandardCards(this.allCards(), this.categories()),
  );

  dailyCard = computed(() => {
    const cards = this.standardCards();
    if (!cards.length) return null;
    const index = hashCode(todayKey()) % cards.length;
    return cards[index];
  });

  categoryColor = computed(() =>
    categoryColorFor(this.dailyCard(), this.categories()),
  );

  categoryName = computed(() =>
    categoryNameFor(this.dailyCard(), this.categories()),
  );

  isFavorited = computed(() => {
    const card = this.dailyCard();
    return card ? this.favoritesService.favoriteIds().has(card.id) : false;
  });

  private lastSeenId = '';

  constructor() {
    effect(() => {
      const card = this.dailyCard();
      if (!card || card.id === this.lastSeenId) return;
      this.lastSeenId = card.id;
      this.progressService.markSeen(card.id);
      this.streakService.recordActivity();
    });
  }

  onToggleFavorite(): void {
    const card = this.dailyCard();
    if (card) this.favoritesService.toggle(card.id);
  }
}
