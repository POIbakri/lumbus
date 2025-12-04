# Lumbus Design System

## Brand Colors

| Color | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Primary (Mint) | `#2EFECC` | `bg-primary` | CTAs, highlights, brand accent |
| Foreground (Black) | `#1A1A1A` | `bg-foreground` | Text, dark sections |
| Cyan | - | `bg-cyan` | Secondary accent |
| Yellow | - | `bg-yellow` | Warnings, highlights |
| Purple | - | `bg-purple` | Tertiary accent |
| Mint (Light) | - | `bg-mint` | Light backgrounds |

---

## SVG Icons

### Why SVGs Over Emojis
- **Consistent rendering** across all devices and browsers
- **Scalable** without quality loss
- **Customizable** colors via `currentColor`
- **Smaller bundle** than icon libraries
- **No emoji font issues** on different OS versions

### Icon Style Guide
We use **Heroicons** style (24x24 viewBox, stroke-based):

```tsx
<svg
  className="w-5 h-5"
  fill="none"
  viewBox="0 0 24 24"
  stroke="currentColor"
  strokeWidth={2}
>
  <path strokeLinecap="round" strokeLinejoin="round" d="..." />
</svg>
```

### Responsive Icon Sizes

| Context | Mobile | Desktop | Example |
|---------|--------|---------|---------|
| Inline with text | `w-4 h-4` | `w-5 h-5` | Badge icons |
| Card icons | `w-5 h-5` | `w-6 h-6` | Feature cards |
| Section icons | `w-6 h-6` | `w-8 h-8` | How it works steps |
| Hero icons | `w-8 h-8` | `w-10 h-10` | Large decorative |

### Common Icons Reference

#### Lightning Bolt (Instant/Fast)
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
</svg>
```

#### Globe (Worldwide/Countries)
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
</svg>
```

#### Phone/Device
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
</svg>
```

#### Bell (Notifications)
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
</svg>
```

#### Tag (Deals/Pricing)
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
</svg>
```

#### Checkmark
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
</svg>
```

#### Warning/Alert
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
</svg>
```

#### Shield/Security
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
</svg>
```

#### Credit Card
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
</svg>
```

#### Sparkles (Magic/Special)
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
</svg>
```

#### Question Mark (Help/FAQ)
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
</svg>
```

---

## Social Media Icons

Located in `components/social-media-links.tsx`:

### Twitter/X
```tsx
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
</svg>
```

### Instagram
```tsx
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
</svg>
```

### TikTok
```tsx
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
</svg>
```

---

## App Store Badges

Located in `components/app-store-badges.tsx`:

### Apple App Store
```tsx
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
</svg>
```

### Google Play (Colored)
```tsx
<svg viewBox="0 0 24 24" fill="none">
  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" fill="#00D2FF"/>
  <path d="M17.556 8.235L5.456.923A.997.997 0 0 0 4.51.91l9.283 9.283 3.763-1.958z" fill="#00F076"/>
  <path d="M17.556 15.765l-3.763-1.958L4.51 23.09c.303.14.647.14.946-.013l12.1-7.312z" fill="#FF3A44"/>
  <path d="M21.393 10.996L17.556 8.92l-3.763 3.079 3.763 3.08 3.837-2.078a1.001 1.001 0 0 0 0-2.005z" fill="#FFC107"/>
</svg>
```

---

## Button Styles

### Primary Button (Mint)
```tsx
<Button className="bg-primary text-foreground hover:bg-primary/90 font-black">
  ACTION
</Button>
```

### Secondary Button (White)
```tsx
<Button className="bg-white text-foreground hover:bg-white/90 font-black">
  ACTION
</Button>
```

### Dark Button
```tsx
<Button className="bg-foreground text-white hover:bg-foreground/90 font-black">
  ACTION
</Button>
```

### Responsive Button Sizing
```tsx
<Button className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6">
  RESPONSIVE BUTTON
</Button>
```

---

## Card Styles

### Standard Card
```tsx
<Card className="bg-white border-4 border-foreground shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Colored Card
```tsx
<Card className="bg-mint border-4 border-primary shadow-xl">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

---

## Typography

### Headings
- Use `font-black uppercase` for headings
- Responsive sizing: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`

### Body Text
- Use `font-bold` for body text
- Muted text: `opacity-70` or `text-gray-400`

---

## Responsive Breakpoints

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |

