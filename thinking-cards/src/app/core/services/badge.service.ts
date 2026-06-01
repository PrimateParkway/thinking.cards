import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { StreakService } from './streak.service';
import { ProgressService } from './progress.service';
import { FavoritesService } from './favorites.service';
import { CardService } from './card.service';
import { Card } from '../models/card.model';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface BadgeSection {
  title: string;
  badges: Badge[];
}

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private streakService = inject(StreakService);
  private progressService = inject(ProgressService);
  private favoritesService = inject(FavoritesService);
  private cardService = inject(CardService);

  private allCards = toSignal(this.cardService.getAllCards(), {
    initialValue: [] as Card[],
  });

  readonly badges = computed<BadgeSection[]>(() => {
    const streak = this.streakService.streak();
    const seenCount = this.progressService.seenIds().size;
    const cards = this.allCards();
    const totalCards = cards.length;
    const favCount = this.favoritesService.favoriteIds().size;
    const decksExplored = this.getDecksExplored(cards);
    const totalDecks = this.getTotalDecks(cards);
    const hasCompleteDeck = this.hasCompleteDeck(cards);

    return [
      {
        title: 'Streaks',
        badges: [
          { id: 'streak-3', name: 'Getting Started', description: '3-day streak', icon: 'M12 22c-4.97 0-9-2.69-9-6 0-2.48 1.51-4.26 3.21-5.88C8.52 8 10 6 10 3c0 0 2 2 2 5 1-1 2-3 2-5 3 3 5 6 5 10 0 3.31-4.03 6-9 6z', earned: streak.longest >= 3 },
          { id: 'streak-7', name: 'On a Roll', description: '7-day streak', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', earned: streak.longest >= 7 },
          { id: 'streak-14', name: 'Committed', description: '14-day streak', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', earned: streak.longest >= 14 },
          { id: 'streak-30', name: 'Philosopher', description: '30-day streak', icon: 'M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 21h6M12 17v4', earned: streak.longest >= 30 },
        ],
      },
      {
        title: 'Progress',
        badges: [
          { id: 'cards-1', name: 'First Card', description: 'View your first card', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0', earned: seenCount >= 1 },
          { id: 'cards-10', name: 'Curious Mind', description: 'View 10 cards', icon: 'M11 11m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0|M21 21l-4.35-4.35', earned: seenCount >= 10 },
          { id: 'cards-25', name: 'Deep Thinker', description: 'View 25 cards', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', earned: seenCount >= 25 },
          { id: 'cards-50', name: 'Scholar', description: 'View 50 cards', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20|M4 19.5V5a2 2 0 0 1 2-2h14v14H6.5A2.5 2.5 0 0 0 4 19.5z', earned: seenCount >= 50 },
          { id: 'cards-all', name: 'Completionist', description: 'View all cards (100%)', icon: 'M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 12 7s5-3 7.5-3a2.5 2.5 0 0 1 0 5H18|M12 7v13|M8 20h8', earned: totalCards > 0 && seenCount >= totalCards },
        ],
      },
      {
        title: 'Decks',
        badges: [
          { id: 'deck-first', name: 'Explorer', description: 'Explore your first deck', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', earned: decksExplored >= 1 },
          { id: 'deck-all', name: 'Well-Rounded', description: 'Explore all decks', icon: 'M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0|M2 12h20|M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z', earned: totalDecks > 0 && decksExplored >= totalDecks },
          { id: 'deck-complete', name: 'Deck Master', description: 'Complete an entire deck (100%)', icon: 'M2 4l3 12h14l3-12-5.5 6L12 2l-4.5 8L2 4z|M3 20h18', earned: hasCompleteDeck },
        ],
      },
      {
        title: 'Favorites',
        badges: [
          { id: 'fav-1', name: 'First Love', description: 'Favorite your first card', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', earned: favCount >= 1 },
          { id: 'fav-10', name: 'Collector', description: 'Favorite 10 cards', icon: 'M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14l-6-4.6h7.6L12 2z', earned: favCount >= 10 },
          { id: 'fav-25', name: 'Curator', description: 'Favorite 25 cards', icon: 'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5', earned: favCount >= 25 },
        ],
      },
    ];
  });

  readonly earnedCount = computed(() => {
    return this.badges().reduce(
      (sum, section) => sum + section.badges.filter((b) => b.earned).length,
      0
    );
  });

  readonly totalCount = computed(() => {
    return this.badges().reduce(
      (sum, section) => sum + section.badges.length,
      0
    );
  });

  private getDecksExplored(cards: Card[]): number {
    const seen = this.progressService.seenIds();
    const exploredCats = new Set<string>();
    for (const card of cards) {
      if (seen.has(card.id)) exploredCats.add(card.categoryId);
    }
    return exploredCats.size;
  }

  private getTotalDecks(cards: Card[]): number {
    const cats = new Set<string>();
    for (const card of cards) {
      cats.add(card.categoryId);
    }
    return cats.size;
  }

  private hasCompleteDeck(cards: Card[]): boolean {
    const progressMap = this.progressService.countByCategory(cards);
    for (const progress of progressMap.values()) {
      if (progress.total > 0 && progress.percent === 100) return true;
    }
    return false;
  }
}
