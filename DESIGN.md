---
name: Divulgação Premium Card System
description: Cinematic, SaaS-grade promotion cards per app — real app screen in a 3D phone, brand-lit dark background, site always visible
colors:
  background: "#030201"
  accent: "{app.visual.acento | app.marca.destaque}"
  accent-2: "{app.visual.acento2 | clarear(accent, 0.35)}"
  heat: "{app.visual.calor | accent}"
  text-primary: "#ffffff"
  text-body: "#e9e6e2"
  text-muted: "#b9b3ac"
  url-pill: "linear-gradient(#ffd84a, #ffb319)"
  url-text: "#161005"
typography:
  display:
    fontFamily: "Barlow Condensed (GASONOL) or the app's `fonte` (Sora, Manrope, Fraunces, Space Grotesk, Plus Jakarta Sans, Inter Display)"
    fontSize: "104px (feed) / 116px (vertical); highlight line 82px / 90px; auto-shrinks to fit"
    fontWeight: "700–800"
    lineHeight: "0.93"
  body:
    fontFamily: "Inter"
    fontSize: "27px subtitle, 26px benefit title, 20px benefit text"
    fontWeight: "400–700"
  label:
    fontFamily: "Inter"
    fontSize: "28px (URL pill, footer badges; badges shrink to fit)"
    fontWeight: "600–800"
rounded:
  benefit: "18px"
  pill: "50px"
  phone: "72px frame / 60px screen"
spacing:
  margin-left: "58px"
  text-column: "530px"
  benefit-gap: "13px (feed) / 16px (vertical)"
components:
  benefit-box:
    background: "linear-gradient(135deg, heat 10%, rgba(10,8,6,.80))"
    border: "1.5px heat 28%"
    icon: "58px, accent stroke, neon drop-shadow"
  phone:
    transform: "rotateY(-17deg) rotateX(5deg) rotateZ(3.5deg), perspective 2400px"
    frame: "titanium gradient, 14px stacked edge, accent rim light"
    screen: "real app capture, iOS status bar and Dynamic Island"
  url-pill:
    content: "globe icon + app domain (+ optional suffix, e.g. · grátis)"
---

# Design System: Divulgação Premium Cards

## Overview

**Creative North Star: "The App on a Film Poster"**

Every card looks like a premium SaaS launch poster: a near-black cinematic background lit by the app's own colors, a heavy two-tone headline on the left and the **real app** on a phone in 3D perspective on the right. The card is an HTML/CSS page rendered in Chromium (Playwright) and saved as JPEG by `scripts/lib/cards.js` — rendered at 2x and downsampled for clean antialiasing.

The layout is fixed so the feed reads as one family; each app changes only color, background effect, headline font, content and screen.

**Key Characteristics:**
- Real app screens (the app, never the landing page), chosen per theme
- The app's site is always on the card, in the yellow pill
- Dark, cinematic background: glow behind the logo, light streaks crossing the lower right, sparks, vignette
- Neon-lit icons in the app accent
- Local OFL fonts, identical on a Mac and on the GitHub runner

## Composition (feed 1080×1350)

1. **Logo** top left (330px wide), with a warm drop shadow.
2. **Headline**: white lines (`titulo`, `<br>` breaks) plus one **highlight line** (`destaque`) in the accent gradient with a soft glow, then a glowing accent rule.
3. **Subtitle** (≤ 3 lines; `<b>` renders in accent).
4. **Three benefits**, each a glass box with a neon icon, bold title and one short line.
5. **Phone** on the right in 3D perspective, accent halo behind it and a floor shadow.
6. **URL pill** (yellow) bottom left, and **three footer badges** centered, split by thin dividers.

**Vertical 1080×1920 (TikTok):** same composition with more air; URL pill and badges move up (470px / 370px from the bottom) to stay above the caption TikTok overlays.

## Color

- Background is always near-black `#030201`; color comes from light, never from flat fills.
- **Accent** (`visual.acento`, else `marca.destaque`): highlight line, rule, icons, phone rim light, halo.
- **Heat** (`visual.calor`, else accent): logo glow, main light streaks, benefit box tint and border.
- **Effect** (`visual.efeito`): `fogo` (GASONOL — fire-orange streaks and sparks) or `luz` (streaks and sparks in the app's own colors).
- The URL pill is always yellow: it is the call to action on every app.

## Typography

- Headline in the app's display font; GASONOL uses **Barlow Condensed Bold** (condensed, poster-like, matches the approved reference).
- **Inter** for everything else.
- **The Fit Rule.** The page measures itself after fonts load: the headline shrinks until it fits the 530px column and clears the URL pill; the highlight line never wraps; footer badges shrink together until they fit. Content is never clipped and never overlaps the phone.

## Content per theme

Each post may carry a `premium` block in `apps/<app>.json`:

```json
"premium": {
  "titulo": "Gasolina<br>ou Etanol?",
  "destaque": "Descubra na hora",
  "sub": "O <b>GASONOL</b> mostra em segundos qual combustível compensa mais.",
  "tela": "tela-calculadora",
  "tamanho": 104,
  "beneficios": [{ "icone": "cronometro", "titulo": "Cálculo rápido", "texto": "Resultado em segundos." }]
}
```

Without it, the card is derived: the `*marked*` part of `card.titulo` becomes the highlight line, `card.sub` the subtitle and the first three app `recursos` the benefits; the screen rotates through `assets/capturas/`.

## Screens

- Theme screens live in `assets/premium/<app>/<tela>.png` (1170×2532, 3x).
- Show the app in a state that proves the theme (result, voice input, vehicle search, referral…), not a generic home.
- No personal data: real names, emails, referral codes and photos are replaced by fictitious ones (generic avatar, "Ana Ribeiro").

## Do's and Don'ts

- **Do** always show the app's site on the card.
- **Do** pick the phone screen for the theme of the day; vary it across the week.
- **Do** approve the first card of a new app with the owner before generating the batch, and compare it side by side with the reference.
- **Don't** show the landing page inside the phone — it is not the app.
- **Don't** add counters, page numbers or other chrome outside this composition.
- **Don't** brighten the background: it stays close to black; light is an accent, not a fill.
- **Don't** put personal data from the owner's account on a card.
