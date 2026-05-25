import { Component, input, output, computed, inject, signal } from '@angular/core';
import { Card } from '../../core/models/card.model';
import { CardImageService } from '../../core/services/card-image.service';
import { ShareService } from '../../core/services/share.service';
import { parseCardBlocks } from '../utils/card-parser';

@Component({
  selector: 'app-question-card',
  template: `
    <div class="card" [style.border-color]="color()">
      <button class="share-btn" (click)="onShare($event)">
        @if (showCheck()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        }
      </button>
      <button class="heart-btn" (click)="onHeart($event)" [class.favorited]="favorited()">
        @if (favorited()) {
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        }
      </button>
      <span class="card-number">#{{ card().cardNumber }}</span>
      <div class="content">
        @for (block of blocks(); track $index) {
          @switch (block.type) {
            @case ('title') {
              <h3 class="title" [style.color]="color()">{{ block.content }}</h3>
            }
            @case ('text') {
              <p class="text">{{ block.content }}</p>
            }
            @case ('bullet') {
              <p class="bullet">{{ block.content }}</p>
            }
            @case ('divider') {
              <hr class="divider" [style.border-color]="color()" />
            }
            @case ('philosopher') {
              <div class="philosopher">
                <span class="philosopher-name" [style.color]="color()">{{ block.name }}</span>
                <p class="philosopher-text">{{ block.content }}</p>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
  styles: `
    .card {
      position: relative;
      background: var(--bg-card);
      border-radius: 24px;
      border-left: 5px solid;
      padding: 40px 28px;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      text-align: left;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      user-select: none;
      touch-action: pan-y;
    }
    .share-btn {
      position: absolute;
      top: 12px;
      right: 48px;
      background: none;
      border: none;
      padding: 6px;
      cursor: pointer;
      color: var(--text-muted);
      transition: color 0.2s, transform 0.2s;
      svg { width: 20px; height: 20px; }
      &:hover { transform: scale(1.15); }
      &.checked { color: #4caf50; }
    }
    .heart-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      padding: 6px;
      cursor: pointer;
      color: var(--text-muted);
      transition: color 0.2s, transform 0.2s;
      svg { width: 22px; height: 22px; }
      &:hover { transform: scale(1.15); }
      &.favorited { color: #e94560; }
    }
    .card-number {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0.35;
      margin-bottom: 12px;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      justify-content: center;
    }
    .title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .text {
      font-size: 1rem;
      line-height: 1.6;
      color: var(--text);
      opacity: 0.9;
    }
    .bullet {
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--text);
      opacity: 0.85;
      padding-left: 20px;
      position: relative;
      &::before {
        content: '•';
        position: absolute;
        left: 4px;
        opacity: 0.5;
      }
    }
    .divider {
      border: none;
      border-top: 1px solid;
      opacity: 0.2;
      margin: 6px 0;
    }
    .philosopher {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .philosopher-name {
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .philosopher-text {
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--text);
      opacity: 0.85;
    }
  `
})
export class QuestionCardComponent {
  private shareService = inject(ShareService);
  private cardImageService = inject(CardImageService);

  card = input.required<Card>();
  color = input<string>('#e94560');
  categoryName = input('');
  favorited = input(false);
  toggleFavorite = output<void>();

  blocks = computed(() => parseCardBlocks(this.card().questionText));
  showCheck = signal(false);

  onHeart(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleFavorite.emit();
  }

  async onShare(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const card = this.card();
    const suffix = this.categoryName() ? `${this.categoryName()} | ` : '';
    const fallbackText = `${card.questionText}\n\n— ${suffix}Thinking.Cards`;

    const blob = await this.cardImageService.generate({
      questionText: card.questionText,
      categoryName: this.categoryName(),
      categoryColor: this.color(),
      cardNumber: card.cardNumber,
    });

    const result = await this.shareService.shareImage(blob, fallbackText);
    if (result === 'copied' || result === 'downloaded') {
      this.showCheck.set(true);
      setTimeout(() => this.showCheck.set(false), 2000);
    }
  }
}
