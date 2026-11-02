# Read from here — Floating strip

The selected visual target is option 1 from the three mockups generated on 2 November 2026: a white floating strip at the bottom of the article. Its primary surface is the web page, not a side-panel transcript.

## Main controls

A 280 × 56 CSS-pixel toolbar sits centered, 18 pixels above the bottom of the viewport. Its white background is 78% opaque with a 12-pixel backdrop blur; controls and text remain fully opaque. It has a 20-pixel corner radius and a soft navy shadow. A 40-pixel cobalt circle contains the play/pause icon. The speed group contains two 28-pixel circular buttons and a centered 16-pixel numeric speed. Reduced-transparency preferences use a solid white background. A thin divider separates the settings icon. There are exactly four buttons: play/pause, slower, faster, settings.

At widths below 280 pixels, spacing and controls contract to keep the whole strip within the viewport. The toolbar does not alter the page's content layout. Its shadow root isolates control styles from the host page. Accessible names and focus rings are present without adding visible labels or instructions.

## Color and type

- Cobalt: `#2455da`, with `#1944b5` hover.
- Navy: `#182846`.
- White surface: `#ffffff`.
- Quiet control surface: `#f1f3f7`.
- Divider: `#dce3ef`.
- Passage highlight: `#e6edff`.
- Current word: cobalt background, white foreground.
- Toolbar type: locally bundled Atkinson Hyperlegible, 19-pixel tabular speed value.
- Icons: the official MIT-licensed Tabler player-play, player-pause, minus, plus, and adjustments-horizontal assets.

The article keeps its own typography, colors, and layout. Highlight ranges change text paint, without wrapping or replacing the author's DOM.

## Reading states

The default strip has no title, source label, transcript, reading queue, passage count, progress bar, voice label, selection control, or footer. Playback status is announced to assistive technology. A short recovery message appears only when a real error requires action.

The current passage is highlighted on the page. Native speech word events highlight the current sentence and word. Cloud voices highlight the passage, because the supported synthesis responses do not provide alignment. Do not simulate word timing.

Direct paragraph/photo clicks move the reader while its toolbar is visible. Ordinary links, buttons, forms, modified clicks, and dragging text retain their normal behavior. Clicking the extension icon again dismisses the strip and stops playback.

## Settings

The settings icon opens a small separate extension window with voice provider, API key, model, voice preview, and follow-scrolling controls. It reuses the existing form typography and cool paper palette. Closing settings preserves the main listening session. No settings fields appear in the everyday toolbar.
