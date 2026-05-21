import { Injectable, inject, computed } from '@angular/core';
import { ProgressService } from './progress.service';

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
}

export function computeStreak(dates: Date[]): StreakInfo {
  if (dates.length === 0) {
    return { current: 0, longest: 0, activeToday: false };
  }

  const dayKeys = new Set(dates.map((d) => toDateKey(d)));
  const sorted = [...dayKeys].sort();

  const today = toDateKey(new Date());
  const activeToday = dayKeys.has(today);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  let current = 0;
  let checkKey = activeToday ? today : yesterday(today);
  while (dayKeys.has(checkKey)) {
    current++;
    checkKey = yesterday(checkKey);
  }

  return { current, longest, activeToday };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterday(key: string): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

function isConsecutive(a: string, b: string): boolean {
  const next = new Date(a + 'T00:00:00');
  next.setDate(next.getDate() + 1);
  return toDateKey(next) === b;
}

@Injectable({ providedIn: 'root' })
export class StreakService {
  private progress = inject(ProgressService);

  readonly streak = computed(() => computeStreak(this.progress.seenDates()));
}
