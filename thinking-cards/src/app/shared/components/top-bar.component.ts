import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from './brand-logo.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-top-bar',
  imports: [RouterLink, BrandLogoComponent],
  template: `
    <header class="top-bar">
      <a routerLink="/" class="brand">
        <app-brand-logo class="brand-icon" />
        <span class="brand-name">Thinking.Cards</span>
      </a>
    </header>
  `,
  styles: `
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      height: 52px;
      padding-top: env(safe-area-inset-top, 0px);
      background: var(--bar-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--bar-border);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }

    .brand-icon {
      width: 24px;
      height: 24px;
      color: var(--accent);
    }

    .brand-name {
      font-family: 'Poppins', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text);
    }
  `,
})
export class TopBarComponent {}
