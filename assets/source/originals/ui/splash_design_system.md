---
name: Yuletide Glamour
colors:
  surface: '#210e12'
  surface-dim: '#210e12'
  surface-bright: '#4b3337'
  surface-container-lowest: '#1b090d'
  surface-container-low: '#2a161a'
  surface-container: '#2f1a1e'
  surface-container-high: '#3a2428'
  surface-container-highest: '#462e33'
  on-surface: '#ffd9df'
  on-surface-variant: '#e3bebd'
  inverse-surface: '#ffd9df'
  inverse-on-surface: '#412a2e'
  outline: '#aa8989'
  outline-variant: '#5b4040'
  surface-tint: '#ffb3b4'
  primary: '#ffb3b4'
  on-primary: '#680016'
  primary-container: '#c41e3a'
  on-primary-container: '#ffdada'
  inverse-primary: '#ba1434'
  secondary: '#fff9ef'
  on-secondary: '#3a3000'
  secondary-container: '#ffdb3c'
  on-secondary-container: '#725f00'
  tertiary: '#b4cbce'
  on-tertiary: '#1f3436'
  tertiary-container: '#54696c'
  on-tertiary-container: '#d1e8eb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b4'
  on-primary-fixed: '#40000a'
  on-primary-fixed-variant: '#920023'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#d0e7ea'
  tertiary-fixed-dim: '#b4cbce'
  on-tertiary-fixed: '#091f21'
  on-tertiary-fixed-variant: '#364a4d'
  background: '#210e12'
  on-background: '#ffd9df'
  surface-variant: '#462e33'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Epilogue
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-lg:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
  title-md:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Outfit
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Outfit
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an opulent, celebratory casual gaming aesthetic tailored specifically for holiday slot splash displays and pre-game loading environments. The visual atmosphere balances the nostalgic warmth of fireside evenings with the cinematic polish of luxury casino gaming. 

The aesthetic is fundamentally **Tactile / Skeuomorphic** merged with **Glassmorphism and Volumetric Glows**. Elements feature physical dimension, beveled gold trims, enamel gloss, and soft ambient bioluminescence reminiscent of fairy lights. It evokes immediate delight, high-stakes anticipation, and festive indulgence without feeling childish or low-budget.

## Colors

The palette is anchored in the mood of a deep, midnight Christmas interior, illuminated only by crackling embers and twinkling lights:

- **Primary (`#C41E3A`)**: Festive Crimson Red, deepening into `#8B0000` (Burgundy Velvet) across radial gradients for primary buttons, banners, and velvet splash textures.
- **Secondary (`#FFD700`)**: Gleaming 24k Gold, supported by `#F5B041` (Warm Honey Amber) and `#FFA000` (Intense Core Gold) to construct metallic frames, beveled typography borders, and loading track progress indicators.
- **Tertiary (`#E0F7FA`)**: Icy Glint / Frosted Cyan, providing crystalline reflections, frost accents, sparkling stars, and particle effects against rich warm surfaces.
- **Neutral (`#1A080C`)**: Spiced Mahogany Black, providing high-contrast depth far richer than pure charcoal or black. Neutral surfaces range from deep cranberry-blacks to rich mulled-wine backdrops.

Gradients should favor high-luster linear transitions (e.g., gold sheen maps angling at 135 degrees) and soft radial bloom highlights behind focal elements.

## Typography

Typography balances bold, festive charm with high legibility. 

- **Display & Headlines (`Epilogue`)**: Weight 700 to 800. Carries sculpted presence suitable for game titles, celebratory banners, and jackpot teasers. In gaming splash contexts, headline characters frequently employ warm outer drop shadows with a subtle golden stroke or interior linear gradient fill.
- **Labels & Numbers (`Outfit`)**: Weight 600 to 800. Geometric, crisp, and high-impact for percentage counters, loading progress indicators, and critical button actions.
- **Body & Legal/Notices (`Plus Jakarta Sans`)**: Weight 400 to 500. Balanced and readable at compact sizes over dark crimson backdrops for regulatory marks, loading tips, and asset disclosures.

## Layout & Spacing

The layout model implements a centered **Fixed & Fluid Stage** optimized for dynamic viewport scaling across mobile portrait, landscape, and desktop casino shells.

