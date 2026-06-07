import { Component, inject, input, computed , ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Category } from '../../core/models/category.model';
import { Card } from '../../core/models/card.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-card-form',
  imports: [FormsModule],
  template: `
    <div class="form-card">
      <form (ngSubmit)="onSubmit()">
        <select [(ngModel)]="categoryId" name="categoryId" required (ngModelChange)="onCategoryChange($event)">
          <option value="" disabled>Select category</option>
          @for (cat of categories(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <input type="number" placeholder="Card Number (1-10)" [(ngModel)]="cardNumber" name="cardNumber" required min="1" />
        <textarea placeholder="Question text" [(ngModel)]="questionText" name="questionText" rows="3" required></textarea>
        @if (!isQuiz() && !isMatrix() && !isCryptogram() && !isNonogram()) {
          <p class="hint">Line breaks = title + body | use • for bullets | Name: for quotes</p>
        }
        @if (isQuiz()) {
          <div class="quiz-fields">
            <p class="quiz-label">Answer Options</p>
            @for (opt of options; track $index) {
              <input [placeholder]="'Option ' + ($index + 1)" [(ngModel)]="options[$index]" [name]="'option' + $index" />
            }
            <div class="correct-row">
              <label>Correct Answer</label>
              <select [(ngModel)]="correctIndex" name="correctIndex">
                @for (opt of options; track $index) {
                  <option [ngValue]="$index">{{ opt || 'Option ' + ($index + 1) }}</option>
                }
              </select>
            </div>
            <textarea placeholder="Explanation (shown after answering)" [(ngModel)]="explanation" name="explanation" rows="3"></textarea>
          </div>
        }
        @if (isCryptogram()) {
          <div class="quiz-fields">
            <p class="quiz-label">Cryptogram Fields</p>
            <textarea placeholder="Plaintext quote" [(ngModel)]="cryptogramPlaintext" name="cryptogramPlaintext" rows="3"></textarea>
            <input placeholder="Author / attribution" [(ngModel)]="cryptogramAuthor" name="cryptogramAuthor" />
          </div>
        }
        @if (isNonogram()) {
          <div class="quiz-fields">
            <p class="quiz-label">Nonogram Fields</p>
            <textarea placeholder="Solution JSON: [[1,0,1],[0,1,0],...]" [(ngModel)]="nonogramSolutionText" name="nonogramSolution" rows="4"></textarea>
            <textarea placeholder="Explanation (shown after solving)" [(ngModel)]="explanation" name="nonogramExplanation" rows="3"></textarea>
          </div>
        }
        @if (isMatrix()) {
          <div class="quiz-fields">
            <p class="quiz-label">Matrix Puzzle Fields</p>
            <textarea placeholder="Scenario description" [(ngModel)]="matrixScenario" name="matrixScenario" rows="2"></textarea>
            @for (g of matrixGroupNames; track $index) {
              <div class="quiz-fields" style="gap: 6px">
                <input [placeholder]="'Group ' + ($index + 1) + ' name'" [(ngModel)]="matrixGroupNames[$index]" [name]="'gname' + $index" />
                <input [placeholder]="'Items (comma-separated)'" [(ngModel)]="matrixGroupItems[$index]" [name]="'gitems' + $index" />
                <input [placeholder]="'Grid labels (comma-separated)'" [(ngModel)]="matrixGroupLabels[$index]" [name]="'glabels' + $index" />
              </div>
            }
            <textarea placeholder="Clues (one per line)" [(ngModel)]="matrixCluesText" name="matrixClues" rows="5"></textarea>
            <textarea placeholder="Solution JSON: {&quot;Item1&quot;: {&quot;g1&quot;: &quot;val&quot;, &quot;g2&quot;: &quot;val&quot;}, ...}" [(ngModel)]="matrixSolutionText" name="matrixSolution" rows="4"></textarea>
            <textarea placeholder="Explanation steps (one per line)" [(ngModel)]="matrixExplanationText" name="matrixExplanation" rows="4"></textarea>
          </div>
        }
        <button type="submit" class="btn-save">Add Card</button>
        @if (successMsg) {
          <p class="success">{{ successMsg }}</p>
        }
      </form>
    </div>
  `,
  styles: `
    .form-card {
      background: var(--bg-card);
      padding: 24px;
      border-radius: var(--radius);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    input, select, textarea {
      background: var(--bg);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px 14px;
      color: var(--text);
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      &::placeholder { color: var(--text-muted); }
    }
    select option { background: var(--bg); color: var(--text); }
    .btn-save {
      background: var(--accent);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
    }
    .hint {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin: -4px 0 0;
      opacity: 0.7;
    }
    .success {
      color: #00b894;
      font-size: 0.85rem;
      margin: 0;
    }
    .quiz-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .quiz-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0;
    }
    .correct-row {
      display: flex;
      align-items: center;
      gap: 10px;
      label {
        font-size: 0.85rem;
        color: var(--text-muted);
        white-space: nowrap;
      }
      select { flex: 1; }
    }
  `
})
export class CardFormComponent {
  private adminService = inject(AdminService);
  categories = input.required<Category[]>();
  cardCountMap = input<Record<string, number>>({});

