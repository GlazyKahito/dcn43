# DESIGN.md — Visual Design System & Tokens
### Inspired by lab0.ai & scamshield-olive.vercel.app

This design specification upgrades the Virtual Lab platform from generic dark styles to an award-winning, high-craft engineering aesthetic.

---

## 🎨 Color Palette & Tokens

| Token | Hex / CSS Value | Semantic Role |
| :--- | :--- | :--- |
| `--page-bg` | `#050807` | Deepest near-black with faint emerald tint |
| `--section-bg` | `#0a0f0d` | Elevated section backdrop |
| `--card-bg` | `#101713` | Default product-window & card container |
| `--card-border` | `rgba(120, 180, 150, 0.12)` | 1px hairline border with soft green reflection |
| `--accent-emerald` | `#1f7a4d` | Solid primary buttons and badges |
| `--accent-glow` | `#34d399` | Radiant highlights, active path pulses, beam connectors |
| `--text-primary` | `#f0f6f2` | Crisp white headline text |
| `--text-muted` | `#8b949e` | Secondary descriptions, captions, and specs |
| `--paper-card` | `#c9dccf` | High-contrast pale sage document card (dark text `#050807`) |
| `--gold-gradient` | `linear-gradient(135deg, #c8b27a 0%, #8a7440 100%)` | Champagne/gold highlight card for key breakthrough stats |
| `--footer-bg` | `#0b2519` | Atmospheric deep-green gradient transition at page conclusion |

---

## 🔤 Typography

1. **Display & Pixel Accent**: `Home Video Regular` (`/public/fonts/HomeVideo-Regular.ttf`)
   - Used for: Status badges (`[FAULT]`, `[CHECK]`, `01 / INPUT`), terminal headings, telemetry numbers, and section phase numbers.
   - Prevents generic "AI-generated" looks by giving a distinctive retro-technical tactile identity.
2. **Headlines & Interface**: `Space Grotesk` / Modern Geometrical Sans
   - Used for: Hero titles, two-tone subheads, tab labels, and primary navigation links.
   - Tight letter-spacing (`tracking-tight`), crisp contrast.
3. **Monospace & Code**: `JetBrains Mono` / `ui-monospace`
   - Used for: Diagnostic terminal outputs, routing tables, IP addresses, pseudocode, and C/Python implementations.

---

## 🌊 Motion & Micro-Interactions (scamshield-olive & lab0.ai)

1. **Fluid Particles Background**: Interactive HTML5 Canvas rendering floating glowing emerald particles with subtle proximity links and cursor magnetism.
2. **CutReveal Text Animation**: Headline words emerge upward from masked overflow (`translateY(110%)` &rarr; `translateY(0)`).
3. **RollChar Hover**: Interactive navigation links roll each letter individually on mouse hover (`--i` stagger).
4. **Curved Glowing Beams**: SVG paths with animated glowing dashes connecting source telemetry cards to the central diagnostic processor.
5. **Smooth Scroll**: Lenis inertial smooth scrolling across the entire single-page experience.
