import { Component, inject, output , ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';

const PALETTE = ['#e94560', '#6c5ce7', '#00b894', '#fdcb6e', '#0984e3', '#e17055'];

function randomPaletteColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-category-form',
  imports: [FormsModule, CategoryIconComponent],
  template: `
    <div class="form-card">
      <h3>Add Category</h3>
      <form (ngSubmit)="onSubmit()">
        <div class="name-row">
          <div class="preview" [style.color]="color">
            <app-category-icon [name]="name" />
          </div>
          <input placeholder="Name" [(ngModel)]="name" name="name" required />
        </div>
        <input placeholder="Description" [(ngModel)]="description" name="description" />
        <div class="type-row">
          <label class="type-label">Type</label>
          <div class="type-toggle">
            <button type="button" class="type-btn" [class.active]="type === 'standard'" (click)="type = 'standard'">Standard</button>
            <button type="button" class="type-btn" [class.active]="type === 'quiz'" (click)="type = 'quiz'">Quiz</button>
            <button type="button" class="type-btn" [class.active]="type === 'matrix'" (click)="type = 'matrix'">Matrix</button>
          </div>
        </div>
        <div class="color-row">
          <label for="cat-color">Color</label>
          <input id="cat-color" type="color" [(ngModel)]="color" name="color" />
          <span class="color-hex">{{ color }}</span>
        </div>
        <input type="number" placeholder="Order" [(ngModel)]="order" name="order" min="1" />
        <button type="submit" class="btn-save">Save Category</button>
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
    h3 { margin-bottom: 12px; font-size: 1rem; }
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .name-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .preview {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .name-row input { flex: 1; }
    input {
      background: var(--bg);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px 14px;
      color: var(--text);
      font-size: 0.9rem;
      &::placeholder { color: var(--text-muted); }
    }
    .color-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .color-row label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .color-row input[type="color"] {
      width: 40px;
      height: 36px;
      padding: 2px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      background: var(--bg);
      cursor: pointer;
    }
    .color-hex {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: monospace;
    }
    .type-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .type-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .type-toggle {
      display: flex;
      gap: 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .type-btn {
      padding: 8px 16px;
      font-size: 0.8rem;
      background: var(--bg);
      color: var(--text-muted);
      border: none;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      &.active {
        background: var(--accent);
        color: white;
      }
    }
    .btn-save {
      background: var(--accent);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
    }
    .success {
      color: #00b894;
      font-size: 0.85rem;
      margin: 0;
    }
  `
})
export class CategoryFormComponent {
  private adminService = inject(AdminService);
  saved = output<void>();

  name = '';
  description = '';
  color = randomPaletteColor();
  order = 1;
  type: 'standard' | 'quiz' | 'matrix' = 'standard';
  successMsg = '';

  onSubmit() {
    const payload: Omit<import('../../core/models/category.model').Category, 'id'> = {
      name: this.name,
      description: this.description,
      color: this.color,
      order: this.order,
      ...(this.type !== 'standard' ? { type: this.type } : {}),
    };
    this.adminService
      .addCategory(payload)
      .subscribe(() => {
        this.successMsg = `"${this.name}" created!`;
        this.name = '';
        this.description = '';
        this.color = randomPaletteColor();
        this.order = 1;
        this.type = 'standard';
        this.saved.emit();
        setTimeout(() => (this.successMsg = ''), 3000);
      });
  }
}
