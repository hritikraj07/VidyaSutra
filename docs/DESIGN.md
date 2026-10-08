# VidyaSutra — Design System & UI/UX Principles

## 1. UI/UX Principles
- **Clarity Over Clutter**: Academic workflows demand immediate legibility. Data density is balanced with clean cards and clear hierarchy.
- **Institutional Authority**: Colors reflect an elite, trustworthy academic institution (deep space navy, slate steel, warm platinum).
- **Zero Disruption Feedback**: Micro-animations via GSAP ensure fluid transitions without jarring layout shifts.

## 2. Color Palette & Tokens
VidyaSutra utilizes the official institutional palette:
- **Primary Indigo**: `#243B7A` — Main brand color, active headers, primary buttons, card border accents.
- **Deep Navy**: `#172554` — Page headings, modal titles, high-contrast typography, hero banners.
- **Sutra Saffron**: `#E7A23B` — Purposeful accent (5–10% proportion), highlights, alert stars, QR icons.
- **Ivory**: `#F8F7F3` — Canvas backgrounds, calm academic contrast.
- **Surface White**: `#FFFFFF` — Elevating cards, sheets, tables.
- **Slate**: `#64748B` — Subtitles, muted metrics, secondary metadata.
- **Ink**: `#172033` — Body text and readable table contents.

### Analytics Visual Tokens & Bands
- **Strong (80 – 100)**: `#15803D` (Forest Green, `#DCFCE7` soft tint)
- **Stable (60 – 79)**: `#1D4ED8` (Royal Blue, `#DBEAFE` soft tint)
- **Needs Attention (40 – 59)**: `#D97706` (Amber/Orange, `#FEF3C7` soft tint)
- **High Risk (0 – 39)**: `#DC2626` (Crimson, `#FEE2E2` soft tint)

```css
:root {
  --primary: #243B7A;
  --primary-dark: #172554;
  --accent: #E7A23B;
  --bg: #F8F7F3;
  --surface: #FFFFFF;
  --text-primary: #172033;
  --text-muted: #64748B;
  --border: #E2E8F0;
}
```

## 3. Typography
- **Primary Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- **Code / Monospace**: `Fira Code`, `ui-monospace`, `monospace` (used for Roll Numbers, Token hashes, Subject Codes).

## 4. Components & Hierarchy
- **Cards (`.vs-card`)**: 12px border-radius, subtle 1px border (`var(--border)`), smooth hover shadow.
- **Buttons**:
  - Primary: `var(--navy-800)` background with white text and 8px radius.
  - Secondary: `var(--surface)` with `var(--border)` outline.
  - Danger: `#FEF2F2` background with `#DC2626` text.
- **Badges**: Monospace subject codes with pill styling and soft translucent tint.

## 5. Responsive Behavior
- **Desktop (1024px+)**: Full multi-column dashboard with sticky navigation bar and desktop table views.
- **Tablet (768px - 1023px)**: 2-column grid adaptation, collapsible navigation.
- **Mobile (<768px)**: Single-column scroll with fixed ergonomic bottom navigation (`BottomNav.tsx`).
