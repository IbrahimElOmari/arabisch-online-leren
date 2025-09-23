# Design System Style Guide

## Overview

This style guide defines the design principles, component patterns, and responsive behavior for the Arabisch Online Leren application.

## Design Principles

### 1. Mobile-First Responsive Design
- Start with mobile layouts (320px+)
- Use container queries for component-level responsiveness
- Progressive enhancement for larger screens
- Touch-friendly interactions

### 2. RTL (Right-to-Left) Support
- Use logical properties (ms-*, me-*, ps-*, pe-*)
- Text alignment adapts to language direction
- Icons and interactions mirror appropriately
- Arabic typography for Arabic content

### 3. Semantic Design Tokens
- Use HSL color system from index.css
- Consistent spacing scale
- Typography hierarchy
- Dark/light mode support

## Breakpoints

```css
/* Container Query Breakpoints */
@sm: 24rem (384px)
@md: 32rem (512px)
@lg: 48rem (768px)
@xl: 64rem (1024px)

/* Viewport Breakpoints */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

## Typography

### Headings
- `text-xl @md:text-2xl` - Page titles
- `text-lg @md:text-xl` - Section headers
- `text-base @md:text-lg` - Card titles
- `text-sm @md:text-base` - Body text

### Arabic Text
- `arabic-text` class for Arabic content
- `font-amiri` for display text
- `font-noto-arabic` for body text
- Right-aligned by default in RTL mode

## Components

### Cards

#### Basic Card
```tsx
<Card className="@container">
  <CardHeader className="p-4 @md:p-6">
    <CardTitle className="text-lg @md:text-xl">Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3 @md:space-y-4">
    Content
  </CardContent>
</Card>
```

#### Responsive Card Variants
- **Compact**: `min-h-[120px]` - For dashboard widgets
- **Default**: `min-h-[200px]` - Standard cards
- **Fluid**: `h-full` - Full height containers

### Grids

#### Auto-Responsive Grid
```tsx
<div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4 @md:gap-6">
  {/* Grid items */}
</div>
```

#### Dashboard Grid
```tsx
<div className="@container">
  <ResponsiveGrid 
    cols={{ default: 1, md: 2, lg: 3 }}
    gap="md" 
    container={true}
  >
    {/* Grid content */}
  </ResponsiveGrid>
</div>
```

### Forms

#### Form Fields
```tsx
<ResponsiveFormField
  label="Field Label"
  name="fieldName"
  type="text"
  placeholder="Enter text..."
  required
  icon={IconComponent}
/>
```

#### Form Layouts
- **Single**: `max-w-md mx-auto` - Login, simple forms
- **Double**: `grid-cols-1 @md:grid-cols-2` - Profile forms
- **Auto**: `grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3` - Complex forms

### Buttons

#### Size Variants
- **Touch**: `min-h-[44px]` - Mobile-optimized
- **Small**: `text-xs @md:text-sm` - Compact buttons
- **Default**: `text-sm @md:text-base` - Standard buttons

### Navigation

#### Tab Navigation
```tsx
<TabsList className="grid grid-cols-3 @md:grid-cols-5 min-w-max">
  <TabsTrigger className="text-xs @md:text-sm">
    <Icon className="h-3 w-3 @md:h-4 @md:w-4" />
    <span className="hidden @sm:inline">Full Label</span>
    <span className="@sm:hidden">Short</span>
  </TabsTrigger>
</TabsList>
```

## RTL Support Guidelines

### Text Direction
```tsx
const { isRTL, getTextAlign } = useRTLLayout();

<div className={cn(
  getTextAlign('left'),
  isRTL ? 'arabic-text' : ''
)}>
```

### Spacing and Layout
```tsx
// Use logical properties
className={cn(
  'ms-4',      // margin-start
  'me-2',      // margin-end
  'ps-6',      // padding-start
  'pe-4'       // padding-end
)}
```

### Icon Mirroring
```tsx
<Icon className={cn(
  'h-4 w-4',
  isRTL && shouldFlip ? 'scale-x-[-1]' : ''
)} />
```

## Dark Mode

### Color Usage
```tsx
// Background colors
bg-background          // Main background
bg-card               // Card backgrounds
bg-muted              // Subtle backgrounds

// Text colors
text-foreground       // Primary text
text-muted-foreground // Secondary text
text-primary          // Accent text

// Border colors
border-border         // Default borders
border-primary        // Accent borders
```

### Testing Dark Mode
- Test all components in both light and dark modes
- Ensure minimum contrast ratios (WCAG AA)
- Check hover and focus states

## Accessibility

### Focus Management
- All interactive elements have visible focus rings
- Tab order follows logical flow
- Skip links for keyboard users

### Screen Reader Support
```tsx
<button
  aria-label="Clear search"
  aria-describedby="search-help"
>
  <Icon aria-hidden="true" />
</button>
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .animate-* {
    animation: none;
  }
}
```

## Performance

### Container Queries
- Use `@container` on parent elements
- Prefer container queries over viewport queries for components
- Enable with `@tailwindcss/container-queries` plugin

### Image Optimization
```tsx
<img 
  className="max-w-full h-auto" 
  loading="lazy"
  alt="Descriptive text"
/>
```

### Bundle Optimization
- Lazy load non-critical components
- Use dynamic imports for large components
- Optimize images and fonts

## Testing Guidelines

### Responsive Testing
- Test on mobile (375px), tablet (768px), desktop (1024px+)
- Verify container query behavior
- Check horizontal scrolling

### RTL Testing
- Switch to Arabic language
- Verify text alignment and direction
- Check icon and layout mirroring

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus indicator visibility

## Common Patterns

### Dashboard Layout
```tsx
<div className="min-h-screen bg-background">
  <div className="@container container mx-auto p-4 sm:p-6">
    <div className="mb-6 @md:mb-8">
      <h1 className="text-2xl @md:text-3xl font-bold">Title</h1>
    </div>
    <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4 @md:gap-6">
      {/* Dashboard content */}
    </div>
  </div>
</div>
```

### Modal Layout
```tsx
<Dialog>
  <DialogContent className="w-full max-w-md @md:max-w-lg @lg:max-w-xl">
    <DialogHeader className="text-center @md:text-left">
      <DialogTitle className="text-lg @md:text-xl">Title</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 @md:space-y-6">
      {/* Modal content */}
    </div>
  </DialogContent>
</Dialog>
```

### Loading States
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-muted rounded w-1/2"></div>
</div>
```

This style guide should be updated as the design system evolves and new patterns emerge.