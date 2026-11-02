# Working on Read from here

The runtime has no framework, bundler, external scripts, or backend. Everything Chrome needs is in `extension/`.

## Code map

| File | Responsibility |
| --- | --- |
| `extension/manifest.json` | Manifest V3 permissions, provider hosts, toolbar action, and side panel |
| `extension/background.js` | Toolbar and context-menu activation, content injection, trusted storage access |
| `extension/content.js` | Article extraction, paragraph/photo picker, selection, passage highlighting |
| `extension/panel.html` / `panel.css` | Reader controls and settings |
| `extension/panel.js` | Panel events, provider settings, key storage, page connection, voice previews |
| `extension/player.js` | Playback, pause/resume, cancellation, passage transitions, memory cache |
| `extension/providers.js` | Direct cloud speech requests and ElevenLabs voice listing |
| `extension/core.js` | Provider presets, settings, text splitting, and queue creation |
| `tests/` | Core tests, Chromium integration runner, and example study article |
| `scripts/package.mjs` | Creates an installable ZIP without development dependencies |

`PRODUCT.md`, `DESIGN.md`, and `.impeccable/` record the product and design decisions. `PROVIDERS.md` records the provider research and primary sources.

## Set up

Use Node.js 22 or later, npm, and Chrome. Packaging also uses the `zip` command, included on macOS and commonly available on Linux.

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

Load `extension/` as an unpacked extension in Chrome. After changing runtime files, click **Reload** at `chrome://extensions` and refresh the article tab.

## What the checks cover

The core tests check text splitting and Unicode, page-anchor preservation, provider request formats, missing-key behavior, quota errors, voice pagination, pause during generation, cancellation before paid requests, stale responses after a jump, replay caching, and browser voice controls.

The Chromium checks load a temporary copy of the unchanged extension into a disposable browser profile. They trigger the toolbar action with Chrome DevTools Protocol, exercising the shipped `activeTab` grant. They verify:

- Article extraction, hidden/navigation filtering, and nested-block deduplication.
- Paragraph and photograph picking, Escape cancellation, and selected-text reading.
- Cloud audio playback, pause/resume, and speed changes without regeneration.
- Session-only and device-local key storage, plus key removal.
- Voice preview preserving the article position.
- ElevenLabs voice loading and Gemini WAV decoding/playback.
- A 280-pixel panel layout without horizontal overflow or uncaught page errors.

Provider responses use fixtures. Tests do not require real API keys or make paid API calls. They do not establish live model availability, account access, provider latency, or voice quality. Browser voice output also depends on the operating system and installed voices.

## Packaging

`npm run package` copies only runtime files, the installation guide, and provider notes into `artifacts/Read-from-here.zip`. It rejects a manifest containing localhost or all-site host access. Generated files and installed dependencies are ignored by Git.

Keep keys in the extension settings. Never add real credentials to tests or source files. The only website hosts in the shipped manifest are the three supported speech providers; article access comes from `activeTab`.
