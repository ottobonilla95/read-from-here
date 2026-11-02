# Read from here

**Your study material. Out loud. At your pace.**

A lightweight Chrome extension that reads web pages aloud, starting where you choose. Click a paragraph or photo, pick a voice, and press play. The controls stay beside your article so you can listen and follow along.

Start with free browser voices. Bring your own OpenAI, ElevenLabs, or Gemini API key when you want another voice. No reader subscription or extension account required; cloud API usage may cost money.

## Get listening

1. [Download the extension](https://github.com/ottobonilla95/read-from-here/releases/latest) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped **Read-from-here** folder—the one containing `manifest.json`.
4. Pin **Read from here** from Chrome's extensions menu, then click its icon on an article.
5. Choose **Pick a starting point**, click a passage on the page, and press **Play**.

If you cloned this repository or downloaded its source, select the **extension** folder at step 3. No build step is needed. [Full installation guide](docs/INSTALL.md).

<img src="docs/images/reader.png" alt="Read from here beside a study article, with a starting-point picker, playback controls, speed slider, and a list of passages." width="360">

*Example page used for testing.*

## A reader that starts where you want

- **Choose your place.** Click a paragraph to begin there. Click a photo to begin at the next caption or passage. Press Escape to cancel picking.
- **Listen to a selection.** Highlight text and choose **Use selected text**, or right-click it and choose **Read selected text**.
- **Keep your own pace.** Play, pause, skip between passages, and adjust speed from **0.5× to 3×**.
- **Follow along.** The current passage is highlighted on the page. Turn off automatic following when you want to scroll freely.
- **Try different voices.** Pick a voice and hear a short preview before returning to your article.

Keep the side panel open while listening. Closing it stops playback. Use **Load page** to switch to the current page; click the extension icon on a new site to grant access.

## Pick a voice

Open **Voice settings** using the sliders button.

| Provider | What you need | Good starting point |
| --- | --- | --- |
| Browser voices | Nothing extra | Try the voices already available on your device. No API key or API charge. |
| OpenAI | Your OpenAI API key | Marin or Cedar for AI narration. |
| ElevenLabs | Your ElevenLabs API key | Choose from the voices available in your account. |
| Gemini | Your Gemini API key | Try one of the 30 preset voices. Account quotas and availability apply. |

For a cloud voice, choose the provider, paste your key, select **Save key**, and pick a model and voice. Voice previews also use your API quota. Changing the playback speed of generated audio does not generate it again. Browser voices restart the current passage when speed changes.

[Read the provider comparison and sources](PROVIDERS.md). This project has not benchmarked which provider sounds most natural; try the same short passage with a few voices and choose the one you like.

## Your text and keys

There is no backend operated by this extension. Your API key is sent directly to the provider you choose, and never to the article's website.

- Keys stay in extension-only browser session storage by default.
- **Remember on this device** saves a key in local extension storage. Saved keys are not encrypted and are never browser-synced.
- **Remove key** clears that provider's key from both storage locations.
- Cloud playback sends the passage being played directly to the selected provider. Its billing and data policies apply.
- The extension holds the article and generated audio in memory. Up to 12 generated passages are cached for replay. Uncached passages can incur another API charge.
- A paused request may finish generating audio, but the next passage is not generated until playback continues.

Browser voices use the speech engines available on your device; some voices may require a network connection. The extension requests access to a page when you click its icon rather than permanent access to every website.

## Before you try it

This first version works with readable HTML articles and text selections in **Chrome 116 or later**. Other Chromium browsers have not been separately verified.

- A photo is a starting-point marker. Text inside photos and scanned documents is not read.
- Chrome settings pages, the Chrome Web Store, built-in PDF viewers, canvas documents, and cross-origin frames are not supported.
- Unusual page layouts can confuse article extraction. Selecting the exact text is the fallback.
- Highlighting follows passages rather than individual words. Cloud generation can leave a short gap between passages.
- AI voices can mispronounce or deviate from the source. Check the original material when exact wording matters.

There is no Chrome Web Store listing yet. This is an unpacked extension you install locally.

## Run or change the code

The extension uses plain JavaScript, HTML, and CSS. You can load `extension/` directly in Chrome without installing development tools.

For tests and packaging, use Node.js 22 or later:

```sh
git clone git@github.com:ottobonilla95/read-from-here.git
cd read-from-here
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

The packaged extension is written to `artifacts/Read-from-here.zip`.

Ten core checks and the Chromium integration checks passed for the initial version. Cloud provider responses were simulated; live API compatibility and voice quality still need testing with your own account. See [the development guide](docs/DEVELOPMENT.md) for the code map and test details.

The bundled Atkinson Hyperlegible font is distributed under the [SIL Open Font License](extension/assets/OFL.txt).
