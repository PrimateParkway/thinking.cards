import { Component, inject, signal, computed, effect, HostListener , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, tap, from } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ProgressService } from '../../core/services/progress.service';
import { StreakService } from '../../core/services/streak.service';
import { UserStateService } from '../../core/services/user-state.service';
import { QuestionCardComponent } from '../../shared/components/question-card.component';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { SwipeDirective } from '../../shared/directives/swipe.directive';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-card-viewer',
  imports: [QuestionCardComponent, CategoryIconComponent, SwipeDirective],
  template: `
    <div class="viewer container">
      @if (category(); as cat) {
        <button class="back-btn" (click)="goBack()">&larr; Back</button>
        <h2 class="cat-title" [style.color]="cat.color">
          <app-category-icon [name]="cat.name" class="title-icon" />
          {{ cat.name }}
        </h2>
      }

      @if (cards().length) {
        <div class="card-stage" appSwipe
             (swipeLeft)="next()"
             (swipeRight)="prev()"
             [class.slide-left]="slideDir() === 'left'"
             [class.slide-right]="slideDir() === 'right'">
          <app-question-card
            [card]="currentCard()!"
            [color]="category()?.color ?? '#e94560'"
            [categoryName]="category()?.name ?? ''"
            [favorited]="isFavorited()"
            (toggleFavorite)="onToggleFavorite()"
          />
        </div>

        <div class="controls">
          <button class="nav-btn" (click)="prev()" [disabled]="currentIndex() === 0">&larr;</button>
          <span class="counter">{{ currentIndex() + 1 }} / {{ cards().length }}</span>
          <button class="nav-btn" (click)="next()" [disabled]="currentIndex() === cards().length - 1">&rarr;</button>
        </div>
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
    .back-btn {
      align-self: flex-start;
      background: none;
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 16px;
      padding: 4px 0;
      &:hover { color: var(--text); }
    }
    .cat-title {
      font-size: 1.5rem;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-icon {
      width: 30px;
      height: 30px;
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
    .loading {
      color: var(--text-muted);
      margin-top: 64px;
    }
  `,
})
export class CardViewerComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private favoritesService = inject(FavoritesService);
  private progressService = inject(ProgressService);
  private streakService = inject(StreakService);
  private userState = inject(UserStateService);

  currentIndex = signal(0);
  slideDir = signal<'left' | 'right' | ''>('');

  constructor() {
    effect(() => {
      const card = this.currentCard();
      if (!card) return;
      this.progressService.markSeen(card.id);
      this.streakService.recordActivity();
    });

  }

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
        from(this.userState.loadCardPosition(this.categoryId()!)).pipe(
          tap(saved => this.currentIndex.set(Math.min(saved, cards.length - 1))),
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

  isFavorited = computed(() => {
    const card = this.currentCard();
    return card ? this.favoritesService.favoriteIds().has(card.id) : false;
  });

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  next() {
    const idx = this.currentIndex();
    if (idx < this.cards().length - 1) {
      this.triggerSlide('left');
      this.currentIndex.set(idx + 1);
      this.userState.saveCardPosition(this.categoryId()!, idx + 1);
    }
  }

  prev() {
    const idx = this.currentIndex();
    if (idx > 0) {
      this.triggerSlide('right');
      this.currentIndex.set(idx - 1);
      this.userState.saveCardPosition(this.categoryId()!, idx - 1);
    }
  }

  onToggleFavorite(): void {
    const card = this.currentCard();
    if (card) this.favoritesService.toggle(card.id);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private triggerSlide(dir: 'left' | 'right') {
    this.slideDir.set('');
    // Force reflow to restart animation
    requestAnimationFrame(() => this.slideDir.set(dir));
  }

}
