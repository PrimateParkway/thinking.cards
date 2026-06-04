import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

interface Tab {
  label: string;
  route: string;
}

const TABS: Tab[] = [
  { label: 'Daily', route: '/daily' },
  { label: 'Questions', route: '/' },
  { label: 'Quizzes', route: '/quizzes' },
  { label: 'Puzzles', route: '/puzzles' },
  { label: 'Profile', route: '/profile' },
];

@Component({
  selector: 'app-bottom-bar',
  imports: [RouterLink],
  template: `
    <nav class="bottom-bar">
      @for (tab of tabs; track tab.route) {
        <a
          [routerLink]="tab.route"
          class="tab"
          [class.active]="activeRoute() === tab.route"
        >
          <span class="tab-icon">
            @switch (tab.route) {
              @case ('/daily') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              }
              @case ('/') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              }
              @case ('/quizzes') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @case ('/puzzles') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>
                </svg>
              }
              @case ('/profile') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              }
            }
          </span>
          <span class="tab-label">{{ tab.label }}</span>
          @if (activeRoute() === tab.route) {
            <span class="dot"></span>
          }
        </a>
      }
    </nav>
  `,
  styles: `
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      height: 64px;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: var(--bar-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--bar-border);
      display: flex;
      align-items: center;
      justify-content: space-around;
    }

    .tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 8px 16px;
      color: rgba(160, 160, 176, 0.7);
      text-decoration: none;
      transition: color 0.2s;
      position: relative;

      &.active {
        color: var(--accent);
      }
    }

    .tab-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 24px;
        height: 24px;
      }
    }

    .tab-label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--accent);
      position: absolute;
      bottom: 4px;
    }
  `,
})
export class BottomBarComponent {
  readonly tabs = TABS;

  private router = inject(Router);

  activeRoute = signal(this.matchTab(this.router.url));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.activeRoute.set(this.matchTab(e.urlAfterRedirects)));
  }

  private matchTab(url: string): string {
    const exact = TABS.find((t) => t.route === url);
    if (exact) return exact.route;

    if (url === '' || url === '/') return '/';
    if (url.startsWith('/quiz/')) return '/quizzes';
    if (url.startsWith('/matrix/')) return '/puzzles';
    if (url.startsWith('/cryptogram/')) return '/puzzles';
    if (url.startsWith('/nonogram/')) return '/puzzles';
    if (url.startsWith('/category/')) return '/';

    return url;
  }
}
