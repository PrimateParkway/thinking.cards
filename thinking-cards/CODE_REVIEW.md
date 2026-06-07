# Code Review — Thinking.Cards

**Date**: 2026-06-07
**Scope**: Full codebase (`src/app/**`, config files, Firestore rules, environments)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Medium | 10 |
| Low | 9 |
| **Total** | **23** |

Firestore security rules are well-written — admin writes are enforced server-side, user data is owner-scoped, and a catch-all deny exists. Firebase API keys are public-facing by design and are not a concern when rules are in place.

---

## High — All Fixed

### 1. ~~Timer leaks in all three puzzle components~~ FIXED (already had OnDestroy)
All three puzzle components already implement `OnDestroy` with `stopTimer()`.

### 2. ~~Memory leak — unsubscribed router subscription in BottomBarComponent~~ FIXED
Added `takeUntilDestroyed()` to the `router.events` subscription.

### 3. ~~Effect fires Firestore writes on every signal emission~~ FIXED
Added `lastSeenId` guard to prevent the effect from re-firing when the `dailyCard()` signal re-emits with the same card.

---

## Medium

### 4. Six files exceed the 300-line limit
**Category**: Code Quality

| File | Lines |
|------|-------|
| `cryptogram.component.ts` | 1,008 |
| `matrix.component.ts` | 952 |
| `nonogram.component.ts` | 737 |
| `landing.component.ts` | 663 |
| `quiz.component.ts` | 506 |
| `profile.component.ts` | 342 |

**Fix**: Extract cipher/puzzle generation into utility files. Move templates and styles to external `.html` / `.scss` files. Split game logic from display logic.

---

### 5. No `ChangeDetectionStrategy.OnPush` on any component
**Category**: Performance

All components use Angular's default change detection. Since the project already uses signals, adding OnPush is low-effort and high-impact.

**Fix**: Add `changeDetection: ChangeDetectionStrategy.OnPush` to every component.

---

### 6. Duplicated card-filtering logic across 3+ components
**Files**: `daily-card.component.ts`, `shuffle.component.ts`, `favorites.component.ts`
**Category**: Code Quality

Each component independently builds a `Set` of quiz/matrix category IDs and filters them out of `allCards()`. The same pattern is copy-pasted.

**Fix**: Add a `getStandardCards()` method to `CardService` and reuse it.

---

### 7. Duplicated category color/name lookup
**Files**: `daily-card.component.ts`, `shuffle.component.ts`, `favorites.component.ts`
**Category**: Code Quality

Each component has nearly identical `categoryColor()` and `categoryName()` computed signals that look up a category by `categoryId`.

**Fix**: Extract into a shared utility function or a `CardService` helper.

---

### 8. Fire-and-forget Firestore writes with no error handling
**Files**: `progress.service.ts`, `streak.service.ts`, `favorites.service.ts`, `user-state.service.ts`
**Category**: Bug / Error Handling

Multiple `setDoc()` and `deleteDoc()` calls have no `.catch()` handler. If the user is offline or the write is rejected, the failure is silently ignored.

**Fix**: Add `.catch()` handlers that surface errors via `ToastService`.

---

### 9. `getAllCards()` creates duplicate real-time listeners
**File**: `core/services/card.service.ts` (line ~37)
**Category**: Performance

`getAllCards()` returns a new `onSnapshot` observable on every call. It's injected in 8+ components, meaning 8+ active Firestore listeners on the same collection.

**Fix**: Cache with `shareReplay(1)` or use a single shared signal.

---

### 10. O(n^2) lookups in PuzzleStatsComponent template
**File**: `shared/components/puzzle-stats.component.ts`
**Category**: Performance

`isSolved()`, `isGaveUp()`, `isStarted()`, and `timeFor()` each call `findIndex()` per card, called from the template for every card in the grid.

**Fix**: Pre-compute a `Map<number, index>` in a computed signal.

---

### 11. No keyboard accessibility on interactive card tiles
**Files**: `shared/components/category-card.component.ts`, `features/home/home.component.ts`
**Category**: Accessibility

