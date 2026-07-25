---
name: MatchedIn
colors:
  surface: '#fef7ff'
  surface-dim: '#dfd7e4'
  surface-bright: '#fef7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1fd'
  surface-container: '#f3ebf8'
  surface-container-high: '#ede5f2'
  surface-container-highest: '#e7e0ec'
  on-surface: '#1d1a23'
  on-surface-variant: '#4a4453'
  inverse-surface: '#322f38'
  inverse-on-surface: '#f6eefb'
  outline: '#7b7485'
  outline-variant: '#ccc3d6'
  surface-tint: '#713dcc'
  primary: '#420093'
  on-primary: '#ffffff'
  primary-container: '#5b21b6'
  on-primary-container: '#c7aaff'
  inverse-primary: '#d3bbff'
  secondary: '#7b5800'
  on-secondary: '#ffffff'
  secondary-container: '#fdc34d'
  on-secondary-container: '#715000'
  tertiary: '#552400'
  on-tertiary: '#ffffff'
  tertiary-container: '#783600'
  on-tertiary-container: '#ffa267'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#581db3'
  secondary-fixed: '#ffdea6'
  secondary-fixed-dim: '#f7bd48'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb68b'
  on-tertiary-fixed: '#321300'
  on-tertiary-fixed-variant: '#753400'
  background: '#fef7ff'
  on-background: '#1d1a23'
  surface-variant: '#e7e0ec'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered for a high-intent, professional dating environment. It balances the rigor of a networking platform with the warmth of a premium social club. The brand personality is **Trustworthy, Premium, and Warm**, avoiding the gamified tropes of traditional dating apps in favor of a sophisticated, editorial approach.

The visual style is **Corporate / Modern** with a focus on high-end minimalism. It utilizes ample whitespace, refined typography, and purposeful gold accents to evoke an emotional response of security and exclusivity. The interface remains "uncluttered," prioritizing content over decorative flourishes to ensure a focused user experience.

## Colors

The palette is designed to instill confidence and signify status.

- **Primary (Deep Purple):** Used for core navigation, active states, and brand-heavy backgrounds. It provides a stable, authoritative anchor for the UI.
- **Secondary/Accent (Gold):** Reserved exclusively for high-priority Call-to-Actions (CTAs), premium badges, and subtle highlights. This color should be used sparingly to maintain its perceived value.
- **Background (Off-white):** A warm neutral base that reduces eye strain and distinguishes the product from generic "pure white" corporate tools.
- **Text (Dark Charcoal):** Ensures high legibility and a soft but definitive contrast against the off-white background.

## Typography

This design system uses **Inter** across all levels to maintain a systematic and utilitarian feel that professionals find familiar. 

- **Headlines:** Use tight letter-spacing and bold weights to create a sense of presence.
- **Body Text:** Optimized for readability with generous line heights to ensure long-form bios are comfortable to read.
- **Labels:** Used for metadata, tags, and small navigation elements; these utilize slightly increased letter-spacing for clarity at small sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain an "app-like" feel even on wide screens, while utilizing a fluid 4-column system for mobile.

- **Mobile:** 4 columns with 16px margins and 16px gutters.
- **Tablet:** 8 columns with 32px margins.
- **Desktop:** 12 columns with a maximum container width of 1200px.

Spacing is governed by an 8px base unit. Vertical rhythm should prioritize "Stack" spacing (gap between components) to ensure the interface feels airy and premium.

## Elevation & Depth

To maintain a professional aesthetic, depth is communicated through **Ambient Shadows** and **Tonal Layers**.

- **Surfaces:** Profile cards and modals use a pure white surface to lift off the Off-white background.
- **Shadows:** Use extremely soft, low-opacity shadows (e.g., `box-shadow: 0 10px 30px rgba(28, 25, 23, 0.05)`). Shadows should feel like a soft glow rather than a harsh drop.
- **Transitions:** Elevation changes should be subtle; avoid high-contrast borders unless specifically used for CTAs.

## Shapes

The shape language is defined by **Rounded (0.5rem)** standards for most elements, creating a friendly yet structured appearance. 

- **Cards:** Profiles and content containers must use `rounded-xl` (1.5rem / 24px) to create a distinct, modern containerized look.
- **Buttons:** Primary buttons should use the standard roundedness or a full pill shape for secondary actions.
- **Inputs:** Standard `rounded` (0.5rem) to maintain a professional, organized alignment.

## Components

### Buttons
- **Primary:** High-contrast Gold (#B8860B) with Dark Charcoal text. These are reserved for "Connect," "Submit," or "Upgrade" actions.
- **Secondary:** Deep Purple outlines or solid fills with white text for standard navigation actions.

### Cards
- **Profile Cards:** Utilize `rounded-xl` corners. Images should be the hero of the card, with metadata (Name, Occupation, Education) overlayed on a subtle dark gradient at the bottom.

### Inputs
- **Text Fields:** Minimalist design with a subtle 1px border in a light grey-purple. Focus states should transition the border to Deep Purple.

### Navigation
- **Sticky Header:** A transparent-to-solid transition on scroll, featuring the logo and profile access.
- **Sticky Mobile Nav:** A bottom-anchored bar with high-quality line icons.

### Additional Components
- **Verification Badges:** Small gold icons next to names to denote "Premium" or "Identity Verified" status.
- **Chips/Tags:** Used for interests or professional skills. Use the Off-white background with a thin Deep Purple border and `label-sm` typography.