import { Component , ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-brand-logo',
  template: `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
      <!-- Orbital ring -->
      <ellipse cx="24" cy="24" rx="18" ry="18"
               stroke="currentColor" stroke-width="2" fill="none" opacity="0.35"/>

      <!-- Tilted orbit path -->
      <ellipse cx="24" cy="24" rx="18" ry="8"
               stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"
               transform="rotate(-30 24 24)"/>

      <!-- Orbiting dot 1 — top of tilted path -->
      <circle cx="11" cy="14" r="3" fill="currentColor" opacity="0.7"/>

      <!-- Orbiting dot 2 — bottom of tilted path -->
      <circle cx="37" cy="34" r="2.5" fill="currentColor" opacity="0.5"/>

      <!-- Nucleus -->
      <circle cx="24" cy="24" r="4" fill="currentColor"/>
    </svg>
  `,
  styles: `
    :host { display: block; }
    .logo-svg { width: 100%; height: 100%; }
  `,
})
export class BrandLogoComponent {}
