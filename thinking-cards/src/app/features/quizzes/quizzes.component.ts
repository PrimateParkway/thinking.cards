import { Component, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CategoryCardComponent } from '../../shared/components/category-card.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quizzes',
  imports: [CategoryCardComponent],
  template: `
    <div class="quizzes container">
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <div class="grid">
        @for (cat of quizCategories(); track cat.id) {
          <app-category-card
            [category]="cat"
            [progress]="progressFor(cat)"
            (click)="openQuiz(cat)"
          />
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .quizzes {
      padding-top: 32px;
      padding-bottom: 64px;
      position: relative;
      z-index: 1;
    }
    .quizzes::before {
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
  `
})
export class QuizzesComponent {
  private cardService = inject(CardService);
  private router = inject(Router);
  private userState = inject(UserStateService);

  error = signal('');

  private allCards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });

  private allCategories = toSignal(
    this.cardService.getCategories().pipe(
      catchError(err => {
        this.error.set(err.message || 'Failed to load quizzes');
        return of([] as Category[]);
      })
    ),
    { initialValue: [] as Category[] }
  );

  quizCategories = computed(() =>
    this.allCategories().filter(c => c.type === 'quiz')
  );

  progressFor(cat: Category): number {
    const data = this.userState.allQuizProgress().get(cat.id);
    if (!data) return 0;
    if (data.completed) {
      return Math.round((data.score / (data.totalCards || 1)) * 100);
    }
    const total = data.totalCards || this.cardCountFor(cat.id);
    return total ? Math.round((data.index / total) * 100) : 0;
  }

  private cardCountFor(categoryId: string): number {
    return this.allCards().filter(c => c.categoryId === categoryId).length;
  }

  openQuiz(cat: Category) {
    this.router.navigate(['/quiz', cat.id]);
  }
}
