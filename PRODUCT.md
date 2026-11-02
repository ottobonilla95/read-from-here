# Read from here

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Confirmed: Chrome / Chromium Manifest V3 extension, plain HTML, CSS and JavaScript. Code-first implementation. No build required to install.

## Users
A student who wants to listen to online study material instead of reading it visually.

## Product Purpose
Choose a starting point on a web page and listen in a natural voice with play, pause, and playback speed controls.

## Operating Context
Open a page, activate the extension, click a paragraph or image directly, choose a voice and play. Direct clicks move the reader while the panel is open, preserve playing/paused state, and keep earlier passages available. Bring a personal API key to use a cloud provider. A free browser voice is available without a key.

## Capabilities and Constraints
Requested: click-to-start, selectable voices, API-key settings, play/pause, speed. Provider candidates explicitly mentioned: OpenAI, ElevenLabs, Gemini. No paid reader subscription. Cloud API usage can cost money. API keys must never be committed. Assumption: local unpacked Chrome extension initially. Text inside photographs and scanned PDFs requires OCR and is outside this first version; choosing a photograph starts at surrounding page text.

## Product Principles
- Listening controls stay beside study material.
- Start without an account or API key.
- Preserve the author's actual text.
- Send text only when the user chooses a cloud voice and starts playback.
