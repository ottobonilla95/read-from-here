---
name: Read from here
description: A pocket audio guide beside study material.
colors:
  paper: "#f7f9fd"
  surface: "#fff"
  ink: "#182846"
  muted: "#53627b"
  blue: "#2455da"
  selection: "#e6edff"
  line: "#dce3ef"
  field-border: "#b9c5d9"
  pick-border: "#a9bce9"
  play-hover: "#1944b5"
  passage-hover: "#edf1f9"
  notice-bg: "#e9efff"
  notice-ink: "#214195"
  error-bg: "#fbe9ed"
  error-ink: "#92243e"
typography:
  title:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  supporting:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  action:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  field: "7px"
  quiet: "8px"
  pick: "9px"
  player: "14px"
  play: "28px"
spacing:
  tight: "4px"
  small: "8px"
  control-gap: "10px"
  inset: "12px"
  medium: "16px"
  large: "20px"
  gutter: "22px"
  section: "28px"
components:
  button-play:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    typography: "{typography.action}"
    rounded: "{rounded.play}"
    padding: "0 20px"
    height: "53px"
  button-play-hover:
    backgroundColor: "{colors.play-hover}"
  button-pick:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.blue}"
    rounded: "{rounded.pick}"
    padding: "12px"
    width: "100%"
  button-icon:
    textColor: "{colors.ink}"
    rounded: "{rounded.quiet}"
    size: "38px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "8px 13px"
  button-text:
    textColor: "{colors.blue}"
    typography: "{typography.label}"
    padding: "5px 0"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.supporting}"
    rounded: "{rounded.field}"
    padding: "10px"
    width: "100%"
  player:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.player}"
    padding: "17px 16px 12px"
  passage:
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.quiet}"
    padding: "12px"
    width: "100%"
  passage-current:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.ink}"
---

# Design System: Read from here

## Overview

**Creative North Star: "The Pocket Audio Guide"**

A pocket museum audio guide adapted to studying: a compact cobalt transport sits beside the page, while cool white paper and quiet ink make the source text the main material. The interface feels calm, legible and immediately usable. Its visual identity comes from the play silhouette, readable type and passage highlighting rather than imagery.

The single column moves from source title to starting-point selection, playback and voice controls, then a continuous transcript. Voice settings open in place as a disclosure. The player is the one framed operational surface; passages remain part of a shared reading field.

**Key Characteristics:**
- A cobalt transport on cool white paper.
- Locally bundled, highly legible typography.
- A continuous transcript with one current-passage highlight.
- Compact controls and settings disclosed in place.

## Colors

The palette pairs cool paper with navy ink and a clear cobalt accent; pale blue marks interaction without competing with text.

### Primary
- **Cobalt** (`blue`): play, links, cursor, range and checkbox accents, and keyboard focus.
- **Cobalt shade** (`play-hover`): enabled play-button hover.
- **Pale blue** (`selection`): current passage, picking state, control hover and progress track.
- **Pick outline** (`pick-border`): the starting-point action's light blue border.

### Neutral
- **Cool paper** (`paper`): panel background and the continuous reading field.
- **White surface** (`surface`): header, player and editable controls.
- **Navy ink** (`ink`): titles, active passages and primary control text.
- **Quiet slate** (`muted`): upcoming passages, supporting text and metadata.
- **Cool line** (`line`): header divider, settings divider and player boundary.
- **Field outline** (`field-border`): secondary buttons and editable fields.
- **Passage hover** (`passage-hover`): temporary pointer emphasis on transcript text.
- **Information pair** (`notice-bg`, `notice-ink`): operational notices and recovery guidance.
- **Error pair** (`error-bg`, `error-ink`): playback or loading failures, always accompanied by text.

### Named Rules

**The Cobalt Transport Rule.** Concentrate solid cobalt in the play control; use it as text, outlines or small accents elsewhere.

## Typography

**Display Font:** Atkinson Hyperlegible, registered locally as `Atkinson`, with system-ui and sans-serif fallbacks.

**Body Font:** The same family. Regular and bold TTF assets are bundled with the extension; font synthesis is disabled.

**Character:** Open, readable letterforms keep both instructions and long passages approachable. Bold weight establishes hierarchy without uppercase labels or decorative type.

