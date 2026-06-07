import { Component, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page container">
      <div class="auth-card">
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to access your thinking cards</p>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        @if (resetSent()) {
          <p class="success">Reset link sent! Check your email.</p>
        }

        @if (showReset()) {
          <form (ngSubmit)="onReset()">
            <input type="email" placeholder="Email" [(ngModel)]="email" name="email" required />
            <button type="submit" class="btn-primary">Send Reset Link</button>
          </form>
          <p class="switch">
            <a (click)="showReset.set(false)">Back to sign in</a>
          </p>
        } @else {
          <form (ngSubmit)="onLogin()">
            <input type="email" placeholder="Email" [(ngModel)]="email" name="email" required />
            <input type="password" placeholder="Password" [(ngModel)]="password" name="password" required />
            <button type="submit" class="btn-primary">Sign In</button>
          </form>

          <button class="btn-google" (click)="onGoogle()">Sign in with Google</button>

          <p class="forgot">
            <a (click)="showReset.set(true)">Forgot password?</a>
          </p>

          <p class="switch">
            Don't have an account? <a routerLink="/register">Register</a>
          </p>
        }
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
    h2 {
      margin-bottom: 4px;
    }
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
    .btn-google {
      width: 100%;
      margin-top: 12px;
      background: var(--bg-surface);
      color: var(--text);
      padding: 14px;
      border-radius: 10px;
      font-weight: 500;
      font-size: 0.95rem;
      transition: background 0.2s;
      &:hover { background: rgba(15,52,96,0.8); }
    }
    .forgot {
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--text-muted);
      a { cursor: pointer; }
    }
    .success {
      color: #4caf50;
      background: rgba(76,175,80,0.1);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
    .switch {
      margin-top: 20px;
      font-size: 0.85rem;
      color: var(--text-muted);
      a { cursor: pointer; }
    }
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  showReset = signal(false);
  resetSent = signal(false);

  onReset() {
    this.error.set('');
    this.resetSent.set(false);
    this.auth.sendPasswordReset(this.email).subscribe({
      next: () => this.resetSent.set(true),
      error: (e) => this.error.set(e.message),
    });
  }

  onLogin() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => this.error.set(e.message),
    });
  }

  onGoogle() {
    this.auth.loginWithGoogle().subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => this.error.set(e.message),
    });
  }
}
