export const PROVIDERS = {
  browser: { name: 'Browser voices', hint: 'Free. Uses the voices available in your browser or operating system. Some voices may need a network connection.', models: [] },
  openai: { name: 'OpenAI', hint: 'AI-generated voice. Sends played passages directly to OpenAI. API usage is billed to your account.', models: [['gpt-4o-mini-tts', 'GPT-4o mini TTS']] },
  elevenlabs: { name: 'ElevenLabs', hint: 'AI-generated voice. Sends played passages directly to ElevenLabs. API usage uses your account credits.', models: [['eleven_flash_v2_5', 'Flash v2.5 · faster'], ['eleven_multilingual_v2', 'Multilingual v2 · long-form'], ['eleven_v3', 'Eleven v3 · expressive']] },
  gemini: { name: 'Gemini', hint: 'AI-generated voice. Sends played passages directly to Google. Free-tier quotas and paid usage depend on your account.', models: [['gemini-3.8-flash-tts', 'Gemini 3.8 Flash TTS'], ['gemini-3.8-flash-lite-tts', 'Gemini 3.8 Flash-Lite TTS']] }
};
export const OPENAI_VOICES = ['marin','cedar','alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse'].map(id => ({id, name: id[0].toUpperCase() + id.slice(1)}));
export const GEMINI_VOICES = ['Kore','Puck','Charon','Zephyr','Fenrir','Leda','Orus','Aoede','Callirrhoe','Autonoe','Enceladus','Iapetus','Umbriel','Algieba','Despina','Erinome','Algenib','Rasalgethi','Laomedeia','Achernar','Alnilam','Schedar','Gacrux','Pulcherrima','Achird','Zubenelgenubi','Vindemiatrix','Sadachbia','Sadaltager','Sulafat'].map(id => ({id, name:id}));
export const DEFAULTS = { provider: 'browser', speed: 1, voices: {}, models: {}, follow: true };
export function splitText(text, limit = 1100) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const result = [];
  let rest = normalized;
  while (rest.length > limit) {
    const window = rest.slice(0, limit + 1);
    const endings = [...window.matchAll(/[.!?。！？][”’"']?(?:\s|$)/gu)];
    const last = endings.at(-1);
    let cut = last && last.index > limit * .35 ? last.index + last[0].trimEnd().length : window.lastIndexOf(' ');
    if (cut < limit * .2) cut = limit;
    // Never split a surrogate pair.
    if (/^[\uDC00-\uDFFF]$/.test(rest[cut])) cut--;
    result.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) result.push(rest);
  return result;
}
export function makeQueue(blocks) {
  return blocks.flatMap(block => splitText(block.text).map(text => ({ text, blockId: block.id, kind: block.kind || 'p' })));
}
export function estimateMinutes(queue, speed = 1) {
  const words = queue.reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
  return Math.max(1, Math.ceil(words / (165 * speed)));
}
export function safeSettings(value = {}) {
  return { ...DEFAULTS, provider: PROVIDERS[value.provider] ? value.provider : 'browser', speed: Math.min(3, Math.max(.5, Number(value.speed) || 1)), voices: value.voices || {}, models: value.models || {}, follow: value.follow !== false };
}
