# Four-Step Fold Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the small static three-step folding strip with a polished four-step, left-to-right animated folding journey that ends in the app's new cute star.

**Architecture:** Generate one purpose-built transparent raster journey asset containing four evenly spaced states and three luminous arrows, then reveal it progressively inside the existing folding stage. Keep step labels and accessibility text in HTML, while CSS owns the reveal, light sweep, and final bounce.

**Tech Stack:** HTML5, CSS keyframes, transparent PNG assets, Node.js built-in test runner, in-app browser QA.

## Global Constraints

- Keep the existing create, persist, fly-to-bottle, success, and return-home behavior unchanged.
- Four states must read as paper strip, first fold, tightened star form, and completed cute star.
- Reuse the same visual language as `assets/origami-star-cute.png`.
- Keep labels as live HTML text rather than baking them into the image.
- Respect `prefers-reduced-motion` and preserve keyboard focus.

---

### Task 1: Four-Step Folding Visual

**Files:**
- Create: `assets/fold-journey-cute.png`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: existing `#fold-stage`, `.fold-stage.is-folding`, and `assets/origami-star-cute.png` visual language.
- Produces: `.fold-journey`, `.fold-journey-art`, and four `.fold-step-label` elements.

- [x] **Step 1: Generate the final raster journey asset**

Use the current `fold-strip.png` as the process reference and `origami-star-cute.png` as the final-character reference. Generate a transparent horizontal 4:1 PNG with four isolated states, three matching luminous arrows, consistent pink satin-paper material, no text, no background, and no watermark. Save it as `assets/fold-journey-cute.png` and verify corner alpha is zero.

- [x] **Step 2: Replace the fold-stage markup**

Replace the old `.fold-guide` image with:

```html
<div class="fold-journey" aria-label="纸条经过折角、收紧，最终变成可爱星星的四步过程">
  <img class="fold-journey-art" src="./assets/fold-journey-cute.png" alt="纸条折成可爱星星的四步过程">
  <div class="fold-step-labels" aria-hidden="true">
    <span class="fold-step-label">纸条</span>
    <span class="fold-step-label">折角</span>
    <span class="fold-step-label">收紧</span>
    <span class="fold-step-label">完成</span>
  </div>
</div>
```

- [x] **Step 3: Implement sequential animation and compact desktop layout**

Style the journey at 520–560 px wide with a left-to-right clip reveal, traveling glow, four aligned labels, and a subtle final bounce. Under reduced motion, show the complete asset without reveal, sweep, or bounce.

- [x] **Step 4: Verify automated and browser behavior**

Run `npm test`, JavaScript syntax checks, and `git diff --check`. In the browser, create a draft, enter the folding stage, confirm the four steps fit without clipping, put the star in the bottle, and confirm persistence/count behavior remains unchanged. Check console errors.

- [x] **Step 5: Update visual QA and commit**

Capture the folding stage, compare it with the user screenshot and the rest of the app, update `design-qa.md` with the new evidence, and commit with `feat: animate four-step star folding journey`.
