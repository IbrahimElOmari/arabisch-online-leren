# Taak 18: Usability & Accessibility Audit

**Status:** 🟡 In Progress (15%)  
**Prioriteit:** High  
**Geschatte Tijd:** 8-12 uur

## Doel

Uitvoeren van een uitgebreide usability en accessibility audit om te zorgen dat het Arabic Learning Platform toegankelijk en gebruiksvriendelijk is voor alle gebruikers, inclusief mensen met beperkingen.

## Scope

### 1. Accessibility Compliance

**Standaarden:**
- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **WAI-ARIA**: Accessible Rich Internet Applications
- **Section 508**: US federal accessibility requirements

**Tools:**
- axe DevTools (Chrome extension)
- WAVE (Web Accessibility Evaluation Tool)
- Lighthouse CI
- NVDA / JAWS screen readers

---

### 2. Accessibility Checklist

#### A. Perceivable

**1.1 Text Alternatives**
- [ ] All images have descriptive alt text
- [ ] Decorative images have alt=""
- [ ] Icon buttons have aria-label
- [ ] Complex images have long descriptions

```tsx
// ✅ Good
<img src="/logo.svg" alt="Arabisch Leren logo" />
<img src="/decorative-pattern.svg" alt="" role="presentation" />
<button aria-label="Close dialog"><X /></button>

// ❌ Bad
<img src="/logo.svg" />  // Missing alt
<button><X /></button>  // No label
```

**1.2 Time-based Media**
- [ ] Videos have captions
- [ ] Audio content has transcripts
- [ ] Auto-playing media can be paused

**1.3 Adaptable**
- [ ] Content structure is semantic (h1, h2, etc.)
- [ ] Reading order is logical
- [ ] Form inputs have labels
- [ ] Tables have proper headers

```tsx
// ✅ Semantic HTML
<article>
  <h2>Lesson Title</h2>
  <section>
    <h3>Section 1</h3>
    <p>Content...</p>
  </section>
</article>

// ❌ Non-semantic
<div class="title">Lesson Title</div>
<div class="section">
  <div class="subtitle">Section 1</div>
  <div>Content...</div>
</div>
```

**1.4 Distinguishable**
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] Color is not the only means of conveying information
- [ ] Text can be resized up to 200%
- [ ] No content is lost when zoomed

```css
/* ✅ Good contrast */
.text-primary {
  color: hsl(243 75% 59%);  /* #5b21b6 */
  background: white;        /* Contrast ratio: 7.5:1 */
}

/* ❌ Poor contrast */
.text-light {
  color: #ccc;
  background: white;        /* Contrast ratio: 1.6:1 - FAIL */
}
```

---

#### B. Operable

**2.1 Keyboard Accessible**
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Focus order is logical
- [ ] Skip navigation link provided
- [ ] Custom components have keyboard support

**Keyboard Navigation Testing:**
```
Tab         → Move to next focusable element
Shift+Tab   → Move to previous focusable element
Enter       → Activate buttons/links
Space       → Activate buttons, toggle checkboxes
Arrows      → Navigate within components (tabs, dropdowns)
Esc         → Close dialogs/modals
```

**2.2 Enough Time**
- [ ] Users can extend time limits
- [ ] Auto-updating content can be paused
- [ ] No time limits on test submissions (or generous limits)

**2.3 Seizures and Physical Reactions**
- [ ] No content flashes more than 3 times per second
- [ ] Animations can be disabled (prefers-reduced-motion)

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**2.4 Navigable**
- [ ] Page titles are descriptive
- [ ] Link purpose is clear from text
- [ ] Multiple ways to find pages (navigation, search, sitemap)
- [ ] Headings and labels are descriptive
- [ ] Focus indicator is visible

```tsx
// ✅ Descriptive links
<a href="/modules/arabic-alphabet">Learn the Arabic Alphabet</a>

// ❌ Ambiguous links
<a href="/modules/1">Click here</a>
```

---

#### C. Understandable

**3.1 Readable**
- [ ] Language of page is declared
- [ ] Language changes are indicated
- [ ] Complex words have definitions/glossary

```html
<html lang="nl">
  <head>
    <title>Arabisch Leren</title>
  </head>
  <body>
    <p>This is in Dutch</p>
    <p lang="ar">هذا بالعربية</p>
    <p lang="en">This is in English</p>
  </body>
</html>
```

**3.2 Predictable**
- [ ] Navigation is consistent across pages
- [ ] Components behave predictably
- [ ] Focus doesn't change unexpectedly
- [ ] Context changes are user-initiated

**3.3 Input Assistance**
- [ ] Error messages are clear and specific
- [ ] Labels and instructions provided
- [ ] Error prevention for critical actions
- [ ] Validation errors are announced to screen readers

```tsx
// ✅ Good error handling
<form onSubmit={handleSubmit}>
  <label htmlFor="email">Email *</label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-describedby="email-error"
  />
  {errors.email && (
    <p id="email-error" role="alert" className="text-red-500">
      {errors.email.message}
    </p>
  )}
</form>
```

---

#### D. Robust

**4.1 Compatible**
- [ ] HTML is valid
- [ ] ARIA roles used correctly
- [ ] Status messages announced to screen readers
- [ ] Works with assistive technologies

```tsx
// ✅ Proper ARIA usage
<div role="alert" aria-live="assertive">
  Payment successful!
</div>

<div role="status" aria-live="polite">
  Loading...
</div>

<nav aria-label="Main navigation">
  <ul>...</ul>
</nav>
```

