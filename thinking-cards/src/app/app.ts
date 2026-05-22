import { Component, inject, computed, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ChildrenOutletContexts } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { TopBarComponent } from './shared/components/top-bar.component';
import { BottomBarComponent } from './shared/components/bottom-bar.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { routeAnimation } from './shared/animations/route-animations';

const HIDDEN_BAR_PATTERNS = ['/login', '/register', '/admin', '/category/'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBarComponent, BottomBarComponent],
  animations: [routeAnimation],
  template: `
    @if (showBottomBar()) {
      <app-top-bar />
    }
    <main [class.has-bars]="showBottomBar()" [@routeAnimation]="getRouteAnimationData()">
      <router-outlet />
    </main>
    @if (showBottomBar()) {
      <app-bottom-bar />
    }
  `,
  styles: `
    main {
      min-height: 100vh;
      position: relative;
    }
    main.has-bars {
      padding-top: 52px;
      padding-bottom: 80px;
    }
  `
})
export class App {
  private contexts = inject(ChildrenOutletContexts);
  private auth = inject(AuthService);
  private _theme = inject(ThemeService);
  private router = inject(Router);
  private currentUrl = signal(this.router.url);

  private swUpdate = inject(SwUpdate);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((e) => e.type === 'VERSION_READY'))
        .subscribe(() => document.location.reload());
    }
  }

  showBottomBar = computed(() => {
    if (!this.auth.isLoggedIn()) return false;
    const url = this.currentUrl();
    return !HIDDEN_BAR_PATTERNS.some((p) => url.startsWith(p));
  });

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
