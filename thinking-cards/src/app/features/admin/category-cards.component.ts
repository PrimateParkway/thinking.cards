import { Component, computed, inject, input, signal , ChangeDetectionStrategy } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { CardService } from '../../core/services/card.service';
import { AdminService } from '../../core/services/admin.service';
import { Card } from '../../core/models/card.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-category-cards',
  imports: [FormsModule],
  template: `
    <div class="card-list">
      @for (card of cards(); track card.id; let i = $index) {
        <div class="card-row">
          @if (editingCardId() === card.id) {
            <div class="edit-fields">
              <input type="number" [(ngModel)]="editNumber" class="edit-num" min="1" />
              <textarea [(ngModel)]="editText" rows="2" class="edit-text"></textarea>
            </div>
            <div class="card-actions">
              <button class="save" (click)="saveEdit(card.id)">Save</button>
              <button class="cancel" (click)="cancelEdit()">Cancel</button>
            </div>
          } @else {
            <div class="card-info">
              <span class="card-num">#{{ card.cardNumber }}</span>
              <span class="card-text">{{ card.questionText }}</span>
            </div>
            <div class="card-actions">
              <button class="move" [disabled]="i === 0" (click)="moveUp(i)">&#9650;</button>
              <button class="move" [disabled]="i === cards().length - 1" (click)="moveDown(i)">&#9660;</button>
              <button class="edit" (click)="startEdit(card)">Edit</button>
              <button class="del" (click)="confirmDelete(card)">Delete</button>
            </div>
          }
        </div>
      } @empty {
        <p class="empty">No cards yet.</p>
      }
    </div>
  `,
  styles: `
    .card-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 0 4px;
    }
    .card-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      background: var(--bg);
      padding: 10px 14px;
      border-radius: 8px;
    }
    .card-info {
      display: flex;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .card-num {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--accent);
      flex-shrink: 0;
    }
    .card-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .move {
      background: rgba(255,255,255,0.06);
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      &:disabled { opacity: 0.25; }
    }
    .edit {
      background: rgba(108,92,231,0.15);
      color: #6c5ce7;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .del {
      background: rgba(233,69,96,0.15);
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .save {
      background: rgba(0,184,148,0.15);
      color: #00b894;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .cancel {
      background: rgba(255,255,255,0.06);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .edit-fields {
      display: flex;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
    .edit-num {
      width: 60px;
      background: var(--bg-card);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 6px 8px;
      color: var(--text);
      font-size: 0.85rem;
    }
    .edit-text {
      flex: 1;
      background: var(--bg-card);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 6px 8px;
      color: var(--text);
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
      resize: vertical;
    }
    .empty {
      color: var(--text-muted);
      font-size: 0.85rem;
      padding: 4px 0;
    }
  `,
})
export class CategoryCardsComponent {
  private cardService = inject(CardService);
  private adminService = inject(AdminService);

  categoryId = input.required<string>();

  editingCardId = signal<string | null>(null);
  editText = '';
  editNumber = 1;

  private rawCards = toSignal(
    toObservable(this.categoryId).pipe(
      switchMap(id => this.cardService.getCardsByCategory(id))
    ),
    { initialValue: [] as Card[] }
  );

  cards = computed(() =>
    [...this.rawCards()].sort((a, b) => a.cardNumber - b.cardNumber)
  );

  startEdit(card: Card) {
    this.editingCardId.set(card.id);
    this.editText = card.questionText;
    this.editNumber = card.cardNumber;
  }

  saveEdit(cardId: string) {
    this.adminService
      .updateCard(cardId, {
        questionText: this.editText,
        cardNumber: Math.floor(Number(this.editNumber)),
      })
      .subscribe(() => this.editingCardId.set(null));
  }

  cancelEdit() {
    this.editingCardId.set(null);
  }

  moveUp(index: number) {
    const list = this.cards();
    if (index <= 0) return;
    this.swapCardNumbers(list[index], list[index - 1]);
  }

  moveDown(index: number) {
    const list = this.cards();
    if (index >= list.length - 1) return;
    this.swapCardNumbers(list[index], list[index + 1]);
  }

  confirmDelete(card: Card) {
    if (!confirm(`Delete card #${card.cardNumber}?`)) return;
    this.adminService.deleteCard(card.id).subscribe();
  }

  private swapCardNumbers(a: Card, b: Card) {
    const numA = a.cardNumber;
    const numB = b.cardNumber;
    this.adminService.updateCard(a.id, { cardNumber: numB }).subscribe();
    this.adminService.updateCard(b.id, { cardNumber: numA }).subscribe();
  }
}
