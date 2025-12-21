# Glassmorphism Design System

This document outlines the modern glassmorphism design patterns used in the Lumbus dashboard. Use this as a reference when updating other pages to maintain visual consistency.

---

## CSS Utility Classes

All utilities are defined in `/app/globals.css` under `@layer utilities`.

### Glass Backgrounds

| Class | Usage | Effect |
|-------|-------|--------|
| `.glass` | Default frosted glass | White 70% opacity + 12px blur |
| `.glass-mint` | Mint-tinted glass | Mint 75% opacity + 16px blur |
| `.glass-yellow` | Yellow-tinted glass | Yellow 75% opacity + 16px blur |
| `.glass-cyan` | Cyan-tinted glass | Cyan 70% opacity + 16px blur |
| `.glass-purple` | Purple-tinted glass | Purple 75% opacity + 16px blur |
| `.glass-dark` | Dark glass (buttons) | Dark 85% opacity + 16px blur |

### Shadows & Effects

| Class | Usage | Effect |
|-------|-------|--------|
| `.float-shadow` | Standard cards | Soft floating shadow |
| `.float-shadow-lg` | Large/important cards | Deeper floating shadow |
| `.glass-inner-glow` | Card depth | Subtle inner highlight |
| `.hover-lift` | Interactive cards | Lifts 4px on hover |

### Progress Bars

| Class | Usage |
|-------|-------|
| `.progress-bar-glass` | Progress bar background |
| `.progress-bar-fill` | Green gradient fill with glow |

### Background

| Class | Usage |
|-------|-------|
| `.dashboard-bg` | Page background with gradient mesh |

---

## Migration Patterns

### Cards

**Before (Old Style):**
```tsx
<Card className="bg-mint border-2 sm:border-4 border-primary shadow-xl">
```

**After (Glassmorphism):**
```tsx
<Card className="glass-mint border border-primary/30 float-shadow hover-lift rounded-2xl sm:rounded-3xl glass-inner-glow">
```

### Stat/Info Boxes

**Before:**
```tsx
<div className="bg-white/60 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
```

**After:**
```tsx
<div className="glass rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center glass-inner-glow">
```

### Buttons (Primary/Dark)

**Before:**
```tsx
<Button className="w-full bg-foreground hover:bg-foreground/90 text-white font-black py-3 sm:py-4 rounded-lg sm:rounded-xl">
```

**After:**
```tsx
<Button className="w-full glass-dark text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all float-shadow hover:scale-[1.02]">
```

### Buttons (Outline/Settings)

**Before:**
```tsx
<Button className="w-full btn-lumbus bg-white hover:bg-gray-50 font-black border-2 border-foreground">
```

**After:**
```tsx
<Button className="w-full glass font-black border border-foreground/20 rounded-xl hover-lift transition-all">
```

### Section Cards

**Before:**
```tsx
<Card className="bg-purple border-2 sm:border-4 border-accent shadow-xl rounded-2xl sm:rounded-3xl">
```

**After:**
```tsx
<Card className="glass-purple border border-accent/30 float-shadow-lg rounded-2xl sm:rounded-3xl">
```

### Progress Bars

**Before:**
```tsx
<div className="w-full bg-foreground/10 rounded-full h-2.5 overflow-hidden">
  <div className={`h-full rounded-full ${dataUsedPercentage < 50 ? 'bg-primary' : ...}`} />
</div>
```

**After:**
```tsx
<div className="w-full progress-bar-glass rounded-full h-3 overflow-hidden">
  <div className={`h-full rounded-full transition-all duration-500 ${
    dataUsedPercentage < 50 ? 'progress-bar-fill' :
    dataUsedPercentage < 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_12px_rgba(253,253,116,0.5)]' :
    'bg-gradient-to-r from-destructive to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
  }`} />
</div>
```

### Page Background

**Before:**
```tsx
<div className="min-h-screen bg-white">
```

**After:**
```tsx
<div className="min-h-screen dashboard-bg">
```

---

## Color Mapping

When migrating, use these border color mappings:

| Card Type | Glass Class | Border |
|-----------|-------------|--------|
| Mint/Active | `glass-mint` | `border-primary/30` |
| Yellow/Ready | `glass-yellow` | `border-secondary/30` |
| Cyan/Info | `glass-cyan` | `border-primary/30` |
| Purple/Settings | `glass-purple` | `border-accent/30` |
| White/Neutral | `glass` | `border-foreground/20` |

---

## Conditional Styling

When an element has conditional backgrounds (e.g., warning states), apply `glass-inner-glow` conditionally:

**Correct:**
```tsx
<div className={`${isWarning ? 'bg-destructive/20 backdrop-blur-sm' : 'glass glass-inner-glow'} rounded-xl`}>
```

**Incorrect:**
```tsx
<div className={`${isWarning ? 'bg-destructive/20' : 'glass'} glass-inner-glow`}>
```

---

## Mobile Considerations

- Glass effects use slightly less blur on mobile (10px vs 16px)
- `.hover-lift:active` scales down to 0.98 for touch feedback
- All effects respect `prefers-reduced-motion`

---

## Pages to Update

Use this guide to update the following pages:

- [ ] `/app/install/[orderId]/page.tsx` - eSIM installation page
- [ ] `/app/topup/[orderId]/page.tsx` - Data top-up page
- [ ] `/app/plans/page.tsx` - Plans listing
- [ ] `/app/destinations/page.tsx` - Destinations page
- [ ] `/app/checkout/page.tsx` - Checkout flow
- [ ] `/components/plan-card.tsx` - Plan card component
- [ ] `/components/data-wallet.tsx` - Data wallet component
- [ ] `/components/app-download-banner.tsx` - App download banner

---

## Brand Colors (Preserved)

| Color | Hex | CSS Variable |
|-------|-----|--------------|
| Primary (Mint) | `#2EFECC` | `--primary` |
| Secondary (Yellow) | `#FDFD74` | `--secondary` |
| Accent (Cyan) | `#87EFFF` | `--accent` |
| Purple | `#F7E2FB` | `--purple` |
| Mint Light | `#E0FEF7` | `--mint` |
| Foreground | `#1A1A1A` | `--foreground` |
| Destructive | `#EF4444` | `--destructive` |
