# Floating player refinement — 0.3.11

final result: passed

- User requested a lower player and more transparency. Player is now 48px high, with an 8px bottom offset, 70% background opacity and 10px backdrop blur. Controls remain fully opaque.
- Browser integration checks passed; extension package rebuilt and whitespace check passed. Actual Chrome reloaded to 0.3.11 and verified on the test article.
- Evidence: `artifacts/product-design-dark/graphite-lower-translucent-chrome.png`.

# Readily reference fidelity correction — 0.3.10

final result: passed

- Source: `docs/images/graphite-reference.png`, supplied by the user after rejecting the translucent implementation. This reference supersedes earlier 50% opacity styling.
- Solid #202123 player, plain 1× text, flat icons, 232 × 56 CSS-pixel footprint. Settings use system typography, consistent provider/voice field sizes, subtle filled fields and custom chevrons.
- Browser integration checks passed, including narrow settings/player layouts, keyboard focus, provider workflows and no uncaught page errors. Package rebuilt; SVG asset verified in ZIP; whitespace check passed.
- Actual Chrome reloaded to 0.3.10; native sidebar and player visually inspected over a white article. Evidence: `artifacts/product-design-dark/graphite-refined-chrome.png`.

The following reports are historical.

# Readily Graphite design QA

final result: passed

- Readily 0.3.9 uses the user-selected Graphite palette: charcoal #202123, fields #2d2e30, warm ivory #f1eee7, foreground #f5f3ee and supporting text #b9b7b1.
- The floating player remains 232 × 56 CSS pixels with a 50% background: rgba(32,33,35,0.5).
- Browser integration checks passed, including provider workflows, narrow layouts and no uncaught page errors. Package rebuilt; diff whitespace check passed.
- Reloaded in the user’s Chrome profile and visually verified the actual native settings sidebar and compact player. Evidence: `artifacts/product-design-dark/graphite-chrome.png`.
- The localhost preview imports the same current extension styles and player code.

The earlier comparison below documents the original structural direction before the user selected Graphite and reduced the player size. Its images and palette are historical.

# Previous Night Radio design QA

final result: passed

## Evidence

- Source visual truth: `docs/images/dark-reference.png`, the selected dark Product Design direction refined with a 50% opaque player background.
- Implementation: `http://127.0.0.1:8765/artifacts/product-design-dark/`.
- Browser-rendered implementation: `artifacts/product-design-dark/implementation.jpg`.
- Full-view and focused comparison in the same input: `artifacts/product-design-dark/comparison.jpg`; reproducible board: `artifacts/product-design-dark/comparison.html`.
- Source and implementation both 1487 × 1058 pixels, CSS viewport 1487 × 1058, density 1. Source was not resized for the full-view comparison. Focused settings crops use the same scale; player crops use original density.
- State: dark mode, OpenAI, Marin, Voice tab selected, no API key, follow enabled, paused/ready player at 1.25×.
- Narrow Connection evidence: `artifacts/product-design-dark/connection-narrow.jpg`, CSS viewport 280 × 750; document width and scroll width both 280.
- The preview loads the actual extension CSS, settings module and content-script player. Chrome services are simulated only in the preview; installed extension behavior uses its existing real Chrome APIs.

## Comparison history

1. Initial browser inspection found a P2 density mismatch at wide sidebar widths: settings labels, selectors and headings were substantially smaller than the mock. A responsive 450-pixel breakpoint now increases type, field heights and spacing. Player dimensions were brought closer to the selected console shape. The preview highlight adapter was corrected to use the content script’s `id` message field.
2. Post-fix browser capture was compared with the source in both full-view and focused settings/player regions. No actionable P0/P1/P2 findings remain. The saved combined comparison shows the corrected hierarchy and layout.

## Required fidelity surfaces

- Typography: bundled Atkinson Hyperlegible provides regular/bold text throughout. Heading, selected voice and action hierarchy follow the mock. Its optical shapes differ slightly from the generated mock; retaining the existing accessible bundled font is intentional. Long device voice names reduce type size rather than overflow.
- Spacing/layout: source’s roughly one-third-width sidebar, Voice/Connection organization, prominent voice selector, preview, model, follow preference and connection footer are reproduced. Wide and narrow layouts remain usable. The player retains the extension’s 18-pixel bottom offset. The article is outside extension styling; differences in the preview article are not shipped changes to host websites.
- Colors/tokens: settings use #171c36, fields #222a49, foreground #f4f3ff, supporting text #b9bdd3 and primary accent #b4b9ff. Player background is exactly rgba(23,28,54,0.5), with full-opacity controls and text. A small additional speed-value backing improves contrast; reduced-transparency preference uses a solid surface.
- Assets: no raster artwork is needed. Bundled Tabler SVG icons are used, with no decorative replacements. Native select arrows vary from the generated mock; keeping native select behavior is intentional.
- Copy/content: capabilities and provider billing/privacy explanations remain accurate. The existing Refresh voices action is retained as a small supporting action even though the mock omitted it. Credentials remain on Connection. No extra product capabilities were added.

## Functional verification

- All 12 unit tests passed.
- Chromium integration checks passed: playback/pause/resume, speed caching, direct paragraph/photo jumps, provider voice loading, preview, remember/remove keys, credential isolation, cleanup, strict page CSP, narrow toolbar and settings layouts, and no uncaught page errors. Provider responses are mocked; no live provider compatibility or voice-quality claim is made.
- New regression checks cover 50% toolbar background with opacity 1 on the enclosing element, Voice/Connection arrow-key selection and visible keyboard focus.
- In-app preview console was inspected. One MutationObserver navigation diagnostic was reported by that browser; neither the preview nor extension source creates a MutationObserver. The preview rendered and remained usable, and the separate Chromium integration suite reported no uncaught page errors. This diagnostic is not attributed to extension code without a source stack.
- Native Chrome settings window opening and Done preserving playback remain covered by the integration suite. The exact native sidebar placement in the user’s personal Chrome profile was not changed or inspected.

## Follow-up polish

- P3: native dropdown chevrons and font glyphs differ from the generated illustration. These do not block use.
- Text and icons stay solid while the player background is translucent. Contrast over arbitrary host imagery depends on the underlying page; the speed value has extra backing and icons have sufficient contrast on the tested light/dark articles.

## Implementation checklist

- [x] Dark settings, keyboard-accessible tabs, provider and key workflows.
- [x] 50% player background, solid controls, reduced-transparency fallback.
- [x] Browser comparison, narrow layout, integration checks and rebuilt package.
