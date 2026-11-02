# Install Read from here

**Click a paragraph. Press play. Keep learning.**

## Install

1. Download **Read-from-here.zip** from the [latest release](https://github.com/ottobonilla95/read-from-here/releases/latest).
2. Unzip it into a permanent folder. Moving or deleting the folder can break the installation.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Click **Load unpacked** and select the unzipped **Read-from-here** folder. It must contain `manifest.json` directly.
5. Open Chrome's extensions menu and pin **Read from here**.

From a source checkout, select the repository's **extension/** folder instead. No build or npm installation is required to listen.

## Listen

Open an ordinary article and click the extension icon. A small toolbar appears at the bottom of the page. Click a paragraph, then press **Play**. Use the minus and plus buttons to adjust speed in 0.25× steps.

Clicking another paragraph moves your place, continuing if playing and staying paused if paused. Clicking a photo moves to the next caption or passage. Words inside images are not read.

The current passage is highlighted directly on the page. Browser voices that report word events also highlight the spoken word and sentence. Cloud voices highlight passages without word timing.

Click the extension icon again to close the toolbar and stop listening. Navigating away or closing the tab stops playback too.

## Voices and API keys

The toolbar's settings icon opens a small voice-settings window. Browser voices work without a key. For OpenAI, ElevenLabs, or Gemini, choose the provider, paste your own key, select **Save key**, then choose a voice and model.

Keys are kept for the browser session by default. **Remember on this device** saves a key locally; it is not encrypted or browser-synced. **Remove key** clears both locations. Cloud playback and previews use your provider account and can cost money.

Close settings with **Done**; the floating toolbar and playback remain available.

## Updating

Replace the installed extension's files with the new version. At `chrome://extensions`, click its **Reload** button, then refresh the article tab and click the extension icon. Upgrading from the side-panel version keeps saved voice settings and keys.

## Supported pages

Chrome 116 or later with readable HTML. Chrome settings, the Chrome Web Store, built-in PDF viewers, scanned text, words in pictures, canvas documents, and cross-origin frames are not supported. Open an HTML version when available.
