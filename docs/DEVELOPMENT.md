# Working on Read from here

The runtime has no framework, bundler, remote scripts, or application server. Chrome loads everything from `extension/`.

## Code map

| File | Responsibility |
| --- | --- |
| `background.js` | Activation, source-tab lifecycle, trusted storage, native speech, settings sidebar, and message routing |
| `content.js` | Shadow DOM floating toolbar, semantic extraction, direct clicks, and CSS text highlighting |
| `engine.html` / `engine.js` | Private offscreen audio context, reading queue, state, previews, and native-word routing |
| `settings.html` / `settings.js` / `settings.css` | Provider, model, voice, preview, and API-key controls |
| `player.js` | Playback, pause/resume, cancellation, transitions, word events, and generated-audio caching |
| `providers.js` | Direct provider requests and ElevenLabs voice listing |
| `core.js` | Provider presets, settings normalization, text splitting, and queue creation |
| `assets/tabler/` | Vendored MIT-licensed Tabler control icons |
| `tests/` | Core tests, Chromium integration runner, study and visual-reference fixtures |
| `scripts/package.mjs` | Builds an installable ZIP without dependencies |

Paths above are relative to `extension/` except the last two rows.

## Architecture

A toolbar click grants `activeTab` and injects the content script. It mounts a small toolbar in a shadow root. There is one active reading source at a time; activating another page hides the former toolbar. Another toolbar-icon click stops audio and removes the controls and highlights. Navigation and tab closure also clean up the audio context; same-document anchor links do not end a session.

The page sends playback commands, but receives no keys. The worker validates the source tab and frame before routing commands. A private offscreen document creates and plays speech Blob URLs. It uses the documented `BLOBS` reason; the worker closes it when the reader is dismissed. It calls extension APIs through runtime messaging, because offscreen documents support only `chrome.runtime`.

API-key retrieval and native-speech commands are limited to the internal audio document. Direct engine commands are limited to the service worker, excluding tab/document senders. The settings sidebar is a private extension page, with session/local storage limited to trusted extension contexts. No extension HTML is web-accessible. Only the toolbar font and icon files are exposed as page assets.

The `sidePanel` permission hosts settings only. `offscreen` keeps playback independent of whether settings are open. The old `contextMenus` permission remains removed. Provider host permissions remain limited to OpenAI, ElevenLabs, and Google. No permanent article-host permission is requested.

The page uses CSS Custom Highlights for the current passage. Native word events narrow the highlight to the current sentence and word. Cloud providers here do not return alignment, so their highlights remain at passage level; there is no simulated word timing. An overlay is a fallback when CSS Highlights are unavailable.

Chrome documentation: [offscreen API and Blob reason](https://developer.chrome.com/docs/extensions/reference/api/offscreen), [native side panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).

## Develop

Use Node.js 22 or later and npm:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

After changing runtime files, reload the extension at `chrome://extensions`, then refresh the article.

## Verification

Core tests cover Unicode-safe splitting, anchors, provider request formats, missing keys, quota handling, voice pagination, cancellation, stale generation, caching, speed, and native speech events.

The Chromium suite loads a temporary copy of the unchanged extension and uses the toolbar action with the shipped `activeTab` grant. It checks the four visible toolbar controls, extraction, direct paragraph/photo jumps, links/forms/selection, speed persistence, cloud pause/resume, playing/paused jumps, previews, key storage/removal, provider voices, page credential isolation, cleanup, strict page CSP, narrow viewports, and uncaught errors.

Headless Chrome accepts the real `sidePanel.open` request but does not render the native sidebar. The suite checks its successful API call, manifest path, unchanged browser window count, and Done preserving the browser window. It exercises settings fields in a private extension tab; native sidebar presentation is verified in personal Chrome.

Offscreen documents are separate Chromium targets, so the test intercepts their speech requests with CDP Fetch before playback. Settings-page voice requests are intercepted through page routing. Provider fixtures do not establish live compatibility, account access, latency, or voice quality. Native word-event rendering can be exercised with a deterministic speech fixture; actual voice support varies by device.

## Packaging

`npm run package` copies runtime files, installation instructions, and provider notes to `artifacts/Read-from-here.zip`. It rejects localhost/all-site host permissions. Generated files and dependencies are ignored by Git. Never put real keys in source, tests, logs, or screenshots.
