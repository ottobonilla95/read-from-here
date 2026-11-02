async function checked(response, provider) {
  if (response.ok) return response;
  let detail = '';
  try { const data = await response.json(); detail = data.error?.message || data.detail?.message || (typeof data.detail === 'string' ? data.detail : ''); } catch {}
  const hints = { 401: 'Check your API key.', 403: 'Check your API key permissions and access to this model or voice.', 429: 'Your quota or rate limit was reached. Wait or check your provider billing.' };
  throw new Error(`${provider}: ${hints[response.status] || `Request failed (${response.status}).`} ${detail}`.trim());
}
export function geminiAudio(data) {
  const blocks = (data.steps || []).filter(step => step.type === 'model_output').flatMap(step => step.content || []);
  const audio = blocks.filter(block => block.type === 'audio' && block.data).at(-1) || data.output_audio;
  if (!audio?.data) throw new Error('Gemini returned no audio. Try a different model or a shorter passage.');
  const bytes = Uint8Array.from(atob(audio.data), char => char.charCodeAt(0));
  return new Blob([bytes], { type: audio.mime_type || 'audio/wav' });
}
export async function generateSpeech({provider, key, model, voice, text, signal}, request = fetch) {
  if (!key) throw new Error('Add an API key in Voice settings, or choose Browser voices to listen for free.');
  let response;
  const headers = { 'Content-Type': 'application/json' };
  if (provider === 'openai') {
    response = await request('https://api.openai.com/v1/audio/speech', { method:'POST', headers:{...headers, Authorization:`Bearer ${key}`}, body:JSON.stringify({model, voice, input:text, instructions:'Read the text exactly as written in a clear, natural, calm study narration. Do not add commentary.', response_format:'mp3'}), signal });
    return (await checked(response, 'OpenAI')).blob();
  }
  if (provider === 'elevenlabs') {
    response = await request(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, { method:'POST', headers:{...headers, 'xi-api-key':key}, body:JSON.stringify({text, model_id:model}), signal });
    return (await checked(response, 'ElevenLabs')).blob();
  }
  if (provider === 'gemini') {
    response = await request('https://generativelanguage.googleapis.com/v1beta/interactions', { method:'POST', headers:{...headers, 'x-goog-api-key':key}, body:JSON.stringify({model, input:[{type:'user_input', content:[{type:'text',text, annotations:[{type:'speech_metadata',style:'Clear, calm and natural narration. Read exactly the supplied text.'}]}]}], response_format:{type:'audio',mime_type:'audio/wav'}, generation_config:{speech_config:[{voice}]}, store:false}), signal });
    return geminiAudio(await (await checked(response, 'Gemini')).json());
  }
  throw new Error('Choose a supported voice provider.');
}
export async function elevenVoices(key, signal, request = fetch) {
  if (!key) return [];
  const voices = [];
  let next;
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({page_size:'100'});
    if (next) query.set('next_page_token', next);
    const response = await request(`https://api.elevenlabs.io/v2/voices?${query}`, { headers:{'xi-api-key':key}, signal });
    const data = await (await checked(response, 'ElevenLabs')).json();
    voices.push(...(data.voices || []).map(v => ({id:v.voice_id, name:v.name + (v.labels?.accent ? ` · ${v.labels.accent}` : '')})));
    if (!data.has_more || !data.next_page_token) break;
    next = data.next_page_token;
  }
  return voices;
}
