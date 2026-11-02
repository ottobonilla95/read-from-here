# Floating reader — design QA

final result: passed

## v0.3.4 — point and pick

The user reported no pointer cursor and difficulty choosing text in a lesson. Eligible text now gets a temporary hand cursor and hover outline while the player is open. Targets are resolved against the current DOM, including lessons expanded after activation and articles outside the initial reading root. Native links, controls, modifiers, and drag selection keep their behavior. Closing the reader restores original cursor styling. Versioned instances dispose old handlers and replace orphaned controls; a toolbar removed by page rebuilding is restored on the next activation.

Verification includes nested text with an existing cursor, restoring that cursor over a real link, an expanded lesson outside the original article, reading-position changes, orphaned controls, toolbar removal/restoration, and cleanup on close. An initial cursor check exposed a scroll event clearing the hover state after a newly opened lesson scrolled into view. The fix recomputes the target under the pointer on scroll/resize and clears the hover only when leaving the document, rather than every nested element. The complete browser suite then passed, including unchanged playback, provider fixtures, credential isolation, narrow layout, and no uncaught page errors.

Native verification on the user's TryHackMe lesson confirmed that clicking the reported paragraph selected it and displayed the passage highlight. This uncovered low-contrast inherited text on the pale highlight in a dark theme. Passage highlight text now explicitly uses navy (#182846) on pale blue (#e6edff). The dark fixture screenshot `artifacts/picker-dark.png` (1030 × 733, deviceScaleFactor 1) and a subsequent native screenshot show readable selected text; automated checks assert its computed highlight foreground. Version 0.3.4 was reloaded in personal Chrome and the actual lesson refreshed, with Task 2 open and the paragraph selected. No paid speech request was made.

Toolbar dimensions, fonts, controls, spacing, transparency, assets, and settings design are unchanged from v0.3.3. No new visual target was requested. The current feature is a functional correction with the dark-theme contrast finding resolved; no actionable P0/P1/P2 findings remain.

## v0.3.3 — rounded borders

The user requested rounded borders. The current 240 × 48px toolbar now has fully rounded pill-shaped ends, while settings inputs, selects, bordered buttons, and notices use consistent 12px corners. Size, 50%-opaque background, typography, colors, copy, and playback behavior are preserved.

Opened the regenerated full-view and focused source/implementation comparisons plus the 360px-wide settings capture. No clipping, unwanted wrapping, icon blur, or actionable P0/P1/P2 differences. Current source and implementation dimensions and normalization remain those recorded below; changes from the original mockup follow the user's subsequent size and transparency requests. The complete browser suite passes with no uncaught page errors. Reloaded and verified version 0.3.3 in personal Chrome, with the player visible and settings sidebar open.

## v0.3.2 — sidebar settings and smaller controls

The user requested settings in the side again, smaller buttons, and a more transparent container. Current toolbar: 240 × 48 CSS px, 32px play/pause, 24px speed buttons, 14px speed text, 50%-opaque white surface and 10px backdrop blur. All labels/icons remain fully opaque and all four controls remain visible at 280px viewport width. This user direction supersedes the original mockup's larger opaque container.

Latest evidence remains `artifacts/toolbar-desktop.png` (1030 × 733, deviceScaleFactor 1), `artifacts/toolbar-narrow.png` (280 × 650), and full/focused comparisons listed below. Both combined comparisons were opened again; no actionable P0/P1/P2 issues remain. The official icons stay sharp and the speed remains legible. The settings form was captured at 360 CSS px wide as `artifacts/settings.png`; controls wrap within the sidebar width without overflow. App copy and palette are preserved.

Settings now uses the native `sidePanel` API and `settings.html` manifest path. The real API open call succeeds in integration checks without creating a browser window. Headless Chrome does not draw native browser sidebar chrome, so the same private form is exercised in an extension tab. Tests also close settings while audio is playing and verify playback continues and the browser window survives. The complete browser suite passes with no uncaught page errors.

Native verification: reloaded version 0.3.2 in the personal `otto` Chrome profile. The public article retains the floating controls while Voice settings appears as a separate native sidebar document, with Chrome's Close side panel control. Done closed only the sidebar; opening it again worked. Left the sidebar open for the user. No live paid provider request was made.

## v0.3.1 — requested refinement

The user requested a smaller strip and a partially transparent background. The latest browser capture and README image show 280 × 56px (previously 360 × 72px), a 40px play button, 16px speed value, 78%-opaque white surface, 12px backdrop blur, and an 18px bottom offset. Text and icons remain opaque. Reduced-transparency preferences get a solid white surface. These differences from the original mockup are intentional user-directed changes.

The full and focused comparison artifacts were regenerated with the original target and revised implementation together. The revised strip remains legible, centered, unclipped, and fully usable at 280px viewport width. The existing complete browser suite passed again, including playback, settings, credentials, highlighting, CSP, and cleanup. Version 0.3.1 was reloaded in the personal otto Chrome profile and its four controls verified on the project article. No actionable P0/P1/P2 findings remain.

## Findings

