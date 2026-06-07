import { Component, inject, computed , ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { CardService } from '../../core/services/card.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ProgressService } from '../../core/services/progress.service';
import { StreakService } from '../../core/services/streak.service';
import { BadgeService } from '../../core/services/badge.service';
import { Card } from '../../core/models/card.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  template: `
    <div class="profile container">
      <div class="avatar" [style.background]="avatarBg">
        {{ avatarLetter() }}
      </div>
      <p class="email">{{ userEmail() }}</p>

      <div class="stats-row">
        <div class="stat">
          <span class="stat-value">{{ cardsSeen() }}</span>
          <span class="stat-label">Cards Seen</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ favoritesCount() }}</span>
          <span class="stat-label">Favorites</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ decksExplored() }}</span>
          <span class="stat-label">Decks</span>
        </div>
      </div>

      <div class="streak-card">
        <svg class="streak-icon" viewBox="0 0 24 24" [attr.fill]="streak().activeToday ? '#ff6b6b' : 'none'" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22c-4.97 0-9-2.69-9-6 0-2.48 1.51-4.26 3.21-5.88C8.52 8 10 6 10 3c0 0 2 2 2 5 1-1 2-3 2-5 3 3 5 6 5 10 0 3.31-4.03 6-9 6z"/>
        </svg>
        <div class="streak-info">
          <span class="streak-count">{{ streak().current }}</span>
          <span class="streak-label">day streak</span>
        </div>
        <div class="streak-best">
          Best: {{ streak().longest }}
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span>Overall Progress</span>
          <span class="progress-pct">{{ overallPercent() }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="overallPercent()"></div>
        </div>
      </div>

      <button class="action-btn badges-btn" (click)="goBadges()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 12 7s5-3 7.5-3a2.5 2.5 0 0 1 0 5H18"/>
          <path d="M12 7v13"/>
          <path d="M8 20h8"/>
        </svg>
        Badges ({{ badgeService.earnedCount() }}/{{ badgeService.totalCount() }})
      </button>

      <button class="action-btn themes-btn" (click)="goThemes()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        Themes
      </button>

      @if (auth.isAdmin()) {
        <button class="action-btn admin-btn" (click)="goAdmin()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4"/>
          </svg>
          Admin Dashboard
        </button>
      }

      <button class="action-btn logout-btn" (click)="onLogout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>

      <p class="version">Thinking.Cards v1.0</p>
    </div>
  `,
  styles: `
    :host { display: block; }

    .profile {
      padding-top: 48px;
      padding-bottom: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .email {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 36px;
    }

    .stats-row {
      display: flex;
      gap: 32px;
      margin-bottom: 36px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-value {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .streak-card {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      max-width: 320px;
      padding: 16px;
      border-radius: 12px;
      background: var(--hover-overlay);
      margin-bottom: 24px;
    }

    .streak-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .streak-info {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex: 1;
    }

    .streak-count {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
    }

    .streak-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .streak-best {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .progress-section {
      width: 100%;
      max-width: 320px;
      margin-bottom: 40px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .progress-pct {
      font-weight: 600;
      color: var(--accent);
    }

    .progress-track {
      height: 8px;
      border-radius: 4px;
      background: var(--hover-overlay);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      background: var(--accent);
      transition: width 0.4s ease;
    }

    .action-btn {
      width: 100%;
      max-width: 320px;
      padding: 14px 20px;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: background 0.2s, opacity 0.2s;
      margin-bottom: 12px;
    }

    .btn-icon {
      width: 20px;
      height: 20px;
    }

    .badges-btn, .themes-btn {
      background: var(--hover-overlay);
      color: var(--text);
      margin-bottom: 24px;

      &:hover { opacity: 0.85; }
    }

    .admin-btn {
      background: var(--hover-overlay);
      color: var(--text);

      &:hover { opacity: 0.85; }
    }

    .logout-btn {
      background: rgba(233, 69, 96, 0.12);
      color: var(--accent);

      &:hover { background: rgba(233, 69, 96, 0.2); }
    }

    .version {
      margin-top: 32px;
      font-size: 0.75rem;
      color: rgba(160, 160, 176, 0.4);
    }
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  readonly badgeService = inject(BadgeService);
  private router = inject(Router);
  private cardService = inject(CardService);
  private favoritesService = inject(FavoritesService);
  private progressService = inject(ProgressService);
  private streakService = inject(StreakService);

  private allCards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });

  readonly avatarBg = 'var(--accent)';

  avatarLetter = computed(() => {
    const email = this.auth.currentUser()?.email;
    return email ? email[0] : '?';
  });

  userEmail = computed(() => this.auth.currentUser()?.email ?? '');

  streak = this.streakService.streak;

  cardsSeen = computed(() => this.progressService.seenIds().size);

  favoritesCount = computed(() => this.favoritesService.favoriteIds().size);

  decksExplored = computed(() => {
    const seen = this.progressService.seenIds();
    const cards = this.allCards();
    const exploredCats = new Set<string>();
    for (const card of cards) {
      if (seen.has(card.id)) exploredCats.add(card.categoryId);
    }
    return exploredCats.size;
  });

  overallPercent = computed(() => {
    const total = this.allCards().length;
    if (total === 0) return 0;
    const seen = this.progressService.seenIds().size;
    return Math.round((seen / total) * 100);
  });

  goBadges() {
    this.router.navigate(['/badges']);
  }

  goThemes() {
    this.router.navigate(['/themes']);
  }

  goAdmin() {
    this.router.navigate(['/admin']);
  }

  onLogout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
