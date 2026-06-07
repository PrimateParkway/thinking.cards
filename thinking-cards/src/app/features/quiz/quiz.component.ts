import { Component, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, tap, from } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { StreakService } from '../../core/services/streak.service';
import { UserStateService, QuizProgress } from '../../core/services/user-state.service';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { Card } from '../../core/models/card.model';
import { Category } from '../../core/models/category.model';

interface ShuffledCard {
  card: Card;
  options: string[];
  correctIndex: number;
}

type QuizState = 'question' | 'answered' | 'complete';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quiz',
  imports: [CategoryIconComponent],
  template: `
    <div class="quiz container">
      <button class="back-btn" (click)="goBack()">&larr; Back</button>

      @if (category(); as cat) {
        <h2 class="cat-title" [style.color]="cat.color">
          <app-category-icon [name]="cat.name" class="title-icon" />
          {{ cat.name }}
        </h2>
      }

      @if (state() !== 'complete') {
        <div class="score-bar">
          <span class="score-text">Score: {{ score() }} / {{ totalAnswered() }}</span>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPercent()"></div>
          </div>
          <span class="question-counter">{{ currentIndex() + 1 }} of {{ cards().length }}</span>
        </div>
      }

      @switch (state()) {
        @case ('question') {
          @if (currentShuffled(); as sc) {
            <div class="quote-card" [style.border-color]="category()?.color ?? '#e94560'">
              <span class="card-number">#{{ sc.card.cardNumber }}</span>
              <p class="quote">"{{ sc.card.questionText }}"</p>
            </div>
            <div class="options">
              @for (opt of sc.options; track $index) {
                <button class="option-btn" (click)="selectAnswer($index)">
                  {{ opt }}
                </button>
              }
            </div>
          }
        }

        @case ('answered') {
          @if (currentShuffled(); as sc) {
            <div class="quote-card" [style.border-color]="category()?.color ?? '#e94560'">
              <span class="card-number">#{{ sc.card.cardNumber }}</span>
              <p class="quote">"{{ sc.card.questionText }}"</p>
            </div>
            <div class="options">
              @for (opt of sc.options; track $index) {
                <button
                  class="option-btn"
                  [class.correct]="$index === sc.correctIndex"
                  [class.wrong]="$index === selectedIndex() && $index !== sc.correctIndex"
                  disabled
                >
                  {{ opt }}
                  @if ($index === sc.correctIndex) {
                    <span class="check-icon">&#10003;</span>
                  }
                  @if ($index === selectedIndex() && $index !== sc.correctIndex) {
                    <span class="x-icon">&#10007;</span>
                  }
                </button>
              }
            </div>
            @if (sc.card.explanation) {
              <div class="explanation" [style.border-color]="category()?.color ?? '#e94560'">
                <p class="explanation-text">{{ sc.card.explanation }}</p>
              </div>
            }
            <button class="next-btn" (click)="nextQuestion()">
              {{ isLastQuestion() ? 'See Results' : 'Next' }} &rarr;
            </button>
          }
        }

        @case ('complete') {
          <div class="results-card">
            <div class="results-score">{{ score() }} / {{ cards().length }}</div>
            <p class="results-label">
              @if (scorePercent() === 100) {
                Perfect score!
              } @else if (scorePercent() >= 70) {
                Great job!
              } @else if (scorePercent() >= 40) {
                Not bad!
              } @else {
                Keep learning!
              }
            </p>
            <div class="results-bar-track">
              <div class="results-bar-fill" [style.width.%]="scorePercent()" [style.background]="category()?.color ?? '#e94560'"></div>
            </div>
            <button class="play-again-btn" (click)="playAgain()">Play Again</button>
            <button class="home-btn" (click)="goBack()">Back to Home</button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .quiz {
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
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-icon {
      width: 30px;
      height: 30px;
    }

    /* Score bar */
    .score-bar {
      width: 100%;
      max-width: 520px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .score-text {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .progress-track {
      flex: 1;
      height: 6px;
      background: var(--bg-surface);
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .question-counter {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    /* Quote card */
    .quote-card {
      position: relative;
      width: 100%;
      max-width: 520px;
      background: var(--bg-card);
      border-radius: 24px;
      border-left: 5px solid;
      padding: 40px 28px;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      margin-bottom: 20px;
    }
    .card-number {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0.35;
      margin-bottom: 12px;
    }
    .quote {
      font-family: 'Poppins', sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      font-style: italic;
      line-height: 1.5;
      text-align: center;
    }

    /* Options */
    .options {
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }
    .option-btn {
      width: 100%;
      padding: 16px 20px;
      border-radius: 40px;
      background: var(--bg-surface);
      color: var(--text);
      font-size: 1rem;
      font-weight: 500;
      text-align: center;
      transition: background 0.2s, transform 0.1s;
      position: relative;
      &:hover:not(:disabled) {
        background: var(--hover-overlay);
        transform: scale(1.01);
      }
      &:disabled { cursor: default; }
      &.correct {
        background: rgba(0, 184, 148, 0.2);
        color: #00b894;
        font-weight: 600;
      }
      &.wrong {
        background: rgba(233, 69, 96, 0.2);
        color: #e94560;
        font-weight: 600;
      }
    }
    .check-icon, .x-icon {
      margin-left: 8px;
      font-weight: 700;
    }

    /* Explanation */
    .explanation {
      width: 100%;
      max-width: 520px;
      background: var(--bg-card);
      border-radius: 16px;
      border-left: 3px solid;
      padding: 20px 24px;
      margin-bottom: 16px;
      animation: slideIn 0.3s ease-out;
    }
    .explanation-text {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text);
      opacity: 0.9;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Next button */
    .next-btn {
      width: 100%;
      max-width: 520px;
      padding: 16px;
      border-radius: 12px;
      background: var(--accent);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
    }

    /* Results */
    .results-card {
      width: 100%;
      max-width: 520px;
      background: var(--bg-card);
      border-radius: 24px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .results-score {
      font-family: 'Poppins', sans-serif;
      font-size: 3rem;
      font-weight: 800;
    }
    .results-label {
      font-size: 1.1rem;
      color: var(--text-muted);
    }
    .results-bar-track {
      width: 100%;
      height: 8px;
      background: var(--bg-surface);
      border-radius: 4px;
      overflow: hidden;
    }
    .results-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .play-again-btn {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      background: var(--accent);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      margin-top: 8px;
      &:hover { opacity: 0.9; }
    }
    .home-btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      background: var(--bg-surface);
      color: var(--text-muted);
      font-size: 0.95rem;
      font-weight: 500;
      &:hover { color: var(--text); }
    }
  `
})
export class QuizComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private streakService = inject(StreakService);
  private userState = inject(UserStateService);

  currentIndex = signal(0);
  state = signal<QuizState>('question');
  selectedIndex = signal(-1);
  score = signal(0);
  totalAnswered = signal(0);

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
      switchMap(cards => {
        this.shuffledCards.set(cards.map(c => this.shuffleOptions(c)));
        return from(this.userState.loadQuizProgress(this.categoryId()!)).pipe(
          tap(saved => {
            if (!saved) return;
            if (saved.completed) {
              this.score.set(saved.score);
              this.totalAnswered.set(saved.totalCards ?? cards.length);
              this.currentIndex.set(cards.length - 1);
              this.state.set('complete');
            } else if (saved.index < cards.length) {
              this.currentIndex.set(saved.index);
              this.score.set(saved.score);
              this.totalAnswered.set(saved.totalAnswered);
            }
          }),
          map(() => cards),
        );
      }),
    ),
    { initialValue: [] as Card[] }
  );

  private shuffledCards = signal<ShuffledCard[]>([]);

  currentShuffled = computed(() => {
    const sc = this.shuffledCards();
    const i = this.currentIndex();
    return sc.length ? sc[i] : null;
  });

  isLastQuestion = computed(() =>
    this.currentIndex() >= this.cards().length - 1
  );

  progressPercent = computed(() => {
    const total = this.cards().length;
    if (!total) return 0;
    return (this.currentIndex() / total) * 100;
  });

  scorePercent = computed(() => {
    const total = this.cards().length;
    if (!total) return 0;
    return Math.round((this.score() / total) * 100);
  });

  selectAnswer(index: number) {
    if (this.state() !== 'question') return;

    this.selectedIndex.set(index);
    this.state.set('answered');
    this.totalAnswered.update(v => v + 1);

    const sc = this.currentShuffled();
    if (sc && index === sc.correctIndex) {
      this.score.update(v => v + 1);
    }

    this.streakService.recordActivity();
    this.persistProgress();
  }

  nextQuestion() {
    if (this.isLastQuestion()) {
      this.state.set('complete');
      this.saveCompleted();
      return;
    }

    this.currentIndex.update(i => i + 1);
    this.selectedIndex.set(-1);
    this.state.set('question');
    this.persistProgress();
  }

  playAgain() {
    this.shuffledCards.set(this.cards().map(c => this.shuffleOptions(c)));
    this.currentIndex.set(0);
    this.selectedIndex.set(-1);
    this.score.set(0);
    this.totalAnswered.set(0);
    this.state.set('question');
    this.persistProgress();
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private shuffleOptions(card: Card): ShuffledCard {
    const options = [...(card.options ?? [])];
    const correctAnswer = options[card.correctIndex ?? 0];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return {
      card,
      options,
      correctIndex: options.indexOf(correctAnswer),
    };
  }

  private saveCompleted(): void {
    const catId = this.categoryId();
    if (!catId) return;
    this.userState.saveQuizProgress(catId, {
      index: this.currentIndex(),
      score: this.score(),
      totalAnswered: this.totalAnswered(),
      completed: true,
      totalCards: this.cards().length,
    });
  }

  private persistProgress(): void {
    const catId = this.categoryId();
    if (!catId) return;
    this.userState.saveQuizProgress(catId, {
      index: this.currentIndex(),
      score: this.score(),
      totalAnswered: this.totalAnswered(),
    });
  }
}
