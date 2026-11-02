# Voice provider options

Researched November 2, 2026. Prices, supported models, quota, and regional availability can change. This is a functional first implementation, not a listening benchmark: no paid live-provider request was made during development.

| Option | Why use it | Cost / tradeoff | Included in extension |
|---|---|---|---|
| Browser / operating-system voices | Try the workflow immediately; no API key | No speech API charge from this extension. Quality, language coverage and online/offline behavior depend on installed voices. | Voice list from Chrome TTS; play/pause and 0.5–3× speed |
| OpenAI | Clear narration with style instructions; documented preset voices | Your own API billing. OpenAI specifically recommends Marin or Cedar for quality. Voices are optimized for English. | `gpt-4o-mini-tts`, 13 preset voices; default Marin |
| ElevenLabs | Use the voices available in your own ElevenLabs account | Credit/usage pricing varies by model and plan. Flash is positioned for low latency; Multilingual v2 for stable long-form speech. | Flash v2.5, Multilingual v2, Eleven v3; account voice list |
| Gemini | Another controllable narration option; useful if you already have Google API access | Google lists a free tier for 3.8 Flash TTS, subject to quota/availability, plus paid audio-token billing. Free and paid tiers have different data-use terms. | 3.8 Flash TTS and 3.8 Flash-Lite TTS, 30 preset voices |

## Recommendation for this workflow

Start with **Browser voices** to check whether the voices already on your Mac are good enough for studying. For an AI voice, try a short passage with **OpenAI Marin** and an **ElevenLabs** voice you like, then choose by listening. No claim that one provider is universally most human-sounding is justified without comparing the same language and material. Gemini is also supported if its quota or your existing account makes it preferable.

The extension itself has no subscription fee. Bringing your own key removes the reader-app subscription but does not remove the provider's API charges. It generates only the current passage rather than pre-generating an entire page. Playback speed is changed locally for cloud audio. Exact article costs vary with text/audio length and model pricing; the extension does not display a misleading fixed estimate.

## Primary sources

- [Chrome text-to-speech API](https://developer.chrome.com/docs/extensions/reference/api/tts): voices, rate, pause/resume, and operating-system speech.
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel): persistent extension interface beside a web page.
- [Chrome activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab): access granted by an explicit user action, instead of persistent access to every website.
- [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage): session/local storage and trusted extension context access levels.
- [OpenAI text-to-speech guide](https://developers.openai.com/api/docs/guides/text-to-speech): speech endpoint, preset voices, style instructions, and recommendation of Marin/Cedar.
- [OpenAI pricing](https://developers.openai.com/api/docs/pricing): verify the currently applicable rates in your account before choosing a model.
- [ElevenLabs text-to-speech models](https://elevenlabs.io/docs/overview/capabilities/text-to-speech): quality/latency/language positioning.
- [ElevenLabs speech endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert): model and voice IDs, authentication, MP3 response.
- [ElevenLabs list voices](https://elevenlabs.io/docs/api-reference/voices/search): account voices and pagination.
- [ElevenLabs API pricing](https://elevenlabs.io/pricing/api): usage and plan terms.
- [Gemini speech generation](https://ai.google.dev/gemini-api/docs/speech-generation): supported TTS models, prebuilt voices, Interactions REST request, WAV output and audio parsing.
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing): free-tier and paid speech pricing and data-use terms.

## Implementation notes

OpenAI uses `/v1/audio/speech`; ElevenLabs uses `/v1/text-to-speech/{voice_id}` and `/v2/voices`; Gemini uses `/v1beta/interactions` and explicitly requests WAV audio with `store:false`. Network calls originate in the extension panel, not an injected web-page script. Generated audio and article text are held in memory. Selected text briefly passes through trusted session storage when launched from the context menu and is removed once loaded.