No actionable P0, P1, or P2 findings remain. The shipped extension has four controls: play/pause, slower, faster, and settings. It highlights the article itself and preserves the page's links, forms, selection, and layout.

## Visual evidence

- Source visual truth: `/Users/otto/.codex/generated_images/01a19d34-4344-7b82-844d-579cb72b1970/exec-05a1c78c-e503-438d-b7a4-d83f262bf6aa.png` — option 1, Floating Strip.
- Browser-rendered implementation: `artifacts/toolbar-desktop.png` (also published as `docs/images/reader.png`).
- Full-view comparison: `artifacts/design-comparison.png`, source and working extension together in one image.
- Focused control comparison: `artifacts/toolbar-comparison.png`, source and working toolbar together in one image.
- Additional states: `artifacts/toolbar-narrow.png` and `artifacts/settings.png`.
- Source: 1487 × 1058 pixels. Normalized source: 1030 × 733 pixels. Implementation: 1030 × 733 pixels, viewport 1030 × 733 CSS pixels, deviceScaleFactor 1. The source has no explicit CSS density; it was resampled uniformly to the implementation viewport before comparison.
- State: light article, playing/visible pause icon, 1.25× speed, current sentence highlighted with a darker current word, “helps.” Native speech events are simulated in the disposable test profile for deterministic capture.
- Narrow check: 280 × 650 CSS pixels, deviceScaleFactor 1; all four controls remain visible without horizontal overflow.

The mock article is a visual fixture, not extension UI. Its text wraps differently from the generated reference. Preserving the host article's own typography and line wrapping is intentional; the extension does not restyle article content. Browser highlight ranges have rectangular painted edges rather than the reference's rounded background.

## Comparison history

1. Initial comparison found a P2 typography defect: the speed value inherited a serif font because the host's `all: initial` reset overrode the shadow host font, and a shadow-only font registration did not reliably load the bundled face.
2. Fixed the toolbar's explicit font family and registered bundled fonts through `FontFace` in the page document. No changes to the host article's styling were made.
3. Re-captured at the same viewport and playing state. Opened the full comparison and focused toolbar comparison together with their source. The speed value now uses the intended sans serif family; no clipping, overflow, or accidental host-font inheritance remains.

## Required fidelity surfaces

- **Typography:** bundled Atkinson Hyperlegible, system sans fallback; speed is readable at 19px. Control labels, weights, line heights, and centering are consistent. No truncation at desktop or 280px widths.
- **Spacing/layout (initial v0.3.0):** compact 360 × 72px white strip with a 52px primary circle, rounded corners, soft elevation, centered at the bottom with a 24px gap. See v0.3.1 refinement above for current dimensions. Four controls and the settings divider match the selected hierarchy. Host page content stays intact.
- **Colors/tokens:** cobalt playback button and current word, pale blue sentence highlight, dark navy labels, pale neutral speed buttons, and white surface match the source's palette. Active and disabled controls remain distinguishable.
- **Assets:** official MIT-licensed Tabler SVG icons, served locally, remain sharp at native size. These are standard controls; no custom logo or illustration from the reference has been substituted. No remote assets or rasterized interface controls.
- **Copy/content:** the visible strip contains only the numeric speed. Accessible names describe play/pause, slower, faster, and voice settings. Provider, voice, model, and API key fields live in settings. Errors appear only when relevant.

## Interaction verification

- All 12 core tests pass, including stale word-event rejection and pause while audio playback is still starting.
- The browser suite passes against the packaged extension source: open/close toolbar, extraction, paragraph/photo jumps, links/forms, drag selection, speed persistence, play/pause/resume, cloud audio caching, settings and voice preview, provider choices, session/device key behavior, page credential isolation, strict CSP, narrow layout, navigation cleanup, and offscreen teardown.
- Provider responses and audio are intercepted in the browser suite, including the offscreen document. No live paid voice request is needed for these checks.
- Browser suite reports no uncaught page errors. Native Chrome activation showed no extension error notice.
- Installed extension reloaded in the personal `otto` Chrome profile, version 0.3.0. On the public project article, the floating toolbar exposes exactly play, slower, faster, and voice settings; direct paragraph clicking works.
- Browser voices highlight words when the voice supplies boundary events. Cloud providers highlight the current passage; they do not fabricate word timing.

## Open questions and limits

No blocking questions. Live provider quality and account entitlements depend on the user's API key and selected voice. Chrome internal pages, store pages, browser PDF viewers, and image-only text are outside this release's scope.

## Follow-up polish

- P3: the reference's bottom spacing is slightly larger after normalization. The implemented 24px placement keeps the strip consistently reachable across viewport sizes.
- P3: official Tabler settings sliders have three tracks; the generated reference has two. The standard icon keeps the intended settings affordance.

## Implementation checklist

- [x] Reduce playback UI to the four required controls.
- [x] Keep voice and credential setup in settings.
- [x] Highlight real page text without replacing article markup.
- [x] Fix typography, recapture, and compare full and focused views.
- [x] Verify desktop, narrow, strict-CSP, and lifecycle behavior.
- [x] Reload and verify the installed personal Chrome extension.
