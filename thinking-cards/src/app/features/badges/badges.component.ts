import { Component, inject , ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeService } from '../../core/services/badge.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-badges',
  template: `
    <div class="badges container">
      <button class="back-btn" (click)="goBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Profile
      </button>

      <h1 class="page-title">Badges</h1>
      <p class="subtitle">{{ badgeService.earnedCount() }} of {{ badgeService.totalCount() }} earned</p>

      @for (section of badgeService.badges(); track section.title) {
        <h2 class="section-title">{{ section.title }}</h2>
        <div class="badge-grid">
          @for (badge of section.badges; track badge.id) {
            <div class="badge-card" [class.earned]="badge.earned">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                @for (p of getIconPaths(badge.icon); track $index) {
                  <path [attr.d]="p"/>
                }
              </svg>
              <div class="badge-text">
                <span class="badge-name">{{ badge.name }}</span>
                <span class="badge-desc">{{ badge.description }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }

    .badges {
      padding-top: 24px;
      padding-bottom: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .back-btn {
      align-self: flex-start;
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: var(--accent);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 0;
      margin-bottom: 16px;

      svg {
        width: 18px;
        height: 18px;
      }
    }

    .page-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 4px;
    }

    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 28px;
    }

    .section-title {
      font-family: 'Poppins', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      align-self: flex-start;
      width: 100%;
      max-width: 320px;
      margin: 0 0 10px;
    }

    .badge-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 320px;
      margin-bottom: 24px;
    }

    .badge-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--hover-overlay);
      opacity: 0.4;
      filter: grayscale(1);
      transition: opacity 0.2s, filter 0.2s;
    }

    .badge-card.earned {
      opacity: 1;
      filter: none;
    }

    .badge-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      color: var(--accent);
    }

    .badge-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .badge-name {
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text);
    }

    .badge-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `,
})
export class BadgesComponent {
  readonly badgeService = inject(BadgeService);
  private router = inject(Router);

  getIconPaths(icon: string): string[] {
    return icon.split('|');
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
