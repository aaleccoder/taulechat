---
applyTo: '**'
---
# TauLeChat Component Style Guidelines

This document sets the style and interaction guidelines for all UI components in TauLeChat. Follow these rules for consistency, accessibility, and Android/ISO 9241 ergonomics.

## General Principles
- **Mobile-first**: Prioritize touch ergonomics, especially for Android.
- **ISO 9241**: Ensure clarity, feedback, and error prevention.
- **Accessibility**: Use proper aria-labels, roles, and focus states.
- **Consistency**: Use the same spacing, colors, and shapes as defined in `App.css`.

## Layout & Spacing
- Use `rounded-full` for circular buttons and pills.
- Minimum touch target: `h-10 w-10` (40x40px) for icons, `h-12 w-12` for primary actions.
- Use `gap-2`, `px-2`, `py-2` for spacing between elements.
- Use safe-area padding at the bottom for mobile screens.

## Colors & Theme
- Use CSS variables from `App.css` for backgrounds, borders, and text.
- Use `bg-card`, `bg-background`, `bg-accent/10` for surfaces.
- Use `text-foreground`, `text-muted-foreground` for text.
- Use `border`, `shadow-md`, `shadow-lg` for elevation.

## Buttons
- Use Shadcn Button component for all actions.
- Add `motion-safe:transition-all motion-safe:duration-150` for soft animations.
- Use `active:scale-95` for press feedback.
- Use `hover:bg-accent/10` for hover feedback on ghost/outline buttons.
- Use `rounded-full` for icon/circular buttons.
- For primary actions (e.g., send), use larger size (`h-14 w-14`) and `shadow-lg`.

## Inputs
- Use pill-shaped containers (`rounded-full`, `border`, `bg-card`).
- Textareas should auto-grow and cap at `max-h-48`.
- Use `focus-within:ring-2 focus-within:ring-ring/50` on input containers.
- Use `motion-safe:transition-colors` for input focus transitions.

## Attachments
- Preview attachments in a horizontal strip above the input.
- Use image/file preview, filename, and size.
- Remove action should be a circular button with soft animation.

## Model Picker
- Place model picker as a pill above the input bar.
- Use drawer for model selection.
- Star button for default model toggle, with active scale animation.

## Accessibility
- All interactive elements must have `aria-label` and/or `title`.
- Use `role="form"` for input containers.
- Use visually hidden labels for text inputs.

## Animations
- Use Tailwind's `motion-safe` utilities for all transitions.
- Avoid abrupt changes; use `transition-all`, `transition-colors`, `transition-shadow`.
- Respect `prefers-reduced-motion`.

## Example Classes
```
<Button className="h-12 w-12 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95" />
<div className="rounded-full border bg-card px-2 py-2 shadow-md focus-within:ring-2 focus-within:ring-ring/50 motion-safe:transition-shadow" />
<textarea className="max-h-48 w-full resize-none bg-transparent leading-6 outline-none placeholder:text-muted-foreground/70 motion-safe:transition-colors" />
```

### How to Create Reusable Classes
1. Identify repeated or complex class combinations in your components.
2. Add a new class in `App.css` using `@apply`:
   ```
   .my-custom-class {
     @apply h-12 w-12 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95;
   }
   ```
3. In your TSX, use the class name:
   ```
   <Button className="my-custom-class" />
   ```
4. Update the guidelines document if new patterns are introduced.

## Do Not
- Do not use custom colors or spacing outside the theme variables.
- Do not use non-Shadcn buttons or inputs.
- Do not omit accessibility attributes.
- Do not use abrupt or non-motion-safe animations.

---

**All new components must follow these guidelines. Update this file if new patterns are introduced.**
