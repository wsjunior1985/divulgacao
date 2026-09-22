---
name: Divulgação Card System
description: Automated app promotion cards with real brand identity per app
colors:
  brand-primary: "{app.marca.destaque}"
  brand-base: "{app.marca.fundoA}"
  background-top: "{paleta.fundoTopo}"
  background-base: "{paleta.fundoBase}"
  text-primary: "#ffffff"
  text-support: "{paleta.apoio}"
  divider: "{paleta.linha}"
  card-bg: "{paleta.cartao}"
  seal-color: "{paleta.selo}"
  accent-1: "#6366f1"
  accent-2: "#0ea5e9"
  accent-3: "#22c55e"
  accent-4: "#f59e0b"
  accent-5: "#ec4899"
typography:
  display:
    fontFamily: "Sora, Manrope, Fraunces, Space Grotesk, Plus Jakarta Sans, Inter Display (per app)"
    fontSize: "56px–288px (clamp; auto-fit to content)"
    fontWeight: "700–800"
    lineHeight: "1.0–1.12"
    letterSpacing: "-0.6px to -8px"
  body:
    fontFamily: "Inter"
    fontSize: "20px–42px"
    fontWeight: "500–600"
    lineHeight: "1.3–1.34"
    letterSpacing: "0"
  label:
    fontFamily: "Inter"
    fontSize: "20px–26px"
    fontWeight: "600"
    lineHeight: "1.1"
    letterSpacing: "0.6px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "17px"
  xl: "26px"
  xxl: "30px"
spacing:
  sm: "8px"
  md: "14px"
  lg: "24px"
  xl: "30px"
  xxl: "76px"
  margin: "64px–112px (per card size)"
components:
  chip:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.text-support}"
    rounded: "{rounded.lg}"
    padding: "12px 22px"
  card-footer:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xxl}"
    padding: "24px 40px"
  phone-body:
    backgroundColor: "#1a1a20"
  phone-screen:
    backgroundColor: "#000000"
---

# Design System: Divulgação Card Generator

## Overview

**Creative North Star: "The Living Brand Museum"**

This is not a template system — it's a fidelity engine. Each card holds the real brand identity of its app: the official logo (not a monogram), the precise palette extracted from the app's own CSS (converted from OKLCH to hex to guarantee pixel-identical rendering on GitHub's runner and the designer's Mac), and a distinctive font per app so no two cards in the rotation look the same. The card speaks the app's visual voice at full volume, with no beige compromises. Depth is conveyed through layered gradients, phone mockups rendered in grayscale metal with glossy overlays, and a radial vignette that anchors the composition. Every card is rendered to JPEG just-in-time — identical on every platform, every run.

**Key Characteristics:**
- Authentic brand per app (no normalization across products)
- Deterministic, computed color palette from app source
- One display font per app; identity shifts naturally across the rotation
- Sophisticated depth via gradients and phone mockups, not flat tiles
- Responsive typography that scales and breaks to content, not fixed grids
- Real app screenshots (updated weekly) embedded inside metal phone frames

## Colors

The palette is derived algorithmically from each app's brand colors, eliminating hand-picked approximations. The system reads `marca.destaque` (accent) and `marca.fundoA` (base) from `apps/<id>.json` — both in OKLCH format (e.g., `"oklch(55% 0.24 140)"`) — converts to sRGB hex via the color math in `lib/cor.js`, then derives all secondary tones through mixing and darkening functions. Every color on the card is computed; none is eyeballed.

### Primary (Brand Accent)
- **Brand Primary** (dynamic per app, e.g. `#38d080` for GASONOL): The app's declared highlight color. Used on the headline marker, the footer stripe, chip backgrounds, and resource item circles. Pulled to 35% toward each accent tone to keep resource list items readable.

### Secondary (Derived Tones)
- **Background Top** (derived; e.g. `#0c2f1a`): A subtle mix of the base and accent (14% accent blend), faded and darkened slightly. Forms the top of the card gradient.
- **Background Base** (derived; e.g. `#050a08`): Deep base color, darkened to anchor the bottom of the gradient. Visible only briefly at the card's lower third.
- **Seal Color** (derived; auto-darkened if white contrast < 4.5): The badge background. Starts as the brand color, darkens until white text reaches WCAG AA contrast.

