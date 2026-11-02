# Install Read from here

**Pick a paragraph. Press play. Keep learning.**

Read from here is a Chrome extension for listening to web pages with free browser voices or your own OpenAI, ElevenLabs, or Gemini API key.

## Install from the release ZIP

1. Download **Read-from-here.zip** from the [latest GitHub release](https://github.com/ottobonilla95/read-from-here/releases/latest).
2. Unzip it into a folder you plan to keep. Moving or deleting that folder later can break the installed extension.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** in the upper-right corner.
5. Click **Load unpacked** and select the unzipped **Read-from-here** folder. It should contain `manifest.json` directly.
6. Open Chrome's extensions menu (the puzzle piece) and pin **Read from here**.
7. Open a normal article page and click the extension icon. The reader opens in the side panel.

## Install from the repository

Clone the repository or download and unzip its source. Follow the same steps above, but select the repository's **extension** folder at step 5. No build or npm install is required to use the extension.

## First listen

With the side panel open, click a paragraph or image directly on the page. No picking button is needed. A subtle outline previews the passage under your pointer. A photo moves your place to the next caption or passage; this version does not read text inside images.

Press **Play**. Pause, move between passages, or change the speed using the slider. Click a passage on the page or in the side panel to move your place. Playback continues from the new passage if already playing, and stays paused if paused. Earlier passages remain available with Previous. Keep the panel open while listening; closing it removes the page click behavior. Links, buttons, forms, and dragging to select text keep working normally.

To read only part of the page, highlight text and choose **Use selected text**. You can also right-click a selection and choose **Read selected text**.

## Add an AI voice

Browser voices work immediately without a key. For another voice:

1. Open **Voice settings** with the sliders button.
2. Choose OpenAI, ElevenLabs, or Gemini.
3. Paste a key from your own provider account and select **Save key**.
4. Choose a model and voice, then return to your page and press **Play**.

The default keeps your key for this browser session. Check **Remember on this device** to save it locally. Saved keys are not encrypted and are never browser-synced. **Remove key** clears both locations.

Cloud playback and voice previews use your provider account and may cost money. Text goes directly to the provider you choose. Do not put API keys in project files, screenshots, issues, or commits.

## If a page does not load

Click the extension icon on that page to grant access, then choose **Load page**. Try selecting just the text you want if article extraction includes the wrong material.

Chrome internal pages, the Chrome Web Store, built-in PDF viewers, text inside pictures, canvas documents, and cross-origin frames are not supported. Open an HTML version when available.

## Updating

Replace the installed extension's files with the new version, then open `chrome://extensions` and click its **Reload** button. Refresh an article tab before using the updated extension.
