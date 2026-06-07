import { Component, inject, signal, computed, effect, untracked , ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardService } from '../../core/services/card.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ProgressService } from '../../core/services/progress.service';
import { StreakService } from '../../core/services/streak.service';
import { QuestionCardComponent } from '../../shared/components/question-card.component';
import { SwipeDirective } from '../../shared/directives/swipe.directive';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';
import { filterStandardCards, categoryColorFor, categoryNameFor } from '../../shared/utils/category-helpers';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-shuffle',
  imports: [QuestionCardComponent, SwipeDirective],
  template: `
    <div class="viewer container">
      <h2 class="title">Shuffle Mode</h2>

      @if (currentCard(); as card) {
        <div class="category-badge" [style.background]="categoryColor()">
          {{ categoryName() }}
        </div>

        <div class="card-stage" appSwipe
             (swipeLeft)="shuffle()"
             (swipeRight)="shuffle()"
             [class.deal]="dealing()">
          <app-question-card
            [card]="card"
            [color]="categoryColor()"
            [categoryName]="categoryName()"
            [favorited]="isFavorited()"
            (toggleFavorite)="onToggleFavorite()"
          />
        </div>

        <button class="shuffle-btn" (click)="shuffle()">
          Shuffle
        </button>
      } @else {
        <p class="loading">Loading cards...</p>
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
      margin-bottom: 16px;
      color: var(--text);
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
    .card-stage.deal {
      animation: dealCard 0.35s ease-out;
    }
    @keyframes dealCard {
      0%   { transform: scale(0.9) rotate(-3deg); opacity: 0.3; }
      50%  { transform: scale(1.02) rotate(1deg); opacity: 0.8; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .shuffle-btn {
      margin-top: 32px;
      background: var(--accent);
      color: white;
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      padding: 14px 48px;
      border-radius: 50px;
      transition: transform 0.15s, opacity 0.2s;
      &:hover { opacity: 0.9; transform: scale(1.03); }
      &:active { transform: scale(0.97); }
    }
    .loading {
      color: var(--text-muted);
      margin-top: 64px;
    }
  `,
})
export class ShuffleComponent {
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
  private standardCards = computed(() =>
    filterStandardCards(this.allCards(), this.categories()),
  );

  private currentIndex = signal(0);
  private shuffled = signal<Card[]>([]);
  dealing = signal(false);

  constructor() {
    effect(() => {
      const cards = this.standardCards();
      if (!cards.length) return;

      const existing = untracked(() => this.shuffled());
      if (!existing.length) {
        // First load — shuffle all cards
        this.shuffled.set(this.fisherYates([...cards]));
      } else {
        // Cards changed — remove deleted cards from the shuffled deck
        const validIds = new Set(cards.map(c => c.id));
        const filtered = existing.filter(c => validIds.has(c.id));
        if (filtered.length < existing.length) {
          this.shuffled.set(filtered);
          const idx = untracked(() => this.currentIndex());
          if (idx >= filtered.length) {
            this.currentIndex.set(Math.max(0, filtered.length - 1));
          }
        }
      }
    });

    effect(() => {
      const card = this.currentCard();
      if (card) {
        this.progressService.markSeen(card.id);
        this.streakService.recordActivity();
      }
    });
  }

  currentCard = computed(() => {
    const cards = this.shuffled();
    const idx = this.currentIndex();
    return cards.length ? cards[idx] : null;
  });

  categoryColor = computed(() =>
    categoryColorFor(this.currentCard(), this.categories()),
  );

  categoryName = computed(() =>
    categoryNameFor(this.currentCard(), this.categories()),
  );

  isFavorited = computed(() => {
    const card = this.currentCard();
    return card ? this.favoritesService.favoriteIds().has(card.id) : false;
  });

  shuffle() {
    this.dealing.set(false);
    requestAnimationFrame(() => {
      const idx = this.currentIndex();
      const cards = this.shuffled();
      if (idx < cards.length - 1) {
        this.currentIndex.set(idx + 1);
      } else {
        // Reshuffle when we've gone through all cards
        this.shuffled.set(this.fisherYates([...this.standardCards()]));
        this.currentIndex.set(0);
      }
      this.dealing.set(true);
    });
  }

  onToggleFavorite(): void {
    const card = this.currentCard();
    if (card) this.favoritesService.toggle(card.id);
  }

  private fisherYates(arr: Card[]): Card[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
