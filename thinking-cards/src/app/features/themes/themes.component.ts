import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, DARK_THEMES, LIGHT_THEMES } from '../../core/services/theme.service';

@Component({
  selector: 'app-themes',
  template: `
    <div class="themes container">
      <button class="back-btn" (click)="goBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Profile
      </button>

      <h1 class="page-title">Themes</h1>
      <p class="subtitle">Choose your look</p>

      <h2 class="section-title">Dark</h2>
      <div class="theme-grid">
        @for (t of darkThemes; track t.name) {
          <button
            class="theme-option"
            [class.active]="themeService.theme() === t.name"
            (click)="themeService.setTheme(t.name)"
          >
            <span class="theme-colors">
              <span class="color-dot" [style.background]="t.bg"></span>
              <span class="color-dot" [style.background]="t.accent"></span>
            </span>
            <span class="theme-label">{{ t.label }}</span>
            @if (themeService.theme() === t.name) {
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            }
          </button>
        }
      </div>

      <h2 class="section-title">Light</h2>
      <div class="theme-grid">
        @for (t of lightThemes; track t.name) {
          <button
            class="theme-option"
            [class.active]="themeService.theme() === t.name"
            (click)="themeService.setTheme(t.name)"
          >
            <span class="theme-colors">
              <span class="color-dot light-dot" [style.background]="t.bg"></span>
              <span class="color-dot" [style.background]="t.accent"></span>
            </span>
            <span class="theme-label">{{ t.label }}</span>
            @if (themeService.theme() === t.name) {
              <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }

    .themes {
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

    .theme-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      max-width: 320px;
      margin-bottom: 24px;
    }

    .theme-option {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--hover-overlay);
      color: var(--text);
      transition: background 0.15s;

      &:hover { background: var(--bg-surface); }

      &.active {
        background: var(--bg-surface);
        outline: 2px solid var(--accent);
      }
    }

    .theme-colors {
      display: flex;
      gap: 4px;
    }

    .color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .light-dot {
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12);
    }

    .theme-label {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 500;
      text-align: left;
    }

    .check-icon {
      width: 18px;
      height: 18px;
      color: var(--accent);
    }
  `,
})
export class ThemesComponent {
  readonly themeService = inject(ThemeService);
  readonly darkThemes = DARK_THEMES;
  readonly lightThemes = LIGHT_THEMES;
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
