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
  selector: 'app-puzzles',
  imports: [CategoryCardComponent],
  template: `
    <div class="puzzles container">
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <div class="grid">
        @for (cat of puzzleCategories(); track cat.id) {
          <app-category-card
            [category]="cat"
            [progress]="progressFor(cat)"
            (click)="openPuzzle(cat)"
          />
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .puzzles {
      padding-top: 32px;
      padding-bottom: 64px;
      position: relative;
      z-index: 1;
    }
    .puzzles::before {
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
export class PuzzlesComponent {
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
        this.error.set(err.message || 'Failed to load puzzles');
        return of([] as Category[]);
      })
    ),
    { initialValue: [] as Category[] }
  );

  puzzleCategories = computed(() =>
    this.allCategories().filter(c =>
      c.type === 'matrix' || c.type === 'cryptogram' || c.type === 'nonogram'
      || c.type === 'codebreaker' || c.type === 'knights'
    )
  );

  progressFor(cat: Category): number {
    if (cat.type === 'cryptogram') {
      const data = this.userState.allCryptogramProgress().get(cat.id);
      if (!data) return 0;
      const solved = data.solvedPuzzles?.length ?? 0;
      const total = this.puzzleCardCountFor(cat.id);
      return total ? Math.round((solved / total) * 100) : 0;
    }
    if (cat.type === 'nonogram') {
      const data = this.userState.allNonogramProgress().get(cat.id);
      if (!data) return 0;
      const solved = data.solvedPuzzles?.length ?? 0;
      const total = this.puzzleCardCountFor(cat.id);
      return total ? Math.round((solved / total) * 100) : 0;
    }
    if (cat.type === 'codebreaker') {
      const data = this.userState.allCodebreakerProgress().get(cat.id);
      if (!data) return 0;
      const solved = data.solvedPuzzles?.length ?? 0;
      const total = this.puzzleCardCountFor(cat.id);
      return total ? Math.round((solved / total) * 100) : 0;
    }
    if (cat.type === 'knights') {
      const data = this.userState.allKnightsProgress().get(cat.id);
      if (!data) return 0;
      const solved = data.solvedPuzzles?.length ?? 0;
      const total = this.puzzleCardCountFor(cat.id);
      return total ? Math.round((solved / total) * 100) : 0;
    }
    const data = this.userState.allMatrixProgress().get(cat.id);
    if (!data) return 0;
    const solved = data.solvedPuzzles?.length ?? 0;
    const total = this.puzzleCardCountFor(cat.id);
    return total ? Math.round((solved / total) * 100) : 0;
  }

  private puzzleCardCountFor(categoryId: string): number {
    return this.allCards().filter(c => c.categoryId === categoryId).length - 1;
  }

  openPuzzle(cat: Category) {
    if (cat.type === 'cryptogram') {
      this.router.navigate(['/cryptogram', cat.id]);
      return;
    }
    if (cat.type === 'nonogram') {
      this.router.navigate(['/nonogram', cat.id]);
      return;
    }
    if (cat.type === 'codebreaker') {
      this.router.navigate(['/codebreaker', cat.id]);
      return;
    }
    if (cat.type === 'knights') {
      this.router.navigate(['/knights', cat.id]);
      return;
    }
    this.router.navigate(['/matrix', cat.id]);
  }
}
