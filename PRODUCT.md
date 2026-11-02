# Read from here

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Confirmed: Chrome / Chromium Manifest V3 extension, plain HTML, CSS and JavaScript. Floating on-page controls selected from visual mockups. No build required to install.

## Users
A student who wants to listen to online study material instead of reading it visually.

## Product Purpose
Choose a starting point on a web page and listen in a natural voice with play, pause, and playback speed controls.

## Operating Context
Open a page, activate the extension, click a paragraph or image directly, choose a voice and play. Direct clicks move the reader while the floating toolbar is visible, preserve playing/paused state, and keep earlier passages available. Bring a personal API key to use a cloud provider. A free browser voice is available without a key.

## Capabilities and Constraints
Requested: click-to-start, selectable voices, API-key settings, play/pause, speed. Provider candidates explicitly mentioned: OpenAI, ElevenLabs, Gemini. No paid reader subscription. Cloud API usage can cost money. API keys must never be committed. Assumption: local unpacked Chrome extension initially. Text inside photographs and scanned PDFs requires OCR and is outside this first version; choosing a photograph starts at surrounding page text.

## Product Principles
- Listening controls float below the study material; the page is the reading surface.
- Start without an account or API key.
- Preserve the author's actual text.
- Send text only when the user chooses a cloud voice and starts playback.

## Selected interface

A floating toolbar with play/pause, slower, faster, and settings. Highlight spoken text directly on the page. No transcript, source heading, selection button, reading queue, or progress display. Settings holds voices and API keys in Chrome’s sidebar.