  categoryId = '';
  cardNumber = 1;
  questionText = '';
  successMsg = '';

  options = ['', '', '', ''];
  correctIndex = 0;
  explanation = '';

  cryptogramPlaintext = '';
  cryptogramAuthor = '';

  nonogramSolutionText = '';

  matrixScenario = '';
  matrixGroupNames = ['', '', ''];
  matrixGroupItems = ['', '', ''];
  matrixGroupLabels = ['', '', ''];
  matrixCluesText = '';
  matrixSolutionText = '';
  matrixExplanationText = '';

  isQuiz = computed(() => {
    const cats = this.categories();
    const selected = cats.find(c => c.id === this.categoryId);
    return selected?.type === 'quiz';
  });

  isMatrix = computed(() => {
    const cats = this.categories();
    const selected = cats.find(c => c.id === this.categoryId);
    return selected?.type === 'matrix';
  });

  isCryptogram = computed(() => {
    const cats = this.categories();
    const selected = cats.find(c => c.id === this.categoryId);
    return selected?.type === 'cryptogram';
  });

  isNonogram = computed(() => {
    const cats = this.categories();
    const selected = cats.find(c => c.id === this.categoryId);
    return selected?.type === 'nonogram';
  });

  onCategoryChange(categoryId: string) {
    const count = this.cardCountMap()[categoryId] || 0;
    this.cardNumber = count + 1;
  }

  onSubmit() {
    const card: Omit<Card, 'id'> = {
      categoryId: this.categoryId,
      cardNumber: Math.floor(Number(this.cardNumber)),
      questionText: this.questionText,
    };

    if (this.isQuiz()) {
      card.options = [...this.options];
      card.correctIndex = this.correctIndex;
      card.explanation = this.explanation;
    }

    if (this.isCryptogram()) {
      card.cryptogramPlaintext = this.cryptogramPlaintext;
      card.cryptogramAuthor = this.cryptogramAuthor;
    }

    if (this.isNonogram()) {
      card.explanation = this.explanation;
      try {
        const grid: number[][] = JSON.parse(this.nonogramSolutionText);
        card.nonogramSolution = grid.flat();
        card.nonogramCols = grid[0]?.length ?? 0;
      } catch {}
    }

    if (this.isMatrix()) {
      card.matrixScenario = this.matrixScenario;
      card.matrixGroups = this.matrixGroupNames.map((name, i) => ({
        name,
        items: this.matrixGroupItems[i].split(',').map(s => s.trim()),
        labels: this.matrixGroupLabels[i].split(',').map(s => s.trim()),
      }));
      card.matrixClues = this.matrixCluesText.split('\n').filter(l => l.trim());
      card.matrixExplanation = this.matrixExplanationText.split('\n').filter(l => l.trim());
      try { card.matrixSolution = JSON.parse(this.matrixSolutionText); } catch {}
    }

    this.adminService.addCard(card).subscribe(() => {
      this.successMsg = `Card #${this.cardNumber} added!`;
      this.questionText = '';
      this.cardNumber++;
      this.options = ['', '', '', ''];
      this.correctIndex = 0;
      this.explanation = '';
      this.cryptogramPlaintext = '';
      this.cryptogramAuthor = '';
      this.nonogramSolutionText = '';
      this.matrixScenario = '';
      this.matrixGroupNames = ['', '', ''];
      this.matrixGroupItems = ['', '', ''];
      this.matrixGroupLabels = ['', '', ''];
      this.matrixCluesText = '';
      this.matrixSolutionText = '';
      this.matrixExplanationText = '';
      setTimeout(() => (this.successMsg = ''), 3000);
    });
  }
}
