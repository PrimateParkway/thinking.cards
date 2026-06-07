import { Component, computed, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardService } from '../../core/services/card.service';
import { AdminService } from '../../core/services/admin.service';
import { CategoryFormComponent } from './category-form.component';
import { CardFormComponent } from './card-form.component';
import { CategoryCardsComponent } from './category-cards.component';
import { UserListComponent } from './user-list.component';
import { CategoryIconComponent } from '../../shared/components/category-icon.component';
import { Category } from '../../core/models/category.model';
import { Card } from '../../core/models/card.model';
import { AppUser } from '../../core/models/app-user.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-dashboard',
  imports: [FormsModule, CategoryFormComponent, CardFormComponent, CategoryCardsComponent, UserListComponent, CategoryIconComponent],
  template: `
    <div class="admin container">
      <h1>Admin Dashboard</h1>

      <section class="section">
        <h2>Users ({{ users().length }})</h2>
        <app-user-list [users]="users()" (delete)="confirmDeleteUser($event)" />
      </section>

      <section class="section">
        <h2>Categories</h2>
        <div class="list">
          @for (cat of categories(); track cat.id) {
            <div class="item-wrapper">
              <div class="item" [class.expanded]="selectedCategoryId() === cat.id"
                   [style.border-left-color]="editingCategoryId() === cat.id ? editColor : cat.color"
                   (click)="toggleCategory(cat.id)">
                @if (editingCategoryId() === cat.id) {
                  <span class="cat-edit-fields" (click)="$event.stopPropagation()">
                    <input type="color" [(ngModel)]="editColor" class="color-input" />
                    <input type="text" [(ngModel)]="editName" class="name-input" />
                  </span>
                  <span class="cat-edit-actions" (click)="$event.stopPropagation()">
                    <button class="save" (click)="saveCategory(cat.id)">Save</button>
                    <button class="cancel" (click)="cancelEditCategory()">Cancel</button>
                  </span>
                } @else {
                  <span class="cat-label">
                    <app-category-icon [name]="cat.name" class="cat-icon" [style.color]="cat.color" />
                    {{ cat.name }}
                    <span class="card-count">{{ cardCountMap()[cat.id] || 0 }} cards</span>
                  </span>
                  <span class="cat-actions">
                    <button class="edit" (click)="startEditCategory(cat); $event.stopPropagation()">Edit</button>
                    <button class="del" (click)="deleteCategory(cat); $event.stopPropagation()">Delete</button>
                  </span>
                }
              </div>
              @if (selectedCategoryId() === cat.id) {
                <app-category-cards [categoryId]="cat.id" />
              }
            </div>
          }
        </div>
        <app-category-form (saved)="refresh()" />
      </section>

      <section class="section">
        <h2>Add Card</h2>
        <app-card-form [categories]="categories()" [cardCountMap]="cardCountMap()" />
      </section>
    </div>
  `,
  styles: `
    .admin {
      padding-top: 24px;
      padding-bottom: 64px;
    }
    h1 { margin-bottom: 32px; }
    .section {
      margin-bottom: 40px;
    }
    h2 { margin-bottom: 16px; font-size: 1.2rem; }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .item-wrapper {
      background: var(--bg-card);
      border-radius: 10px;
      overflow: hidden;
    }
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-left: 4px solid;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.03); }
      &.expanded { background: rgba(255,255,255,0.05); }
    }
    app-category-cards {
      display: block;
      padding: 0 16px 12px;
    }
    .cat-label {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-count {
      font-size: 0.75rem;
      color: var(--text-muted);
      background: rgba(255,255,255,0.06);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .cat-icon {
      width: 28px;
      height: 28px;
    }
    .cat-actions {
      display: flex;
      gap: 6px;
    }
    .edit {
      background: rgba(108,92,231,0.15);
      color: #6c5ce7;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .del {
      background: rgba(233,69,96,0.15);
      color: var(--accent);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .cat-edit-fields {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    .color-input {
      width: 36px;
      height: 36px;
      padding: 2px;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
    }
    .name-input {
      flex: 1;
      background: var(--bg);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 8px 12px;
      color: var(--text);
      font-size: 0.9rem;
    }
    .cat-edit-actions {
      display: flex;
      gap: 6px;
    }
    .save {
      background: rgba(0,184,148,0.15);
      color: #00b894;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .cancel {
      background: rgba(255,255,255,0.06);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
  `
})
export class AdminDashboardComponent {
  private cardService = inject(CardService);
  private adminService = inject(AdminService);

  categories = toSignal(this.cardService.getCategories(), {
    initialValue: [] as Category[],
  });

  private cards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });

  cardCountMap = computed(() => {
    const map: Record<string, number> = {};
    for (const card of this.cards()) {
      map[card.categoryId] = (map[card.categoryId] || 0) + 1;
    }
    return map;
  });

  users = toSignal(this.adminService.getUsers(), {
    initialValue: [] as AppUser[],
  });

  selectedCategoryId = signal<string | null>(null);
  editingCategoryId = signal<string | null>(null);
  editName = '';
  editColor = '#ffffff';

  toggleCategory(id: string) {
    if (this.editingCategoryId() === id) return;
    this.selectedCategoryId.update(cur => cur === id ? null : id);
  }

  startEditCategory(cat: Category) {
    this.editingCategoryId.set(cat.id);
    this.editName = cat.name;
    this.editColor = cat.color;
  }

  saveCategory(catId: string) {
    this.adminService
      .updateCategory(catId, { name: this.editName, color: this.editColor })
      .subscribe(() => this.editingCategoryId.set(null));
  }

  cancelEditCategory() {
    this.editingCategoryId.set(null);
  }

  deleteCategory(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    this.adminService.deleteCategory(cat.id).subscribe();
  }

  confirmDeleteUser(user: AppUser) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    this.adminService.deleteUser(user.uid).subscribe();
  }

  refresh() {
    // Firestore real-time updates handle this automatically
  }
}
