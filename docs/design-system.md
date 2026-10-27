# StaffSync Design System — Apple Inspired Enterprise HRMS

## 1. Visual Personality & Philosophy
StaffSync adapts the aesthetic hallmarks of **Apple.com** and Apple's human interface guidelines to an enterprise Human Resource Management System:
- **Quiet Precision**: Restrained, confident typography, expansive whitespace, and deliberate content grouping.
- **Translucency & Depth**: Multi-layered frosted glass (`backdrop-filter: blur(20px) saturate(180%)`), subtle 1px hairline borders (`rgba(255, 255, 255, 0.08)` to `0.15`), and soft multi-stop elevation shadows.
- **Fluid Micro-interactions**: Smooth transitions with Apple-standard spring easing (`cubic-bezier(0.16, 1, 0.3, 1)`), tactile hover lifts, and pill-shaped interactive elements.
- **Accessible Contrast**: Strict adherence to WCAG AA/AAA contrast ratios across both deep dark obsidian surfaces and crisp light elements.

---

## 2. Typography & Type Scale
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif`
- **Heading 1 / Display**: 44px - 56px, weight 700, letter-spacing `-0.03em`, line-height 1.08
- **Heading 2**: 28px - 36px, weight 600, letter-spacing `-0.025em`, line-height 1.15
- **Heading 3**: 20px - 24px, weight 600, letter-spacing `-0.02em`, line-height 1.25
- **Body Large**: 17px, weight 400/500, letter-spacing `-0.015em`, line-height 1.47
- **Body Default**: 15px, weight 400/500, letter-spacing `-0.01em`, line-height 1.45
- **Body Small / Caption**: 13px, weight 400/500, letter-spacing `-0.005em`, line-height 1.4
- **Micro / Badge**: 11px, weight 600, letter-spacing `0.02em`, text-transform `uppercase`

---

## 3. Color Palette

### Base Surfaces
- Canvas Deep: `#000000`
- Surface Elevated: `#0c0d10`
- Card Fill: `rgba(22, 23, 27, 0.75)`
- Card Fill Hover: `rgba(28, 30, 36, 0.85)`
- Modal / Dropdown: `rgba(20, 21, 26, 0.94)`
- Hairline Border: `rgba(255, 255, 255, 0.08)`
- Hairline Highlight: `rgba(255, 255, 255, 0.16)`

### Text Colors
- Text Primary: `#f5f5f7` (94% brightness)
- Text Secondary: `#a1a1a6` (neutral mid-tone)
- Text Muted: `#6e6e73` (tertiary labels & footnotes)

### Accent & Semantic Tones
- **Apple Blue**: `#2997ff` (Dark mode hero), `#0071e3` (Buttons/Interactive), Hover `#0077ed`
- **Success / Emerald**: `#30d158` (Dark), `#34c759` (Light / Clock-in / Approved)
- **Warning / Amber**: `#ff9f0a` (Dark), `#ff9500` (Pending leaves / reminders)
- **Danger / Coral**: `#ff453a` (Dark), `#ff3b30` (Rejected / Delete actions)
- **Purple / Accent**: `#bf5af2` (Trainings / Announcements)

---

## 4. Components & Geometric Rules
- **Pill Buttons**: Height 40px - 44px, border radius `980px`, horizontal padding 20px - 24px.
- **Cards**: Border radius `20px`, padding 24px - 32px, 1px border `rgba(255, 255, 255, 0.08)`, frosted background.
- **Inputs & Controls**: Height 44px, border radius `12px`, background `rgba(255, 255, 255, 0.04)`, focus ring `0 0 0 3px rgba(0, 113, 227, 0.35)`.
- **Badges / Tags**: Border radius `980px`, padding 4px 10px, font size 12px, font-weight 500.
- **Tables**: Border radius `16px`, subtle border, zebra hover `rgba(255, 255, 255, 0.02)`.
