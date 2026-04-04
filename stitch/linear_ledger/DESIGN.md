# Design System Document: The Ethereal Ledger

## 1. Overview & Creative North Star: "The Digital Curator"
This design system moves beyond the utility of a standard expense tracker to create an environment of financial mindfulness. The Creative North Star, **"The Digital Curator,"** treats every data point as an exhibit in a high-end gallery. 

To achieve the "Apple-meets-Stripe" aesthetic, we reject the rigid, boxed-in layouts of traditional fintech. Instead, we utilize **intentional asymmetry, expansive breathing room, and tonal depth**. The goal is a "polished wireframe" execution: a layout so clean it feels like a blueprint, but so refined in its spacing and typography that it feels premium. We prioritize speed and clarity through a mobile-first lens, ensuring that data visibility is instantaneous without ever feeling crowded.

---

## 2. Colors: Tonal Atmosphere
The palette is a sophisticated range of architectural grays and soft neutrals. We avoid "pure black" and "pure white" in favor of a textured, atmospheric range.

### The Color Tokens
*   **Background:** `#f8f9fa` (The Canvas)
*   **Primary:** `#5f5e5e` (The Ink - used for primary actions and deep emphasis)
*   **Surface Tiers:**
    *   `surface-container-lowest`: `#ffffff` (Floating cards/active states)
    *   `surface-container-low`: `#f1f4f6` (Secondary grouping)
    *   `surface-container`: `#eaeff1` (Standard sections)
    *   `surface-container-high`: `#e2e9ec` (Deep inset/interactive zones)

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited.** Boundaries must be defined through background color shifts or tonal transitions. To separate a list of transactions, do not use a line; instead, place a `surface-container-lowest` card on a `surface-container-low` background. 

### The "Glass & Gradient" Rule
For high-level summaries (e.g., total balance), use **Glassmorphism**. Apply `surface` colors at 70% opacity with a `20px` backdrop-blur. For primary Call-to-Actions (CTAs), utilize a subtle linear gradient from `primary` to `primary_dim` to give the element "weight" and a tactile, physical quality.

---

## 3. Typography: Editorial Clarity
We use **Inter** as the sole typeface to maintain a crisp, neo-grotesque feel. The hierarchy is designed to feel like a high-end financial report.

*   **Display (lg/md/sm):** Used for large balance amounts. These should feel authoritative. Use `primary` color and slightly tighter letter-spacing (-0.02em).
*   **Headline (lg/md/sm):** Section headers. Use `on_surface` to establish a clear content start.
*   **Body (lg/md):** All transactional data and descriptions. Priority is readability.
*   **Label (md/sm):** Micro-data (dates, categories). Use `on_surface_variant` to deprioritize this information visually.

**Hierarchy Note:** Use a "High-Contrast Scale." If a headline is `headline-sm`, the supporting label should skip a size down to `label-sm` to create a more dramatic, editorial rhythm.

---

## 4. Elevation & Depth: Tonal Layering
In this system, elevation is not about "distance from the screen" but "density of the surface."

*   **The Layering Principle:** Stack surfaces to create focus. A transaction detail modal should be `surface-container-lowest` sitting atop a dimmed `surface-dim` backdrop.
*   **Ambient Shadows:** Use shadows only for truly "floating" elements (like a FAB or an active dropdown). 
    *   *Spec:* `0px 12px 32px rgba(43, 52, 55, 0.06)`. The shadow must be large, diffused, and tinted with the `on-surface` color.
*   **The Ghost Border Fallback:** If a border is required for accessibility in input fields, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use for persistent navigation bars. This allows the user's colorful expense categories to bleed through the UI, making the app feel alive and integrated.

---

## 5. Components: The Refined Primitives

### Cards & Lists
*   **The Rule:** No dividers. Use `1.5rem (md)` or `2rem (lg)` spacing between items.
*   **Styling:** Use `surface-container-lowest` with a border-radius of `md` or `lg`. Ensure internal padding is generous (at least `1.5rem`).

### Buttons
*   **Primary:** `primary` background, `on_primary` text. Border radius: `full`.
*   **Secondary:** `primary_container` background. No border.
*   **Tertiary:** Transparent background, `primary` text. Used for "Cancel" or "Back" actions.

### Input Fields
*   **Styling:** Soft `surface-container-low` backgrounds. 
*   **Interaction:** On focus, the background shifts to `surface-container-lowest` and a "Ghost Border" appears. Labels should use `label-md` and sit above the field, never as placeholder text.

### Chips (Category Tags)
*   Small, rounded capsules using `secondary_container`. They should feel like "pill" buttons but with `label-sm` typography.

### Progress Bars (Budget Tracking)
*   Background: `surface-container-highest`.
*   Fill: `primary` or `tertiary`. 
*   Height: `8px` with `full` rounded corners for a sleek, modern look.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme whitespace. If you think there is enough space, add 8px more.
*   **Do** use "large" border-radii (`1rem` to `2rem`) to soften the financial data.
*   **Do** align elements to a 4px grid, but allow for asymmetrical "hero" moments (e.g., a left-aligned balance with a right-aligned ghost button).
*   **Do** use `surface-container` shifts to group related expenses.

### Don't
*   **Don't** use 100% opaque borders. They create visual noise.
*   **Don't** use standard "Success Green" or "Danger Red" at 100% saturation. Use the `error` and `tertiary` (for success) tokens which are tuned to the system’s muted palette.
*   **Don't** crowd the mobile viewport. Use horizontal swiping for category chips instead of wrapping them to multiple lines.
*   **Don't** use drop shadows on buttons; let the color and typography define the hierarchy.