### Common Pattern
```tsx
className="text-sm sm:text-base md:text-lg"
className="px-4 sm:px-6 md:px-8"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
```

---

## Footer Design

### Logo on Dark Background
Wrap logo in white container:
```tsx
<div className="bg-white rounded-xl p-2 sm:p-3 inline-block">
  <Image src="/logo.jpg" ... />
</div>
```

### Social Icons with Hover
```tsx
<a className="w-10 h-10 bg-white/10 hover:bg-primary hover:text-foreground rounded-xl flex items-center justify-center transition-all">
  <IconComponent className="w-5 h-5" />
</a>
```

---

## Email Considerations

**Important:** SVG icons do NOT work in emails (Outlook doesn't support inline SVG).

For emails (`lib/email.ts`), either:
1. Keep using emojis
2. Use plain text
3. Use hosted image URLs

---

## File Locations

| Component | Path |
|-----------|------|
| Social Icons | `components/social-media-links.tsx` |
| App Store Badges | `components/app-store-badges.tsx` |
| Footer | `components/footer.tsx` |
| Payment Logos | `components/payment-logos.tsx` |
| Flag Icons | `components/flag-icon.tsx` |
| Colors Config | `app/globals.css` |

---

## Country & Regional Flags

### Why SVG Flags Over Emojis
- **Consistent rendering** across all platforms (iOS, Android, Windows, Linux)
- **No OS-specific variations** - emoji flags differ between Apple, Google, Windows
- **Some platforms don't support flag emojis** - Windows shows country codes instead
- **Scalable** - looks crisp at any size
- **Accessible** - better screen reader support

### FlagIcon Component

Located in `components/flag-icon.tsx`:

```tsx
import { FlagIcon } from '@/components/flag-icon';

// Country flags (ISO 3166-1 alpha-2 codes)
<FlagIcon countryCode="US" className="w-6 h-4" />
<FlagIcon countryCode="JP" className="w-6 h-4" />
<FlagIcon countryCode="GB" className="w-6 h-4" />

// Regional flags (custom SVGs)
<FlagIcon countryCode="EU" className="w-6 h-4" />
<FlagIcon countryCode="GLOBAL" className="w-6 h-4" />
<FlagIcon countryCode="ASIA" className="w-6 h-4" />
```

### Supported Regional Flags

| Code | Region | Description |
|------|--------|-------------|
| `GLOBAL` | Global | Globe/world icon |
| `EU`, `EU-30`, `EU-39`, `EUROPE` | Europe | EU blue flag with stars |
| `ASIA`, `ASIA-17`, `ASIA-20`, `SOUTHEAST-ASIA` | Asia | Red/gold stylized flag |
| `AFRICA`, `AFRICA-20`, `AFRICA-32` | Africa | Green/yellow/red stripes |
| `MIDDLE-EAST`, `MENA` | Middle East | Blue with star |
| `AMERICAS`, `NORTH-AMERICA` | North America | Blue/red stripes |
| `SOUTH-AMERICA`, `LATAM` | South America | Brazil-inspired |
| `CARIBBEAN` | Caribbean | Cyan with palm |
| `OCEANIA`, `PACIFIC` | Oceania/Pacific | Blue with stars |
| `CIS` | CIS/Central Asia | Purple with golden circle |
| `BALKANS` | Balkans | Blue/white/red stripes |
| `GULF`, `GCC` | Gulf States | UAE-inspired |

### Responsive Flag Sizes

| Context | Mobile | Tablet | Desktop | Example |
|---------|--------|--------|---------|---------|
| Inline badge | `w-4 h-3` | `w-5 h-4` | `w-6 h-4` | Plan badges |
| Card header | `w-10 h-7` | `w-12 h-8` | `w-14 h-10` | Plan cards |
| Hero/Featured | `w-14 h-10` | `w-20 h-14` | `w-24 h-16` | Destination hero |
| Country list | `w-4 h-3` | `w-5 h-4` | `w-6 h-4` | Multi-country list |

### Helper Function

```tsx
import { hasFlagIcon } from '@/components/flag-icon';

// Check if a flag exists before rendering
if (hasFlagIcon('US')) {
  // render flag
}
```

### Technical Details

- Uses `country-flag-icons` npm package for 200+ country flags
- Custom SVG implementations for regional/special flags
- Fallback to globe icon for unknown codes
- All flags have `rounded-sm` for slight corner rounding
