import { Component, input, computed , ChangeDetectionStrategy } from '@angular/core';
import { Category } from '../../core/models/category.model';
import { CategoryIconComponent } from './category-icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-category-card',
  imports: [CategoryIconComponent],
  template: `
    <div class="tile" [style]="tileStyles()" role="button" tabindex="0" (keydown.enter)="$any($event.target).click()" (keydown.space)="$event.preventDefault(); $any($event.target).click()">
      <div class="glow" [style.background]="category().color"></div>
      <app-category-icon [name]="category().name" class="icon" />
      <h3 class="name">{{ category().name }}</h3>
      <p class="desc">{{ category().description }}</p>
      @if (progress() > 0) {
        <span class="progress-text">{{ progress() }}%</span>
      }
      @if (progress() > 0) {
        <div class="progress-track">
          <div class="progress-fill"
               [style.width.%]="progress()"
               [style.background]="category().color">
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .tile {
      position: relative;
      border-radius: 20px;
      padding: 32px 24px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      min-height: 180px;
      justify-content: center;
      overflow: hidden;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid var(--bar-border);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

      &:hover {
        transform: translateY(-4px);
        border-color: var(--bar-border);
      }
    }

    .glow {
      position: absolute;
      inset: 0;
      opacity: 0.35;
      pointer-events: none;
      transition: opacity 0.25s ease;

      .tile:hover & {
        opacity: 0.45;
      }
    }

    .icon {
      width: 52px;
      height: 52px;
      color: var(--text);
      position: relative;
    }

    .name {
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
      position: relative;
    }

    .desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      position: relative;
    }

    .progress-text {
      position: absolute;
      bottom: 10px;
      right: 14px;
      font-size: 0.7rem;
      color: var(--text);
      font-weight: 600;
    }

    .progress-track {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--hover-overlay);
      border-radius: 0 0 20px 20px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 0 0 20px 20px;
      opacity: 0.8;
      transition: width 0.4s ease;
    }
  `
})
export class CategoryCardComponent {
  category = input.required<Category>();
  progress = input(0);

  tileStyles = computed(() => {
    const color = this.category().color;
    return `box-shadow: 0 4px 24px ${color}55, 0 1px 8px rgba(0,0,0,0.3)`;
  });
}