### Tertiary (Accents & Support)
- **Text Support** (derived; e.g. `#7fa392`): A 55% blend of brand + white, then lightened. Used for subtitles, chip labels, and description text. Breathes against the dark backgrounds.
- **Divider** (derived; e.g. `#1a3d28`): A 14% blend of the brand into the background top; used for chip borders and subtle visual separation.
- **Card Background** (derived; e.g. `#0b1811`): A 6% blend of brand into background top; used for the footer and standalone card containers. Reads as almost-black with the thinnest touch of app color.

### Neutral & Utility
- **Text Primary**: `#ffffff`. Every headline, every CTA, maximum contrast on dark backgrounds. No exception.
- **Text Seal**: Computed per seal color (white if contrast sufficient; else `#0b0b0f`, the canonical dark text).

### Resource Accent Ramp
Five accent colors (indigo, cyan, green, amber, pink) sit at the base of the ramp. Each is pulled 35% toward the brand primary, giving the four resource items in the vitrine layout a distinct hue while staying recognizably unified. The pull-toward-brand ensures resources never visually outshout the app's own accent.

**The Algorithmic Palette Rule.** Every color is computed, never guessed. The system reads the source OKLCH from `index.css`, converts to hex with LMS/gamma correction, and derives every secondary tone through mixing and darkening functions. This guarantees the card rendered on the GitHub runner looks identical to a preview on a designer's Mac.

## Typography

**Display Font:** One of six families (Sora, Manrope, Fraunces, Space Grotesk, Plus Jakarta Sans, Inter Display), selected per app in `apps/<id>.json`. Every font is embedded in OFL-licensed `.ttf` files in `assets/fontes/` so the card is byte-for-byte identical regardless of the rendering machine's installed fonts.

**Body Font:** Inter (Medium for body text, ExtraBold for the display in one-app layout fallbacks). Inter is open-source and paired with every display font without compromise.

**Character:** Authoritative and energetic. Display fonts are heavyweight (700–800, ExtraBold), pushing into the larger half of the layout. Letter-spacing is negative (−0.6px to −8px) to compensate for the airy letterforms of modern families — tight enough to read but not cramped. Body is measured, professional, and always legible on dark backgrounds.

### Hierarchy
- **Display** (800, 56px–288px clamp, line-height 1.0–1.1): Headline of the card. Scales down if it doesn't fit 4 lines within the allotted width. Letter-spacing is negative per font to maintain compact spacing without loss of form. Used only in the primary headline.
- **Headline** (700, 60px–96px, line-height 1.12): Large callout in the hero and vitrine layouts. Allows up to 3 lines; shrinks if more are needed.
- **Title** (700, 42px–68px, line-height 1.12): Medium emphasis for layout headings in resource or stat layouts.
- **Body** (500–600, 28px–42px, line-height 1.24–1.34): Description text for each resource item. Single or double line per item.
- **Support** (500, 22px–34px, line-height 1.3): Subtitles, secondary text, resource descriptions. Slightly lighter weight and contrast.
- **Label** (600, 20px–26px, line-height 1.1, letter-spacing 0.6px): Chip badges, seal text, and upper-case callouts.

### Named Rules
**The Real Font Rule.** Every display font is embedded by filename and family name. The family name matches what the resvg renderer sees in the TTF's name table (e.g., "Inter Display" with a space, not "InterDisplay"). A mismatch causes the font to fall back silently to Inter, changing the card's entire personality. Verify the family name in the font file before adding to `DISPLAYS` in `scripts/lib/cards.js`.

**The No-Estimate Rule.** Text width is measured via `opentype.js` against the actual TTF file, character by character, advancing width included. Letter-spacing is folded into the width calculation. This prevents word-wrapping errors that would cause titles to spill beyond the card margin or orphan words.

## Layout

Cards render to three formats: feed (1080×1350, portrait), vertical (1080×1920, for TikTok), and square (1080×1080). All formats share margins (64–112px depending on size) and the same layout engine; the content grows or shrinks into the available height.

### Layout Patterns

Five patterns exist; the system chooses automatically based on available content (capture, resources, stat number). When content is missing, the system degrades gracefully:

