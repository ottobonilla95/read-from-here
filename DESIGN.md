# Readily — Floating strip

The selected visual target is the Graphite reference supplied by the user, saved as `docs/images/graphite-reference.png`. It uses charcoal surfaces, warm ivory accents, a flat compact player, and regular system typography. The player uses 70% background opacity and a lower position following the user’s latest refinement. Settings use the native Chrome sidebar; the web page remains the reading surface.

## Main controls

A 232 × 48 CSS-pixel toolbar sits centered, 8 pixels above the bottom of the viewport. Its charcoal background uses `rgb(32 33 35 / 70%)` with 10-pixel backdrop blur; buttons and text remain opaque. Controls have no text shadows or speed-value badge. Its 12-pixel corners frame a compact strip with 6-pixel padding and 6-pixel gaps. A 36-pixel warm ivory button contains the play/pause icon. Slower, faster, and settings use 32-pixel targets. The 15-pixel medium-weight tabular speed value sits directly on the charcoal surface. Below a 250-pixel viewport the toolbar contracts to a 44-pixel height. There are exactly four buttons: play/pause, slower, faster, settings.

At widths below 250 pixels, spacing and controls contract to keep the whole strip within the viewport. The toolbar does not alter the page's content layout. Its shadow root isolates control styles from the host page. Accessible names and focus rings are present without adding visible labels or instructions.

## Color and type

- Settings and player charcoal: `#202123`.
- Form surface: `#2d2e30`.
- Warm ivory primary action and focus: `#f1eee7`, with `#ffffff` hover.
- Foreground: `#f5f3ee`; supporting text: `#b9b7b1`.
- Subtle dividers: `#414244`; tab baseline: `#62615d`. Fields use filled surfaces with transparent borders.
- Passage highlight remains pale blue; current word remains cobalt with white foreground.
- System UI typography supplies regular and medium weights; headings and the preview action use semibold.
- Icons use the bundled MIT-licensed Tabler assets.
The article keeps its own typography, colors, and layout. Highlight ranges change text paint, without wrapping or replacing the author's DOM.

## Reading states

The default strip has no title, source label, transcript, reading queue, passage count, progress bar, voice label, selection control, or footer. Playback status is announced to assistive technology. A short recovery message appears only when a real error requires action.

The current passage is highlighted on the page. Native speech word events highlight the current sentence and word. Cloud voices highlight the passage, because the supported synthesis responses do not provide alignment. Do not simulate word timing.

Readable paragraphs and photos show a hand cursor and blue hover outline while the toolbar is visible. Cursor markers are temporary and clear when leaving the page or closing the player. Scrolling recomputes the target under the pointer. Direct clicks move the reader, including sections expanded after activation and articles outside the initially detected root. Ordinary links, buttons, forms, modified clicks, and dragging text retain their normal behavior. Clicking the extension icon again dismisses the strip and stops playback.

## Settings

Chrome’s native sidebar is fully opaque dark mode. A Readily header and Done action precede Voice and Connection tabs. Tabs support arrow keys, Home, End, focus rings, and panel semantics. Provider remains available in either tab.

Voice holds the regular-weight voice selector, preview, refresh, cloud speech model, and follow-scrolling preference. Voice and provider fields share the same compact typography. The footer reports whether the chosen provider needs or has an API key and opens Connection with Add key or Manage key. Connection holds the masked key field, Show/Hide, storage preference, Save key, Remove key, and the provider’s data/cost explanation. Browser voices need no key. Closing settings preserves the listening session.

The type scale remains consistent at wide panel widths; the content is capped at 440 pixels. At 280 pixels, controls fit without horizontal scrolling. Empty status text occupies no space. Voice preview has a real play/pause icon and pressed state; browser voices hide the cloud-preview quota hint.
