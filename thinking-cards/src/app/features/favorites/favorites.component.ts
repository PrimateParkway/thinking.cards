import { Component, inject, signal, computed, HostListener , ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardService } from '../../core/services/card.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { QuestionCardComponent } from '../../shared/components/question-card.component';
import { SwipeDirective } from '../../shared/directives/swipe.directive';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';
import { filterStandardCards, categoryColorFor, categoryNameFor } from '../../shared/utils/category-helpers';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-favorites',
  imports: [QuestionCardComponent, SwipeDirective],
  template: `
    <div class="viewer container">
      <h2 class="title" style="color: var(--accent)">&#x2665; Favorites</h2>

      @if (favoriteCards().length) {
        <div class="card-stage" appSwipe
             (swipeLeft)="next()"
             (swipeRight)="prev()"
             [class.slide-left]="slideDir() === 'left'"
             [class.slide-right]="slideDir() === 'right'">
          <app-question-card
            [card]="currentCard()!"
            [color]="currentCardColor()"
            [categoryName]="currentCategoryName()"
            [favorited]="true"
            (toggleFavorite)="onToggleFavorite()"
          />
        </div>

        <div class="controls">
          <button class="nav-btn" (click)="prev()" [disabled]="currentIndex() === 0">&larr;</button>
          <span class="counter">{{ currentIndex() + 1 }} / {{ favoriteCards().length }}</span>
          <button class="nav-btn" (click)="next()" [disabled]="currentIndex() === favoriteCards().length - 1">&rarr;</button>
        </div>
      } @else {
        <p class="empty">No favorites yet. Tap the heart on any card to save it here.</p>
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
      margin-bottom: 32px;
    }
    .card-stage {
      width: 100%;
      max-width: 520px;
      position: relative;
    }
    .card-stage.slide-left {
      animation: slideInLeft 0.3s ease-out;
    }
    .card-stage.slide-right {
      animation: slideInRight 0.3s ease-out;
    }
    @keyframes slideInLeft {
      from { transform: translateX(60px); opacity: 0.5; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInRight {
      from { transform: translateX(-60px); opacity: 0.5; }
      to   { transform: translateX(0); opacity: 1; }
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 32px;
    }
    .nav-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--bg-surface);
      color: var(--text);
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, opacity 0.2s;
      &:hover:not(:disabled) { background: var(--accent); }
      &:disabled { opacity: 0.3; cursor: default; }
    }
    .counter {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-muted);
    }
    .empty {
      color: var(--text-muted);
      margin-top: 64px;
      text-align: center;
      line-height: 1.6;
    }
  `,
})
export class FavoritesComponent {
  private cardService = inject(CardService);
  private favoritesService = inject(FavoritesService);

  currentIndex = signal(0);
  slideDir = signal<'left' | 'right' | ''>('');

  private allCards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });
  private categories = toSignal(this.cardService.getCategories(), {
    initialValue: [] as Category[],
  });

  favoriteCards = computed(() => {
    const ids = this.favoritesService.favoriteIds();
    const standard = filterStandardCards(this.allCards(), this.categories());
    return standard.filter((c) => ids.has(c.id));
  });

  currentCard = computed(() => {
    const cards = this.favoriteCards();
    const i = Math.min(this.currentIndex(), cards.length - 1);
    return cards.length ? cards[Math.max(0, i)] : null;
  });

  currentCardColor = computed(() =>
    categoryColorFor(this.currentCard(), this.categories()),
  );

  currentCategoryName = computed(() =>
    categoryNameFor(this.currentCard(), this.categories()),
  );

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  next() {
    const idx = this.currentIndex();
    if (idx < this.favoriteCards().length - 1) {
      this.triggerSlide('left');
      this.currentIndex.set(idx + 1);
    }
  }

  prev() {
    const idx = this.currentIndex();
    if (idx > 0) {
      this.triggerSlide('right');
      this.currentIndex.set(idx - 1);
    }
  }

  onToggleFavorite(): void {
    const card = this.currentCard();
    if (!card) return;
    this.favoritesService.toggle(card.id);
    const cards = this.favoriteCards();
    if (this.currentIndex() >= cards.length - 1 && this.currentIndex() > 0) {
      this.currentIndex.set(this.currentIndex() - 1);
    }
  }

  private triggerSlide(dir: 'left' | 'right') {
    this.slideDir.set('');
    requestAnimationFrame(() => this.slideDir.set(dir));
  }
}