---

### 3. Screen Reader Testing Scenarios

**Critical User Flows:**
1. **Registration & Login**
   - Create account
   - Verify email
   - Login
   - Password reset

2. **Course Navigation**
   - Browse modules
   - Enroll in course
   - View lesson content
   - Submit exercise

3. **Forum Interaction**
   - Read thread
   - Post reply
   - Like/dislike post

4. **Payment Flow**
   - Select pricing plan
   - Enter payment details
   - Confirm purchase

**Screen Reader Testing Checklist:**
```
[ ] All content is announced
[ ] Form fields have labels
[ ] Error messages are announced
[ ] Dynamic content updates are announced
[ ] Focus moves logically
[ ] Buttons/links purpose is clear
[ ] Images have descriptions
[ ] Tables are navigable
```

---

### 4. Usability Testing

**Test Scenarios:**

**Scenario 1: New Student Onboarding**
```
Goal: Complete registration and start first lesson within 5 minutes

Tasks:
1. Create account
2. Verify email
3. Browse available modules
4. Enroll in "Arabic Alphabet" module
5. Start first lesson
6. Complete one exercise

Success Metrics:
- Task completion rate: >90%
- Time on task: <5 minutes
- Error rate: <2 errors per user
- Satisfaction score: >4/5
```

**Scenario 2: Exercise Submission (Mobile)**
```
Goal: Complete and submit a listening exercise on mobile

Tasks:
1. Navigate to current lesson
2. Play audio
3. Answer multiple-choice questions
4. Submit answers
5. View feedback

Success Metrics:
- Task completion rate: >95%
- Audio playback works first time: >90%
- Can easily tap answer options: >95%
- Satisfaction score: >4/5
```

**Scenario 3: Forum Participation**
```
Goal: Find relevant thread and post a question

Tasks:
1. Navigate to forum
2. Search for topic ("grammar questions")
3. Read existing threads
4. Create new post
5. Add formatting (bold, list)
6. Upload image (optional)
7. Submit post

Success Metrics:
- Can find relevant threads: >80%
- Formatting tools are intuitive: >70%
- Post successfully submitted: >95%
```

---

### 5. Automated Testing Setup

**Jest + React Testing Library + jest-axe:**

```typescript
// tests/accessibility/LessonView.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LessonView from '@/pages/LessonView';

expect.extend(toHaveNoViolations);

describe('LessonView Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<LessonView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    const { getByRole } = render(<LessonView />);
    const h1 = getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('should have keyboard navigable controls', () => {
    const { getByRole } = render(<LessonView />);
    const nextButton = getByRole('button', { name: /next/i });
    nextButton.focus();
    expect(nextButton).toHaveFocus();
  });
});
```

**Playwright E2E Accessibility Tests:**

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused);
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    const animationDuration = await page.evaluate(() => {
      const el = document.querySelector('.animated-element');
      return getComputedStyle(el!).animationDuration;
    });
    
    expect(animationDuration).toBe('0.01ms');
  });
});
```

---

### 6. Accessibility Component Library

**File: `src/components/a11y/SkipNav.tsx`**
```tsx
export const SkipNav = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
    >
      Skip to main content
    </a>
  );
};
```

**File: `src/components/a11y/LiveRegion.tsx`**
```tsx
type LiveRegionProps = {
  message: string;
  type?: 'polite' | 'assertive';
};

export const LiveRegion = ({ message, type = 'polite' }: LiveRegionProps) => {
  return (
    <div
      role={type === 'assertive' ? 'alert' : 'status'}
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
```

**File: `src/components/a11y/FocusTrap.tsx`**
```tsx
import { useEffect, useRef } from 'react';

export const FocusTrap = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
};
```

---

## Implementatie Stappen

### Fase 1: Audit Tooling (2 uur)
- [ ] Install axe DevTools, WAVE
- [ ] Setup jest-axe for unit tests
- [ ] Setup @axe-core/playwright for E2E tests
- [ ] Configure Lighthouse CI

### Fase 2: Automated Testing (3 uur)
- [ ] Write accessibility unit tests for key components
- [ ] Write E2E accessibility tests for critical flows
- [ ] Add accessibility checks to CI/CD pipeline

### Fase 3: Manual Testing (4 uur)
- [ ] Screen reader testing (NVDA, JAWS)
- [ ] Keyboard-only navigation testing
- [ ] Color contrast audit
- [ ] Zoom/resize testing (up to 200%)

### Fase 4: Fixes & Documentation (3 uur)
- [ ] Fix identified accessibility issues
- [ ] Document accessibility features
- [ ] Create accessibility statement page
- [ ] Train team on accessibility best practices

---

## Acceptatie Criteria

- [ ] WCAG 2.1 Level AA compliance >95%
- [ ] All automated axe tests passing
- [ ] Zero critical accessibility violations
- [ ] Keyboard navigation works for all features
- [ ] Screen reader testing passed for critical flows
- [ ] Color contrast meets WCAG standards
- [ ] Accessibility statement published

---

## Deliverables

1. **Accessibility Audit Report**: Detailed findings and remediation plan
2. **Test Suite**: Automated accessibility tests
3. **Accessibility Statement**: Public-facing page
4. **Documentation**: Developer guidelines for maintaining accessibility

---

## Referenties

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Axe Accessibility Testing](https://www.deque.com/axe/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