1. **Vitrine (Showcase, Default)**
   - **When**: Capture + resources exist, `layout` ≠ "classico"
   - **Structure**: Logo + app name (top), headline with brand-colored keyword, 4 resource items (icon + title/desc), 1–2 phone mockups (stacked/rotated per arrangement), footer (domain + seals)
   - **Typography**: Display (62–78px, shrinks to fit), body 27px (subtitle), 26px/25px (resource title/desc)
   - **Height**: Fully responsive; content grows up from footer, whitespace pools at top
   - **Arrangements**: Slot determines phone stack (two phones side-by-side with rotation, or one large centered) via `ARRANJOS[]` array

2. **Hero (Two-Column)**
   - **When**: Capture exists, `layout` ≠ "vitrine"
   - **Structure**: Headline + subtitle + optional stat on left column; real phone mockup (right/left alternates by slot)
   - **Typography**: Display 60px (shrinks 38–60), body 30px (subtitle), 72px stat if present
   - **Column split**: 54% text / 46% phone, gap 5% of width
   - **Phone behavior**: Scales to fit 96% of available height, centered in region

3. **Manchete (Headline Only)**
   - **When**: No capture, no resources layout
   - **Structure**: Large headline (top), subtitle, 3 chips (bottom)
   - **Typography**: Display 96px–108px (shrinks to 56px), subtitle 40% of display size
   - **Heading rule**: Underline (88px × 7px, brand primary) between headline and subtitle
   - **Spacing**: Chips positioned 30px above footer

4. **Recursos (Feature List)**
   - **When**: No capture, resources layout specified
   - **Structure**: Headline (top), 4 resource items (icon + desc, no titles)
   - **Typography**: Display 60px–68px, resource text 37px (max 2 lines)
   - **Fallback**: Used when capture fails but resources exist; full-height list

5. **Destaque (Stat Focus)**
   - **When**: `destaque` field exists, no capture
   - **Structure**: Large statistic number (top), headline, subtitle
   - **Typography**: Display 288px stat (shrinks to fit), headline 68px–42px, subtitle 34px
   - **Stat underline**: 88px × 7px accent bar below the number
   - **Use case**: Emphasizes a quantitative claim ("3,38%", "8/8h")

All layouts:
- Grow upward from the footer. Whitespace naturally pools at the top, where gradients are strongest.
- Use a deterministic grid of baselines, not flexbox or absolute pixel positions. Each line's vertical position is calculated from content height, ensuring perfect pixel alignment across platform renders.
- Adapt font size down if content doesn't fit (title shrinks 4px at a time until it does).
- Flow text word-by-word, breaking only between words, with advance widths from opentype.js.

Typography responds to the viewport height (feed vs. vertical vs. square formats) and whether all required content assets are present.

## Elevation & Depth

The system uses layered radial and linear gradients to simulate depth; no CSS shadow or blur filter (resvg support is irregular). 

**Background gradient** (top to bottom): A linear gradient blends the derived background-top and background-base colors, shifted left slightly so the darkest tone pools in the bottom-right corner (the vignette reinforces this).

**Radial highlights**: Two radial gradients (brilho and brilho2) layer semi-transparent brand color and support color, angled from top-right and bottom-left. These provide a soft glow that anchors the brand without dominating the layout.

**Vignette (radial gradient)**: A black radial gradient with 0% opacity at the center and 42% at the edges creates frame depth. It closes the corners and draws the eye to the center.

**Phone mockup body**: Linear gradient top-to-bottom from `#3b3b44` to `#0c0c10`, simulating a metallic device casing. Each phone instance has its own unique gradient ID to avoid sibling phones inheriting the same glow.

**Phone gloss**: A linear gradient of white with varying opacity overlaid on the screen area, angled from top-left. Adds a glass reflex.

**The No-Shadow Rule.** Box-shadow and filter: blur are off-limits. Depth lives in gradients and relative positioning. Shadows behind phone mockups are achieved via lower-opacity rect layers (`#000000` at 0.28 and 0.12 opacity) stacked behind the phone frame.

## Shapes

**Corners**: All shapes use rounded corners; the radius scales with the element:
- Logo container: 26px radius (xxl), creating a generous squircle.
- Footer card: 30px radius (xxl), soft and approachable.
- Chip badges: 17px radius (lg), halfway to a pill.
- Resource item circles (icon background): 27px radius.
- Phone screen: 12–15px radius (inner), ~10% of the phone width (outer frame).
- Text containers (none): All text is inline SVG `<text>` elements; no backgrounds.

