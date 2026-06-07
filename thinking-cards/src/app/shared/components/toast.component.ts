import { Component, inject , ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div class="toast" (click)="toastService.dismiss(toast.id)">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          @for (d of splitIcon(toast.icon); track $index) {
            <path [attr.d]="d" />
          }
        </svg>
        <div class="toast-text">
          <span class="toast-label">{{ toast.label }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 300;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      width: 90%;
      max-width: 340px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-card);
      border: 1px solid var(--accent);
      border-radius: 14px;
      padding: 14px 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      pointer-events: all;
      cursor: pointer;
      animation: toastIn 0.35s ease-out;
    }
    .toast-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      stroke: var(--accent);
    }
    .toast-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .toast-label {
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
    }
    .toast-message {
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(-16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  splitIcon(icon: string): string[] {
    return icon.split('|');
  }
}
