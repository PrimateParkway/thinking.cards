import { Component, inject , ChangeDetectionStrategy } from '@angular/core';
import { CelebrationService } from '../../core/services/celebration.service';

interface Particle {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

const COLORS = ['var(--accent)', '#00b894', '#fdcb6e', '#a29bfe', '#e17055'];

function buildParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.8 + Math.random() * 1.2,
      color: COLORS[i % COLORS.length],
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 6,
    });
  }
  return particles;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confetti',
  template: `
    @if (celebration.active()) {
      <div class="confetti-host">
        @for (p of particles; track $index) {
          <span
            class="particle"
            [style.left.%]="p.left"
            [style.animation-delay.s]="p.delay"
            [style.animation-duration.s]="p.duration"
            [style.background]="p.color"
            [style.transform]="'rotate(' + p.rotation + 'deg)'"
            [style.width.px]="p.size"
            [style.height.px]="p.size * 0.6"
          ></span>
        }
      </div>
    }
  `,
  styles: `
    .confetti-host {
      position: fixed;
      inset: 0;
      z-index: 500;
      pointer-events: none;
      overflow: hidden;
    }
    .particle {
      position: absolute;
      top: -12px;
      border-radius: 2px;
      animation: confettiFall linear forwards;
    }
    @keyframes confettiFall {
      0% {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translateY(100vh) rotate(720deg);
      }
    }
  `,
})
export class ConfettiComponent {
  celebration = inject(CelebrationService);
  readonly particles = buildParticles();
}
