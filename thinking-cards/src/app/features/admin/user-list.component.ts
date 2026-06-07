import { Component, input, output , ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppUser } from '../../core/models/app-user.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-list',
  imports: [DatePipe],
  template: `
    <div class="list">
      @for (user of users(); track user.uid) {
        <div class="item">
          <div class="info">
            <span class="email">{{ user.email }}</span>
            <span class="date">Joined {{ user.createdAt | date: 'mediumDate' }}</span>
          </div>
          <button class="del" (click)="delete.emit(user)">Delete</button>
        </div>
      } @empty {
        <p class="empty">No users found.</p>
      }
    </div>
  `,
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card);
      padding: 12px 16px;
      border-radius: 10px;
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .email {
      font-weight: 500;
    }
    .date {
      font-size: 0.8rem;
      opacity: 0.6;
    }
    .del {
      background: rgba(233, 69, 96, 0.15);
      color: var(--accent);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .empty {
      opacity: 0.5;
      font-style: italic;
    }
  `,
})
export class UserListComponent {
  readonly users = input.required<AppUser[]>();
  readonly delete = output<AppUser>();
}
