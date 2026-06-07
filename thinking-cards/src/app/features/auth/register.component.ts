import { Component, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page container">
      <div class="auth-card">
        <h2>Create Account</h2>
        <p class="subtitle">Join and start exploring thought-provoking questions</p>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <form (ngSubmit)="onRegister()">
          <input type="email" placeholder="Email" [(ngModel)]="email" name="email" required />
          <input type="password" placeholder="Password (min 6 chars)" [(ngModel)]="password" name="password" required />
          <button type="submit" class="btn-primary">Create Account</button>
        </form>

        <p class="switch">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: `
    .auth-page {
      display: flex;
      justify-content: center;
      padding-top: 48px;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-card);
      border-radius: var(--radius);
      padding: 40px 32px;
      box-shadow: var(--shadow);
      text-align: center;
    }
    h2 { margin-bottom: 4px; }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 24px;
    }
    .error {
      color: var(--accent);
      background: rgba(233,69,96,0.1);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    input {
      background: var(--bg);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 14px 16px;
      color: var(--text);
      font-size: 0.95rem;
      &::placeholder { color: var(--text-muted); }
      &:focus { border-color: var(--accent); }
    }
    .btn-primary {
      background: var(--accent);
      color: white;
      padding: 14px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1rem;
      transition: opacity 0.2s;
      &:hover { opacity: 0.9; }
    }
    .switch {
      margin-top: 20px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');

  onRegister() {
    this.auth.register(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => this.error.set(e.message),
    });
  }
}
