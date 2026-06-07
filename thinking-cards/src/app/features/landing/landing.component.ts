import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from '../../shared/components/brand-logo.component';

interface Screenshot {
  src: string;
  alt: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-landing',
  imports: [RouterLink, BrandLogoComponent],
  template: `
    <div class="landing">
      <!-- Nav -->
      <nav class="nav">
        <div class="nav-inner">
          <div class="nav-brand">
            <app-brand-logo class="nav-logo" />
            <span class="nav-title">Thinking<span class="dot">.</span>Cards</span>
          </div>
          <div class="nav-links">
            <a routerLink="/login" class="nav-link">Sign In</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Get Started</a>
          </div>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <span class="hero-badge">Free &middot; No ads &middot; Open to everyone</span>
          <h1>Think deeper.<br/>Play smarter.</h1>
          <p class="subtitle">
            A deck of 50+ thought-provoking questions paired with logic puzzles,
            cryptograms, and nonograms — designed to stretch your thinking and
            sharpen your mind.
          </p>
          <div class="cta-group">
            <a routerLink="/register" class="btn btn-primary btn-lg">Create Free Account</a>
            <a routerLink="/login" class="btn btn-ghost">Already have an account?</a>
          </div>
        </div>
        <div class="hero-phone">
          <img src="assets/screenshots/home.png" alt="Thinking Cards home screen" />
        </div>
      </section>

      <!-- What it is -->
      <section class="section about">
        <div class="section-inner">
          <span class="section-label">What is Thinking.Cards?</span>
          <h2>Questions that stick with you</h2>
          <p class="section-body">
            Most apps want your attention. This one wants you to think.
            Each card poses an open-ended question drawn from philosophy, ethics,
            moral dilemmas, and self-discovery — no right answers, just deeper
            thinking. Come back daily or shuffle through the entire deck at your
            own pace.
          </p>
          <div class="about-grid">
            <div class="about-item">
              <span class="about-num">50+</span>
              <span class="about-label">Thought-provoking cards</span>
            </div>
            <div class="about-item">
              <span class="about-num">5</span>
              <span class="about-label">Category decks</span>
            </div>
            <div class="about-item">
              <span class="about-num">55+</span>
              <span class="about-label">Brain-teasing puzzles</span>
            </div>
            <div class="about-item">
              <span class="about-num">23</span>
              <span class="about-label">Badges to earn</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards section -->
      <section class="section cards-section alt-bg">
        <div class="section-inner split">
          <div class="split-text">
            <span class="section-label">The Cards</span>
            <h2>Five decks. Endless reflection.</h2>
            <ul class="deck-list">
              <li><strong>Socratic Sparks</strong> — Open-ended philosophical questions to spark reflection</li>
              <li><strong>This or That</strong> — Two contrasting viewpoints or moral stances</li>
              <li><strong>Mind Bogglers</strong> — Surprising facts and counterintuitive ideas</li>
              <li><strong>Moral Compass</strong> — Ethical dilemmas with no easy answer</li>
              <li><strong>Know Thyself</strong> — Personal questions for honest self-discovery</li>
            </ul>
          </div>
          <div class="split-phone">
            <img src="assets/screenshots/card.png" alt="A thinking card" />
          </div>
        </div>
      </section>

      <!-- Puzzles section -->
      <section class="section puzzles-section">
        <div class="section-inner split reverse">
          <div class="split-text">
            <span class="section-label">The Puzzles</span>
            <h2>Logic games that fight brain rot</h2>
            <p class="section-body">
              Between cards, challenge yourself with three types of puzzles — each
              with multiple difficulty levels and timed solving.
            </p>
            <div class="puzzle-types">
              <div class="puzzle-type">
                <svg class="puzzle-type-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <rect x="14" y="22" width="20" height="16" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
                  <path d="M18 22v-5a6 6 0 0 1 12 0v5" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                  <circle cx="24" cy="30" r="2.5" fill="currentColor"/>
                  <line x1="24" y1="32" x2="24" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <div>
                  <strong>Cryptograms</strong>
                  <span>Decode substitution ciphers to reveal famous quotes</span>
                </div>
              </div>
              <div class="puzzle-type">
                <svg class="puzzle-type-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
                </svg>
                <div>
                  <strong>Logic Matrices</strong>
                  <span>Deduce which items go together from clues</span>
                </div>
              </div>
              <div class="puzzle-type">
                <svg class="puzzle-type-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
                </svg>
                <div>
                  <strong>Nonograms</strong>
                  <span>Fill cells by number clues to reveal hidden pictures</span>
                </div>
              </div>
            </div>
          </div>
          <div class="split-phone">
            <img src="assets/screenshots/cryptogram.png" alt="Cryptogram puzzle" />
          </div>
        </div>
      </section>

      <!-- Screenshots carousel -->
      <section class="section showcase">
        <div class="section-inner">
          <span class="section-label">See it in action</span>
          <h2>Built for phones. Looks great everywhere.</h2>
          <div class="screenshot-scroll">
            @for (shot of screenshots; track shot.alt) {
              <div class="screenshot-frame">
                <img [src]="shot.src" [alt]="shot.alt" loading="lazy" />
                <span class="screenshot-label">{{ shot.alt }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Progress / gamification -->
      <section class="section progress-section alt-bg">
        <div class="section-inner split">
          <div class="split-text">
            <span class="section-label">Stay motivated</span>
            <h2>Track everything. Earn badges.</h2>
            <p class="section-body">
              Build daily streaks, track your best puzzle times, and unlock 23
              badges as you explore. Your profile shows exactly how far you've
              come — cards viewed, puzzles solved, quizzes completed.
            </p>
            <div class="badge-preview">
              <span class="badge-pill">First Card</span>
              <span class="badge-pill">Explorer</span>
              <span class="badge-pill">Curious Mind</span>
              <span class="badge-pill">On a Roll</span>
              <span class="badge-pill">Philosopher</span>
              <span class="badge-pill dim">+18 more</span>
            </div>
          </div>
          <div class="split-phone">
            <img src="assets/screenshots/badges.png" alt="Badges and progress" />
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="section final-cta">
        <div class="section-inner">
          <app-brand-logo class="final-logo" />
          <h2>Start thinking today</h2>
          <p class="section-body center">
            Free to use. No ads. No tracking. Just you and 50+ questions
            worth sitting with.
          </p>
          <a routerLink="/register" class="btn btn-primary btn-lg">Create Free Account</a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <span>Thinking.Cards</span>
        <span class="footer-sep">&middot;</span>
        <span class="footer-muted">A project built to make you think</span>
      </footer>
    </div>
  `,
  styles: `
    .landing {
      color: var(--text);
      overflow-x: hidden;
    }

    /* ---- Nav ---- */
    .nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: color-mix(in srgb, var(--bg) 80%, transparent);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--bar-border);
    }
    .nav-inner {
      max-width: 1000px;
      margin: 0 auto;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-logo {
      width: 28px;
      height: 28px;
      color: var(--accent);
    }
    .nav-title {
      font-weight: 700;
      font-size: 1.05rem;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .nav-link {
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      &:hover { color: var(--text); }
    }

    /* ---- Buttons ---- */
    .btn {
      display: inline-block;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: opacity 0.2s, transform 0.2s;
      text-align: center;
      &:hover { opacity: 0.9; transform: translateY(-1px); }
    }
    .btn-primary { background: var(--accent); color: white; }
    .btn-ghost {
      color: var(--text-muted);
      font-size: 0.9rem;
      padding: 12px 16px;
      &:hover { color: var(--text); }
    }
    .btn-sm { padding: 8px 20px; font-size: 0.85rem; }
    .btn-lg { padding: 16px 36px; font-size: 1.05rem; }

    /* ---- Sections ---- */
    .section {
      padding: 80px 24px;
    }
    .section-inner {
      max-width: 960px;
      margin: 0 auto;
    }
    .section-label {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent);
      margin-bottom: 12px;
    }
    .section h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.25;
    }
    .section-body {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.7;
      max-width: 560px;
    }
    .section-body.center {
      margin-inline: auto;
      text-align: center;
    }
    .alt-bg {
      background: var(--bg-card);
    }

    /* ---- Hero ---- */
    .hero {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 48px;
      padding: 100px 24px 60px;
      max-width: 1060px;
      margin: 0 auto;
      position: relative;
    }
    .hero::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: -1;
      background: linear-gradient(135deg, var(--bg), var(--bg-card), var(--bg), var(--bg-surface));
      background-size: 400% 400%;
      animation: gradientShift 18s ease infinite;
    }
    @keyframes gradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .hero-content {
      flex: 1;
      animation: fadeUp 0.8s ease-out;
    }
    .hero-badge {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 2.8rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.5px;
      margin-bottom: 16px;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 32px;
      max-width: 480px;
    }
    .cta-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .dot { color: var(--accent); }

    .hero-phone {
      flex: 0 0 260px;
      animation: fadeUp 0.8s ease-out 0.15s both;
    }
    .hero-phone img {
      width: 100%;
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.3);
    }

    /* ---- About stats ---- */
    .about-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 32px;
    }
    .about-item {
      text-align: center;
      padding: 20px 8px;
      background: var(--bg-card);
      border-radius: var(--radius);
    }
    .about-num {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent);
      line-height: 1;
      margin-bottom: 6px;
    }
    .about-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* ---- Split layout ---- */
    .split {
      display: flex;
      align-items: center;
      gap: 48px;
    }
    .split.reverse { flex-direction: row-reverse; }
    .split-text { flex: 1; }
    .split-phone {
      flex: 0 0 240px;
    }
    .split-phone img {
      width: 100%;
      border-radius: 20px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.25);
    }

    /* ---- Deck list ---- */
    .deck-list {
      list-style: none;
      padding: 0;
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .deck-list li {
      font-size: 0.92rem;
      color: var(--text-muted);
      line-height: 1.5;
      padding-left: 20px;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        opacity: 0.6;
      }
    }
    .deck-list li strong {
      color: var(--text);
    }

    /* ---- Puzzle types ---- */
    .puzzle-types {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }
    .puzzle-type {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .puzzle-type-icon {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--accent);
    }
    .puzzle-type strong {
      display: block;
      font-size: 0.95rem;
      margin-bottom: 2px;
    }
    .puzzle-type span {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* ---- Screenshots ---- */
    .showcase .section-inner {
      max-width: 1100px;
    }
    .showcase h2 {
      text-align: center;
    }
    .showcase .section-label {
      display: block;
      text-align: center;
    }
    .screenshot-scroll {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding: 8px 0 16px;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .screenshot-frame {
      flex: 0 0 220px;
      scroll-snap-align: center;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-card);
      box-shadow: var(--shadow);
    }
    .screenshot-frame img {
      width: 100%;
      display: block;
    }
    .screenshot-label {
      display: block;
      text-align: center;
      padding: 10px;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* ---- Badge preview ---- */
    .badge-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }
    .badge-pill {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      background: color-mix(in srgb, var(--accent) 15%, transparent);
      color: var(--accent);
    }
    .badge-pill.dim {
      background: var(--bg-surface);
      color: var(--text-muted);
    }

    /* ---- Final CTA ---- */
    .final-cta {
      text-align: center;
      padding: 100px 24px;
    }
    .final-logo {
      width: 48px;
      height: 48px;
      color: var(--accent);
      margin: 0 auto 16px;
    }
    .final-cta h2 {
      font-size: 2rem;
    }
    .final-cta .section-body {
      margin-bottom: 28px;
    }

    /* ---- Footer ---- */
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 0.8rem;
      color: var(--text-muted);
      border-top: 1px solid var(--bar-border);
    }
    .footer-sep { margin: 0 8px; }

    /* ---- Animations ---- */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ---- Responsive ---- */
    @media (max-width: 768px) {
      h1 { font-size: 2.1rem; }
      .hero {
        flex-direction: column;
        text-align: center;
        padding-top: 100px;
        gap: 32px;
      }
      .hero-phone { flex: 0 0 auto; max-width: 220px; }
      .subtitle { margin-inline: auto; }
      .cta-group { justify-content: center; }
      .split, .split.reverse {
        flex-direction: column;
        text-align: center;
      }
      .split-phone { flex: 0 0 auto; max-width: 220px; order: -1; }
      .section-body { margin-inline: auto; }
      .deck-list { text-align: left; }
      .puzzle-types { text-align: left; }
      .about-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .badge-preview { justify-content: center; }
      .section h2 { font-size: 1.5rem; }
      .about-item { background: var(--bg-surface); }
    }
  `,
})
export class LandingComponent {
  readonly screenshots: Screenshot[] = [
    { src: 'assets/screenshots/home.png', alt: 'Home' },
    { src: 'assets/screenshots/card.png', alt: 'Thinking Card' },
    { src: 'assets/screenshots/puzzles.png', alt: 'Puzzles' },
    { src: 'assets/screenshots/cryptogram.png', alt: 'Cryptogram' },
    { src: 'assets/screenshots/nonogram.png', alt: 'Nonogram' },
    { src: 'assets/screenshots/matrix.png', alt: 'Logic Matrix' },
    { src: 'assets/screenshots/quizzes.png', alt: 'Quizzes' },
    { src: 'assets/screenshots/badges.png', alt: 'Badges' },
  ];
}
