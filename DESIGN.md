---
design:
  name: "PeakTalk"
  description: "A professional, scenario-driven AI stress-test simulator for high-stakes business communications. The design avoids consumer-grade gamification in favor of a utilitarian, high-contrast, and editorial aesthetic that emphasizes the seriousness and pressure of real-world decision defense."
  
  tokens:
    color:
      brand:
        primary: "#E8600A" # Ember Orange: Used for pressure points, alerts, and primary CTAs.
        ai: "#8B5CF6"      # Soft Violet: Used for neural/magic AI features.
      
      neutral:
        ink: "#111827"     # Deep Graphite: Primary text and dark surfaces.
        paper: "#FAF8F4"   # Warm White: Main editorial background for landing and materials.
        surface: "#FFFFFF" # Clean White: Card and UI element backgrounds.
        steel: "#73706A"   # Muted Grey: Secondary text and metadata.
        line: "#D9D5CC"    # Subdued Border: Low-contrast layout dividers.
        
      semantic:
        success: "#059669" # Emerald: Positive reinforcement and progress.
        warning: "#D97706" # Amber: Caution and potential risks.
        error: "#DC2626"   # Crimson: Critical failures and deletion.
        
    typography:
      family:
        display: "Unbounded, sans-serif" # Bold, high-character font for hero headlines and brand wordmark.
        body: "IBM Plex Sans, sans-serif" # Highly legible, professional font for interface and long-form text.
        mono: "JetBrains Mono, monospace" # Utilitarian font for labels, metadata, and technical indicators.
      
      weight:
        black: 900
        bold: 700
        semibold: 600
        medium: 500
        regular: 400
        
      style:
        label:
          family: "JetBrains Mono"
          size: "11px"
          case: "uppercase"
          letter-spacing: "0.18em"
        
    shape:
      radius:
        none: "0px"  # Used for high-stakes components, buttons, and "hard" UI elements.
        sm: "6px"   # Subtle rounding for small controls.
        md: "10px"  # Standard rounding for containers.
        lg: "12px"  # Pronounced rounding for cards.
        xl: "16px"  # Soft rounding for large sections or overlays.
      
    elevation:
      shadow:
        soft: "0 4px 12px rgba(0, 0, 0, 0.06)"    # Diffused shadow for standard depth.
        card: "0 1px 3px rgba(0, 0, 0, 0.06)"      # Subtle hair-line shadow for cards.
        elevated: "0 8px 24px rgba(0, 0, 0, 0.08)" # Deep shadow for modals and popovers.
        brutalist: "8px 8px 0 rgba(232, 96, 10, 0.18)" # Hard offset shadow for brand-heavy elements.
        
    layout:
      grid: "40px" # Base unit for background patterns and spatial rhythm.
      sidebar:
        expanded: "240px"
        collapsed: "72px"

---

# Design System: PeakTalk

PeakTalk’s design language is rooted in **Industrial Modernism** and **Utilitarian Editorial**. It is designed to feel like a serious professional tool—a "pressure-test" environment rather than a motivational coaching app. The aesthetic is built on high contrast, sharp geometry, and a rigid information hierarchy.

## 1. Visual Theme & Atmosphere
The atmosphere is **Dense, Focused, and Authoritative**. 
- **The "Stress-Test" Vibe:** The use of sharp edges (`rounded-none`) and deep black surfaces against Ember Orange accents creates a sense of urgency and high stakes.
- **Editorial Precision:** The layout mimics high-end business journals or technical manuals, using `JetBrains Mono` for metadata to give it a "prepared," almost military-grade feel.
- **Controlled Friction:** The design intentionally avoids "playful" elements like gradients or rounded pills. Instead, it uses rigid grids and stark borders to communicate reliability and structure.

## 2. Color Palette & Roles
The system operates on a restrained palette to ensure that the AI's feedback remains the primary focus.
- **Ember Orange (#E8600A):** The core brand color. It represents "the heat" of the conversation. It is used sparingly for primary CTAs, critical alerts, and "Pressure Points" where the user's argumentation is weakest.
- **Neural Violet (#8B5CF6):** A secondary accent used exclusively for AI-driven insights, internal reasoning, and magic features. It provides a soft "brain-like" contrast to the aggressive orange.
- **Graphite & Paper:** The foundation is built on `Ink (#111827)` and `Paper (#FAF8F4)`. This creates an analog, readable feel that grounds the AI technology in a familiar, professional material context.

## 3. Typography Principles
Typography is used to establish a clear hierarchy between "The Message" and "The Metadata."
- **Brand & Headlines:** `Unbounded` is used in Heavy/Black weights for hero titles. Its wide, geometric stance feels unshakeable and bold.
- **Functional Interface:** `IBM Plex Sans` handles the heavy lifting. It is used for body text, form fields, and simulated dialogue. It is neutral, professional, and highly legible under pressure.
- **Metadata & Labels:** `JetBrains Mono` is used for all "system" information—labels, counters, and short technical notes. It is always uppercase with high letter-spacing (`0.18em`) to distinguish it as non-human, machine-generated context.

## 4. Component Stylings
- **Buttons:** Primary buttons are sharp-edged (`rounded-none`), heavy black (`#111111`) or Ember Orange. They feel like physical "switches" rather than soft web buttons.
- **Cards & Containers:** Most containers use a `1px` solid border (`#D9D5CC` or `#111111`). When elevated, they use a "Brutalist Shadow"—a hard, solid-color offset rather than a soft blur.
- **The Grid:** Backgrounds often feature a subtle `40px` or `64px` line-grid. This reinforces the "analytical" nature of the tool, suggesting that every thought is being measured and mapped.

## 5. Motion & Interaction
Motion is used to simulate the **Rhythm of Conversation**.
- **The "Reveal":** Insights and AI questions don't just appear; they slide in with a precise, fast ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), mimicking a quick retort or a sharp question.
- **Reduced Friction:** All interactions are fast (`150ms-250ms`). There are no "vibrant" or "bouncy" animations. Motion is utilitarian, serving only to guide focus and indicate state changes.
