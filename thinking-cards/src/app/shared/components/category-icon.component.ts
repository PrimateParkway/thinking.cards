import { Component, computed, input , ChangeDetectionStrategy } from '@angular/core';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-category-icon',
  template: `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="icon-svg">
      @switch (key()) {
        @case ('socratic-sparks') {
          <!-- Question arc + spark lines -->
          <path d="M 17 17 C 17 11, 24 9, 28 12 C 32 15, 30 20, 24 22 L 24 26"
                stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="24" cy="33" r="2.5" fill="currentColor"/>
          <line x1="8" y1="10" x2="12" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
          <line x1="40" y1="10" x2="36" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
          <line x1="6" y1="26" x2="11" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
          <line x1="37" y1="26" x2="42" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
        }

        @case ('this-or-that') {
          <!-- Two overlapping circles -->
          <circle cx="18" cy="24" r="13" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <circle cx="30" cy="24" r="13" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.55"/>
        }

        @case ('moral-compass') {
          <!-- Compass: circle + needle -->
          <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <polygon points="24,8 27.5,22 24,26 20.5,22" fill="currentColor"/>
          <polygon points="24,40 27.5,26 24,22 20.5,26" fill="currentColor" opacity="0.3"/>
          <circle cx="24" cy="24" r="2" fill="currentColor"/>
        }

        @case ('mind-bogglers') {
          <!-- Two offset interlocking squares -->
          <rect x="9" y="9" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <rect x="21" y="21" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.5"/>
          <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.5"/>
        }

        @case ('know-thyself') {
          <!-- Concentric circles — looking inward -->
          <circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <circle cx="24" cy="24" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
          <circle cx="24" cy="24" r="3" fill="currentColor"/>
        }

        @case ('who-said-it') {
          <!-- Speech bubble with question mark -->
          <path d="M 10 10 C 10 7, 38 7, 38 10 L 38 26 C 38 29, 22 29, 20 29 L 14 36 L 16 29 C 12 29, 10 29, 10 26 Z"
                stroke="currentColor" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
          <text x="24" y="23" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor" font-family="Poppins, sans-serif">?</text>
        }

        @case ('cryptograms') {
          <!-- Lock/key cipher icon -->
          <rect x="14" y="22" width="20" height="16" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <path d="M18 22v-5a6 6 0 0 1 12 0v5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <circle cx="24" cy="30" r="2.5" fill="currentColor"/>
          <line x1="24" y1="32" x2="24" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        }

        @case ('nonograms') {
          <!-- Small grid with some cells filled -->
          <rect x="10" y="10" width="7" height="7" fill="currentColor"/>
          <rect x="17" y="10" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="24" y="10" width="7" height="7" fill="currentColor"/>
          <rect x="31" y="10" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="10" y="17" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="17" y="17" width="7" height="7" fill="currentColor"/>
          <rect x="24" y="17" width="7" height="7" fill="currentColor"/>
          <rect x="31" y="17" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="10" y="24" width="7" height="7" fill="currentColor"/>
          <rect x="17" y="24" width="7" height="7" fill="currentColor"/>
          <rect x="24" y="24" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="31" y="24" width="7" height="7" fill="currentColor"/>
          <rect x="10" y="31" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="17" y="31" width="7" height="7" fill="currentColor"/>
          <rect x="24" y="31" width="7" height="7" fill="currentColor" opacity="0.3"/>
          <rect x="31" y="31" width="7" height="7" fill="currentColor"/>
        }

        @case ('codebreakers') {
          <!-- Number lock / combination icon -->
          <rect x="10" y="14" width="28" height="24" rx="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <circle cx="19" cy="26" r="3.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="29" cy="26" r="3.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <line x1="19" y1="22.5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="29" y1="22.5" x2="29" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <text x="19" y="30" text-anchor="middle" font-size="5" font-weight="bold" fill="currentColor" font-family="Poppins, sans-serif">?</text>
          <text x="29" y="30" text-anchor="middle" font-size="5" font-weight="bold" fill="currentColor" font-family="Poppins, sans-serif">?</text>
          <path d="M16 14v-3a8 8 0 0 1 16 0v3" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        }

        @case ('logic-matrix') {
          <!-- 3x3 grid pattern -->
          <rect x="8" y="8" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="19" y="8" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="30" y="8" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="8" y="19" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="19" y="19" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
          <rect x="30" y="19" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="8" y="30" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="19" y="30" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <rect x="30" y="30" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
          <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <line x1="15" y1="11" x2="11" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <path d="M33 23 L35 25.5 L38 21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
        }

        @case ('knights-&-knaves') {
          <!-- Shield split in two: the truth-teller and the liar -->
          <path d="M24 6 L40 12 V25 C40 34 33 39.5 24 42.5 C15 39.5 8 34 8 25 V12 Z"
                stroke="currentColor" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
          <path d="M24 6 L24 42.5 C15 39.5 8 34 8 25 V12 Z" fill="currentColor" opacity="0.18"/>
          <line x1="24" y1="6" x2="24" y2="42.5" stroke="currentColor" stroke-width="2" opacity="0.55"/>
        }

        @case ('escape-rooms') {
          <!-- Door with a keyhole -->
          <rect x="12" y="6" width="24" height="36" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/>
          <circle cx="29" cy="23" r="2.4" fill="currentColor"/>
          <path d="M27.8 24.5 L27 30 L31 30 L30.2 24.5 Z" fill="currentColor"/>
        }

        @case ('favorites') {
          <!-- Heart icon -->
          <path d="M24 39.7l-2.1-1.9C12.3 29.2 6 23.5 6 16.5 6 10.7 10.7 6 16.5 6c3.2 0 6.3 1.5 8.3 3.9L24 9l-.8-.9C25.2 7.5 28.3 6 31.5 6 37.3 6 42 10.7 42 16.5c0 7-6.3 12.7-15.9 21.3L24 39.7z"
                fill="currentColor"/>
        }

        @default {
          @switch (generatedShape()) {
            @case (0) {
              <!-- Star burst — 6 radiating lines -->
              <line x1="32" y1="24" x2="41" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="28" y1="31" x2="32.5" y2="38.7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="20" y1="31" x2="15.5" y2="38.7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="16" y1="24" x2="7" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="20" y1="17" x2="15.5" y2="9.3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="28" y1="17" x2="32.5" y2="9.3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.6"/>
            }
            @case (1) {
              <!-- Diamond -->
              <polygon points="24,6 42,24 24,42 6,24" stroke="currentColor" stroke-width="2.5" fill="none"/>
              <polygon points="24,15 33,24 24,33 15,24" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
              <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
            }
            @case (2) {
              <!-- Hexagon -->
              <polygon points="24,6 41,15 41,33 24,42 7,33 7,15" stroke="currentColor" stroke-width="2.5" fill="none"/>
              <polygon points="24,14 34,19.5 34,28.5 24,34 14,28.5 14,19.5" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4"/>
              <circle cx="24" cy="24" r="3" fill="currentColor"/>
            }
            @case (3) {
              <!-- Nested triangles -->
              <polygon points="24,6 42,40 6,40" stroke="currentColor" stroke-width="2.5" fill="none"/>
              <polygon points="24,18 34,38 14,38" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
              <circle cx="24" cy="32" r="2.5" fill="currentColor"/>
            }
            @case (4) {
              <!-- Wave lines -->
              <path d="M6,16 Q15,10 24,16 T42,16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M6,24 Q15,18 24,24 T42,24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
              <path d="M6,32 Q15,26 24,32 T42,32" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.35"/>
            }
            @case (5) {
              <!-- Cross / plus -->
              <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
            }
          }
        }
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    .icon-svg { width: 100%; height: 100%; }
  `,
})
export class CategoryIconComponent {
  name = input('');

  key = computed(() =>
    this.name().toLowerCase().replace(/\s+/g, '-')
  );

  generatedShape = computed(() => hashCode(this.name()) % 6);
}