- **Focal Framing**: A central canvas container retains a strict 16:9 (landscape) or 9:16 (portrait) stage envelope. Margins dynamically expand outside this zone, flooded with atmospheric vignette blends, ambient golden particles, and chimney soot darkness.
- **Rhythm**: Spacing values adhere to an 8px rhythmic foundation, with `space-md` (16px) serving as the baseline between interactive units and `space-xl` (40px) separating visual tiers (e.g., logo stage to character art to loading track).
- **Responsive Adaptations**:
  - **Desktop / Landscape**: Horizontally oriented; loading bar spans up to 480px centrally anchored at the bottom quadrant with 40px safe margin clearance.
  - **Mobile Portrait**: Stacks vertically; headline compresses, the loading container snaps to 88% width, and fairy lights border elements switch from horizontal swags to top-arch frames.

## Elevation & Depth

Visual hierarchy uses dense, multi-layered depth, blending physical gaming hardware cues with holiday atmosphere:

1. **Background Horizon**: Deep wine-red gradient canvas punctuated by blurred bokeh circles (`blur(32px)` to `blur(64px)`) representing distant warm holiday tree lights.
2. **Backdrop Panels (Frost Glass)**: Tinted dark burgundy glass (`rgba(26, 8, 12, 0.75)`) layered over a `backdrop-filter: blur(16px)` with a micro-thin 1px top border of frosted white (`rgba(224, 247, 250, 0.35)`).
3. **Beveled Metallic Frames**: 3D extruded golden rims composed of nested shadows: an inner crisp white reflection (`inset 0 1px 1px rgba(255, 255, 255, 0.8)`), a mid-tone amber edge (`#FFA000`), and an outer occlusion shadow (`0 8px 24px rgba(0, 0, 0, 0.6)`).
4. **Volumetric Luminescence (Fairy Lights & Embers)**: Elements that emit light carry dual-radius colored glows: an intense inner core (`0 0 8px #FFD700`) paired with a wide, soft dispersion envelope (`0 0 24px rgba(245, 176, 65, 0.4)`).

## Shapes

The design uses a pill-shaped curvature standard (Level 3). This soft, pebble-smooth curvature mimics polished holiday baubles, vintage arcade marquees, and candy wrappers.

- **Buttons & Primary Interactive Targets**: Fully pill-shaped (`rounded-full`) to invite touch and reinforce casual tactile appeal.
- **Cards, Dialogue Surrounds, & Loading Pods**: `rounded-xl` (32px to 48px) crowned with decorative filigree caps or candy-cane corner ribbons.
- **Glint Accents & Cutouts**: Diamond-star shapes (four-point icy sparkles) overlaying corners and apexes.

## Components

### 1. Festive Loading Bar
- **Track**: Pill-shaped sunken trench with a dark inset shadow (`inset 0 3px 6px rgba(0, 0, 0, 0.8)`), bordered by a 2px gilded frame (`#FFD700` gradient).
- **Fill**: Alternating diagonal candy-cane striping or high-gloss molten gold gradient with a subtle horizontal shimmer sweep animation. 
- **Leading Cap**: Crowned by an illuminated starburst or glowing bauble that pulses subtly in scale (1.0 to 1.1x) during progress updates.
- **Tip Typography**: Centered Outfit Bold label positioned directly below the track, displaying percentage complete and rotating seasonal trivia.

### 2. Primary Action Buttons ("Play Now", "Continue")
- **Base Layer**: High-convexity crimson gradient (`#C41E3A` to `#8B0000`).
- **Bevel**: 3px metallic edge in polished gold with an upper specular white highlight reflecting overhead fairy lights.
- **States**: 
  - *Rest*: Continuous subtle radial breath glow.
  - *Hover/Focus*: Elevation lift (-2px) accompanied by golden particle sparkles bursting outward.
  - *Pressed*: Physical displacement (+2px down), internal gold tone deepens, inner shadow activates.

### 3. Loading Badge / Doll Reveal Cards
- **Backing**: Semi-translucent dark mahogany framed in twisted gold ribbon or frosted icicle geometry.
- **Silhouette Pod**: Soft amber spotlight radiating from the bottom interior, silhouetting the collectible doll characters while game resources stream.
- **Frosting**: Subtle corner overlays of crystalline frost (`#E0F7FA`) with 20% opacity.

### 4. Interactive Chips & Audio/Quality Toggles
- **Structure**: Circular or pill-shaped glossy enamel tokens.
- **Active State**: Deep gold ring with an internal glowing emerald or ruby indicator lamp.
- **Passive State**: Translucent wine-glass surface with muted gold icon strokes.

### 5. Fairy Light Garland String (Header Accent)
- **Assembly**: Realistic curved line anchoring bulb nodes that oscillate in gentle phases between warm amber (`#FFA000`), winter white (`#FFFFFF`), and crimson (`#C41E3A`).
- **Bulb Render**: High-gloss bulb geometry displaying a central white filament spark wrapped in a diffuse colored glow footprint.