### Hierarchy
- **Title:** The source title; compact, bold and balanced across lines. At widths at or below (300px), it reduces to (23px).
- **Headline:** Settings and transcript section headings.
- **Body:** Transcript text; headings extracted from the page use the same size with bold weight.
- **Supporting:** Source guidance, empty state and editable field text. The empty state adopts the transcript's open leading.
- **Label:** Source metadata, field labels, speed and secondary actions. Field labels use bold weight.
- **Caption:** Playback metadata, time estimates, provider summary, hints and footer.
- **Action:** Play label and bold wordmark. The wordmark uses slightly tighter tracking (-0.02em).

### Named Rules

**The Continuous Reading Rule.** Preserve paragraph-sized text with generous leading; use weight and current-passage color rather than separate cards to distinguish passage roles.

## Layout

Use a left-aligned, fluid single column with a minimum body width of (260px). The header separates identity and the settings action. Main content uses side gutters of (22px), a top inset of (25px), and a bottom inset of (12px). The player begins after (25px); the transcript and footer use (28px) section separation.

At or below (300px), main gutters reduce to (14px), main top and bottom insets become (20px) and (10px), header padding becomes (16px 14px), and the transport gap reduces from (20px) to (12px). Text wraps within available width. Metadata and provider summaries truncate where their role requires a single line; passages and notices wrap long content.

The transcript is an ordered sequence with no visible list markers. Passage rows have only a small (4px) separation. Settings expand between the source and player and retain the same column and field widths.

## Elevation & Depth

The system has no shadows. White surfaces, pale state fills and thin cool borders supply depth. The player has a single border; settings have a top divider. Transcript rows remain unframed at rest. Keyboard focus uses a cobalt outline (3px) offset by (3px), clearly separated from component borders.

### Named Rules

**The Quiet Surface Rule.** Use tonal contrast and thin boundaries for structure; preserve the flat reading field around the player.

## Shapes

Controls use small, practical rounded corners; the player has a softer container radius and play is a pill. Fields and secondary buttons share one corner shape, while icon controls and passage highlights share another. Borders are thin (1px). Icons are inline SVG with rounded stroke joins and caps; play and pause use solid silhouettes. There is no decorative illustration.

## Components

### Buttons

Play is the dominant tactile target: a cobalt pill with white text, a solid SVG, minimum width (123px), and a darker enabled hover. Previous and next use transparent square icon buttons with muted disabled states. Disabled buttons use opacity (0.4) and a default cursor.

The starting-point action is a full-width white outlined button with bold cobalt text and an SVG pointer. Hover and active picking use pale blue. Secondary buttons use the field outline and white surface; text actions use cobalt with underlining on hover. All retain a visible keyboard focus outline.

### Playback Container

A bordered white container holds compact status and passage count, a slim (4px) progress track, centered transport, speed range and a single-line provider/voice summary. Speed and passage counts use tabular numerals. The speed input grows to use available width; the output reserves (36px). The voice summary opens settings.

### Transcript Passages

Each passage is a full-width text button with a transparent default background and muted text. Hover adds the passage-hover fill and ink text. Exactly the current passage uses pale blue with ink text through `aria-current`. Extracted headings use bold weight. Selecting a row moves playback to that passage.

### Inputs / Fields

Provider, model and voice selectors and API-key inputs use white fills, thin field outlines and small rounded corners. Controls span the column; the key row leaves room for its Show/Hide action. Checkbox and range accents use cobalt. Native controls retain their platform affordances. Loading voice choices disables the relevant controls, and explanatory hints sit directly below their related fields.

### Settings Disclosure

The header's SVG settings button and the provider summary open the same in-place settings region. The header action exposes expanded state; opening settings focuses the provider selector. Done closes settings and returns focus to the header action. A thin top divider separates settings from the source. Cloud fields appear only for a cloud provider.

### Notices

Operational messages use a small rounded fill and readable text. Error messages switch to the error pair and describe recovery. Notices use status semantics; color supports the written message. State changes in controls use short background/text transitions (150ms ease). Reduced-motion preference removes transitions.

## Do's and Don'ts

### Do:
- **Do** preserve the source-title, start-selection, playback and transcript hierarchy.
- **Do** keep the transcript continuous and show the current passage with pale blue and ink.
- **Do** use the bundled regular and bold typefaces and visible keyboard focus.
- **Do** disclose voice settings in place and keep supporting hints beside their controls.

### Don't:
- **Don't** introduce marketing claims or decorative illustration into the listening panel.
- **Don't** turn every passage into a bordered or elevated card.
- **Don't** replace written playback states or recovery guidance with color alone.
- **Don't** add decorative shadows to the flat paper-and-surface system.