**Phone mockup silhouette**: The phone body is a rounded rect with a thick border (metallic frame). The screen is slightly inset and rounded, with a clip path to keep the embedded image within bounds. The device frame sits 40px from the viewport edges (on larger formats).

**Grid pattern**: A subtle 60×60px grid of white lines (2.2% opacity) overlays the background gradient, visible only at close inspection. It provides a sense of structure without visual noise.

**Icon design**: All icons are inline SVG paths or circles with strokes. Resource item icons are green checkmarks; chip item indicators are small circles. No icon font; all inline as `<path>` elements.

**The Rounded-by-Default Rule.** Every grouped container (footer, chip, card) gets generous radius. Sharp corners are reserved for text boundaries and the phone screen (where crispness aids the mock's verisimilitude).

## Components

### Chip (Feature Tag)
- **Shape**: Rounded pill (`border-radius: 17px`), background is brand primary at 12% opacity, 1.5px stroke in brand primary at 40% opacity.
- **Typography**: Label in support color, 26px, 500 weight. Inter family. Letter-spacing `0px` (native spacing).
- **Indicator**: Filled circle (5px radius) in brand primary, positioned 26px from left edge, vertically centered (28px height).
- **Dimensions**: Height 56px, padding left 44px. Text flows from 44px to edge minus margin.
- **Layout**: Flows left-to-right, wraps to new line if sum + margin > available width. 14px gap between items.
- **State**: Static (no hover; card is rasterized to JPEG).

### Card Footer
- **Shape**: Rounded rect (`radius: 30px`), sitting 64px above the bottom edge.
- **Background**: Card-bg color (a 6% blend of brand into background-top).
- **Border**: 1.5px stroke in the divider color.
- **Left Stripe**: A 10px vertical rect in the brand primary (`radius: 5px`), acting as a visual accent stripe.
- **Text**: Domain name in white, 40px, 600 weight. Host portion of the URL (no protocol, no www).
- **CTA Button**: Circle (44px diameter) with the brand primary at 18% opacity, containing an arrow path (icon). Positioned bottom-right.

### Phone Mockup
- **Body**: Rounded rect (`radius: ~10% of phone width`) filled with a metallic gradient (dark gray to near-black). The frame width scales with phone size (minimum 8px).
- **Screen**: Rounded rect (`radius: ~12px`), clipped to contain the screenshot image. The screenshot is a base64-encoded PNG (real app UI capture from `assets/capturas/`).
- **Gloss Overlay**: A linear gradient of white (10% to 0% opacity) overlaid on the screen, angled from top-left. Adds the appearance of glass.
- **Border**: 1.5px stroke around the screen in black at 40% opacity, adding dimensionality.
- **Glow**: A radial gradient in the brand color (34% opacity at center, 0% at edges), creating a soft halo around the phone. Scaled per phone instance via sufixo parameter.
- **Shadow (drop)**: Two rect layers behind the phone at 28% and 12% opacity, creating a soft shadow effect.

### Resource Item
- **Icon Circle**: 54px diameter, background brand primary at 16% opacity. Contains a checkmark: path (4.5px stroke, rounded linecap/linejoin) or stylized icon symbol, always in brand primary.
- **Typography**: Title (optional): display font, 26px, 600 weight; Description text: Inter, 23px, 500 weight. Text wraps word-by-word to max 2 lines per item.
- **Layout**: Icon at x=0 (radius 27), text starts at x=92. All text vertically centered within the item's height.
- **Height**: Auto per content: title (26px × 1.18 line-height) + description (up to 2 lines × 23px × 1.3) + 30px base = minimum 52px, expanding as text grows.
- **Spacing**: 14px gap between items vertically; items stack as a column.

## Fallback & Degradation

When content is missing, the system degrades gracefully without breaking:

- **No capture image**: Falls back from vitrine → hero → destaque/recursos → manchete (whichever applies).
- **No resources list**: Vitrine layout requires resources; without them, falls back to hero or manchete.
- **Missing font file**: resvg falls back to Inter (body font) if a display font isn't found in `assets/fontes/`.
- **Title too long**: Auto-shrinks 4px per iteration (vitrine) or 2px (hero/destaque) until it fits the line limit. Worst case: renders at minimum size (42–56px) and potentially overflows — this is acceptable because content is verifiable before publication.
- **Capture load failure**: Card still renders with the fallback layout; the render pipeline skips the phone mockup and moves to text-only layout.
- **Empty post.card**: Falls back to app defaults (app.recursos, app.tagline) so cards don't go blank.

## Do's and Don'ts

### Do:

- **Do** read brand colors from `apps/<id>.json` as OKLCH strings (`marca.destaque`, `marca.fundoA`), never as pre-converted hex.
- **Do** convert OKLCH to hex via `paraHex()` in `lib/cor.js`. Never eyeball a hex approximation or use a color picker.
- **Do** measure text width using `opentype.js` + the actual TTF file. Sum every glyph's `advanceWidth`, fold in letter-spacing. Never estimate by character count.
- **Do** apply word-by-word line breaking, measuring each word before adding. Allows titles to shrink gracefully (4px steps) when they don't fit.
- **Do** use the brand accent sparingly: headline keyword marker (only text between `*asterisks*`), footer left stripe, resource icons, stat number. Overuse dilutes identity.
- **Do** embed fonts as base64-encoded TTF in SVG `<defs>`. resvg won't find system fonts; listing directory avoids hardcoding font filenames.
- **Do** use clip-path to contain app screenshot inside phone screen, even if screenshot is smaller than screen bounds (maintains clean glass effect).
- **Do** layer gradients for depth (back to front): background linear, radial glows (top-right + bottom-left), vignette radial, phone gloss linear.
- **Do** add unique `sufixo` to every gradient/clipPath ID when rendering multiple instances (e.g., vitrine draws two phones; each needs `id="tel-gasonol-a"` and `id="tel-gasonol-b"`).
- **Do** position content upward from footer (grow up). Whitespace naturally pools at card top where gradients are strongest.
- **Do** center phone mockups in their layout region via calculated offset, accounting for rotation and stack desvio.
- **Do** verify contrast before rendering: use `contraste()` function to check text/background ≥ 4.5:1 for body, ≥ 3:1 for large text.

### Don't:

- **Don't** use CSS `box-shadow` or `filter: blur`. Depth lives in SVG gradients and opacity only; resvg's filter support is uneven.
- **Don't** approximate colors by eye, use a color picker, or paste hex without conversion. Always derive from the source OKLCH via `paraHex()`.
- **Don't** use system fonts or assume any font is installed. Every display font must be embedded as a .ttf in `assets/fontes/` and listed by exact family name (e.g., "Inter Display", not "InterDisplay").
- **Don't** estimate text width, assume monospace spacing, or rely on character count. Always use `opentype.js` + the actual TTF file to measure every word's advance width.
- **Don't** hardcode headline sizes or break strategy. Use `ajustarTitulo()` or `quebrarRico()` to shrink (4px or 2px steps) until text fits the line limit. Always respect max 4 lines.
- **Don't** use `<foreignObject>` to embed HTML. Build all content as SVG: paths, text elements, groups, and gradients. resvg doesn't render HTML.
- **Don't** apply `<filter>` tags to individual shapes. Effects (blur, glow) must be built from gradients, opacity, and layered shapes.
- **Don't** use light or near-white backgrounds on the card. All backgrounds are dark (dark gray → near-black gradient). Text is always white (#ffffff) or the computed support color.
- **Don't** add drop shadows or outlines to text elements. Contrast is achieved through careful color derivation, weight selection, and opacity — never via shadow.
- **Don't** reuse gradient IDs across different instances. Each phone mockup, CTA button, or effect needs a unique ID (e.g., `tel-gasonol-a`, `tel-gasonol-b`, `cta`). Reuse causes one element's gradient to bleed into another.
- **Don't** position elements with hardcoded pixel offsets when computed layout is available. Always calculate positions from content height, text baseline, or region bounds.
- **Don't** forget to strip asterisks from headlines before rendering. Use `semMarcadores()` to remove `*keyword*` markers from plain-text output (alt text, social copy).
- **Don't** render without verifying all content paths. Capture missing? Fall back to hero or manchete. Resources empty? Use destaque layout or headline-only.