Category cards and the favorites tile are `<div>` elements with `(click)` handlers but no `role="button"`, `tabindex="0"`, or keyboard event handlers. Keyboard-only users can't navigate or activate them.

**Fix**: Use `<button>` elements, or add `role="button"` + `tabindex="0"` + `(keydown.enter)` / `(keydown.space)`.

---

### 12. Missing ARIA labels on icon-only buttons
**Files**: `shared/components/question-card.component.ts`, `shared/components/bottom-bar.component.ts`
**Category**: Accessibility

Share and favorite buttons have no `aria-label`. SVG icons in the bottom bar are not marked `aria-hidden="true"`.

**Fix**: Add `aria-label` to icon-only buttons. Add `aria-hidden="true"` to decorative SVGs.

---

### 13. `puzzleCards()` is a method called from the template, not a computed signal
**File**: `shared/components/puzzle-stats.component.ts`
**Category**: Angular Best Practices

`puzzleCards()` creates a new filtered array on every change detection cycle.

**Fix**: Convert to a `computed()` signal.

---

## Low

### 14. `@keyframes gradientShift` defined in 4 components
**Files**: `home.component.ts`, `quizzes.component.ts`, `puzzles.component.ts`, `landing.component.ts`
**Category**: Code Quality

Same keyframe animation copy-pasted due to view encapsulation.

**Fix**: Move to `styles.scss` as a global animation or a shared mixin.

---

### 15. Hardcoded fallback color `#e94560` in multiple components
**Files**: `daily-card.component.ts`, `shuffle.component.ts`
**Category**: Code Quality

**Fix**: Define a shared constant `DEFAULT_ACCENT`.

---

### 16. Google sign-in button hover uses hardcoded dark-theme color
**File**: `features/auth/login.component.ts` (line ~116)
**Category**: Theme Support

`background: rgba(15,52,96,0.8)` won't look right on light themes.

**Fix**: Use `var(--hover-overlay)` instead.

---

### 17. Password stored in component property until GC
**Files**: `login.component.ts`, `register.component.ts`
**Category**: Security (minor)

The password string persists in memory as a class property after login.

**Fix**: Set `this.password = ''` after successful auth.

---

### 18. Quiz options track by `$index` instead of value
**File**: `features/quiz/quiz.component.ts`
**Category**: Performance (minor)

Options are shuffled, so tracking by index recreates all option DOM nodes.

**Fix**: Use `track opt` instead of `track $index`.

---

### 19. ThemeService injected but unused in App component
**File**: `app.ts` (line 70)
**Category**: Code Quality

Injected as `private _theme` solely for its constructor side effect.

**Fix**: Add a comment explaining the intentional side-effect injection.

---

### 20. Wildcard route double-redirects for unauthenticated users
**File**: `app.routes.ts` (line 161)
**Category**: Minor inefficiency

`** → /` then auth guard redirects `/` → `/landing`. Two redirects.

**Fix**: Acceptable as-is, or change wildcard to redirect to `/landing`.

---

### 21. `cardState`, `quizState`, `matrixState`, `cryptogramState`, `nonogramState` rules allow unrestricted writes
**File**: `firebase/firestore.rules`
**Category**: Security (minor)

These subcollections use `allow read, write: if isOwner(userId)` with no field validation. An authenticated user could write arbitrary data to their own state documents.

**Fix**: Add `hasOnly()` field restrictions matching the expected schema. Low risk since users can only write to their own data.

---

### 22. No `font-display: swap` guarantee for self-hosted scenario
**File**: `styles.scss` (line 1)
**Category**: Performance (minor)

Google Fonts URL already includes `display=swap`, but loading two font families (Inter + Poppins) with multiple weights adds to initial load.

**Fix**: Consider reducing font weight variants or self-hosting.

---

## Already Handled (Non-Issues)

- **Firebase API keys in environment files**: These are public-facing project identifiers, not secrets. Firestore rules enforce authorization server-side.
- **Admin guard is client-side only**: Firestore rules independently enforce `admin == true` for all category/card writes. The client guard is UX-only.
- **Categories collection readable by all**: Intentional — categories are public metadata needed for the landing page and unauthenticated browsing.
