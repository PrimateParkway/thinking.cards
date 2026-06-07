import { Component, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { ProgressService } from '../../core/services/progress.service';
import { CategoryCardComponent } from '../../shared/components/category-card.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [CategoryCardComponent],
  template: `
    <div class="home container">
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <button class="shuffle-btn" (click)="goShuffle()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
        Shuffle All Cards
      </button>

      <div class="grid">
        <div class="tile favorites-tile" role="button" tabindex="0" (click)="goFavorites()" (keydown.enter)="goFavorites()" (keydown.space)="$event.preventDefault(); goFavorites()">
          <div class="glow"></div>
          <span class="fav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </span>
          <h3 class="name">Favorites</h3>
          <p class="desc">Your saved cards</p>
        </div>

        @for (cat of standardCategories(); track cat.id) {
          <app-category-card
            [category]="cat"
            [progress]="progressFor(cat)"
            (click)="openCategory(cat)"
          />
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .home {
      padding-top: 32px;
      padding-bottom: 64px;
      position: relative;
      z-index: 1;
    }
    .home::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: -1;
      background: linear-gradient(135deg, var(--bg), var(--bg-card), var(--bg), var(--bg-surface));
      background-size: 400% 400%;
      animation: gradientShift 18s ease infinite;
    }
    @keyframes gradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .shuffle-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 auto 24px;
      padding: 12px 28px;
      border: 1px solid var(--bar-border);
      border-radius: 16px;
      background: var(--bg-card);
      color: var(--text);
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: transform 0.2s, box-shadow 0.2s;

      svg {
        width: 20px;
        height: 20px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }

    .favorites-tile {
      position: relative;
      border-radius: 20px;
      padding: 32px 24px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      min-height: 180px;
      justify-content: center;
      overflow: hidden;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid var(--bar-border);
      box-shadow: 0 4px 24px #e74c8855, 0 1px 8px rgba(0,0,0,0.3);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

      &:hover {
        transform: translateY(-4px);
        border-color: var(--bar-border);
      }

      .glow {
        position: absolute;
        inset: 0;
        opacity: 0.35;
        pointer-events: none;
        background: #e74c88;
        transition: opacity 0.25s ease;
      }

      &:hover .glow {
        opacity: 0.45;
      }

      .fav-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text);
        position: relative;

        svg {
          width: 52px;
          height: 52px;
        }
      }

      .name {
        font-family: 'Poppins', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text);
        position: relative;
      }

      .desc {
        font-size: 0.8rem;
        color: var(--text-muted);
        position: relative;
      }
    }
  `
})
export class HomeComponent {
  private cardService = inject(CardService);
  private progressService = inject(ProgressService);
  private router = inject(Router);

  error = signal('');

  private allCards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });

  private progressMap = computed(() =>
    this.progressService.countByCategory(this.allCards())
  );

  private allCategories = toSignal(
    this.cardService.getCategories().pipe(
      catchError(err => {
        this.error.set(err.message || 'Failed to load categories');
        return of([] as Category[]);
      })
    ),
    { initialValue: [] as Category[] }
  );

  standardCategories = computed(() =>
    this.allCategories().filter(c => !c.type || c.type === 'standard')
  );

  progressFor(cat: Category): number {
    return this.progressMap().get(cat.id)?.percent ?? 0;
  }

  openCategory(cat: Category) {
    this.router.navigate(['/category', cat.id]);
  }

  goShuffle() {
    this.router.navigate(['/shuffle']);
  }

  goFavorites() {
    this.router.navigate(['/favorites']);
  }
}
