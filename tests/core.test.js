import test from 'node:test';
import assert from 'node:assert/strict';
import {splitText,makeQueue,safeSettings} from '../extension/core.js';
import {generateSpeech,elevenVoices} from '../extension/providers.js';
import {ReaderPlayer} from '../extension/player.js';

test('long articles split at safe boundaries without losing text or Unicode',()=>{
  for(const text of ['A complete sentence. '.repeat(400),'字'.repeat(3000),'🌍'.repeat(1500),'A long study paragraph with ordinary words '.repeat(150)]){
    const chunks=splitText(text);assert.ok(chunks.every(c=>c.length<=1100));
    assert.equal(chunks.join('').replace(/\s/g,''),text.replace(/\s/g,''));
    assert.ok(chunks.every(c=>!/[\uD800-\uDBFF]$/.test(c)&&!/^[\uDC00-\uDFFF]/.test(c)));
  }
  assert.deepEqual(splitText('  '),[]);
});
test('queue retains page anchors and settings reject invalid values',()=>{
  assert.ok(makeQueue([{id:'a',text:'Word. '.repeat(500)}]).every(c=>c.blockId==='a'));
  assert.equal(safeSettings({provider:'unknown',speed:200}).provider,'browser');
  assert.equal(safeSettings({speed:200}).speed,3);
});
test('provider requests use the correct endpoints, authentication, and text',async()=>{
  for(const provider of ['openai','elevenlabs','gemini']){
    let called;
    const request=async(url,options)=>{called={url,options};return provider==='gemini'?Response.json({steps:[{type:'model_output',content:[{type:'audio',data:btoa('RIFFtest'),mime_type:'audio/wav'}]}]}):new Response('mp3',{headers:{'Content-Type':'audio/mpeg'}});};
    const result=await generateSpeech({provider,key:'test-secret',model:'model-id',voice:'voice-id',text:'Actual article text.'},request);
    const body=JSON.parse(called.options.body);
    assert.ok(called.url.startsWith('https://'));
    assert.ok(!called.url.includes('test-secret'));
    assert.ok(JSON.stringify(body).includes('Actual article text.'));
    assert.equal(result.type,provider==='gemini'?'audio/wav':'audio/mpeg');
    if(provider==='openai')assert.equal(called.options.headers.Authorization,'Bearer test-secret');
    if(provider==='gemini')assert.equal(body.store,false);
  }
});
test('missing keys do not send requests and quota errors offer recovery',async()=>{
  let requests=0;
  await assert.rejects(()=>generateSpeech({provider:'openai'},async()=>{requests++;}),/Add an API key/);
  assert.equal(requests,0);
  await assert.rejects(()=>generateSpeech({provider:'openai',key:'k'},async()=>Response.json({error:{message:'quota'}},{status:429})),/quota or rate limit/);
});
test('ElevenLabs voice list follows pagination',async()=>{
  let count=0;
  const voices=await elevenVoices('k',undefined,async url=>{count++;if(count===2)assert.match(url,/next_page_token=next/);return Response.json({voices:[{voice_id:String(count),name:'Voice'}],has_more:count===1,next_page_token:count===1?'next':undefined});});
  assert.equal(voices.length,2);
});
class FakeAudio {
  constructor(){this.src='';this.plays=0;this.paused=true;}
  getAttribute(){return this.src;}
  removeAttribute(){this.src='';}
  pause(){this.paused=true;}
  load(){}
  async play(){this.plays++;this.paused=false;}
}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function setup(synthesize,key=async()=> 'key'){
  const audio=new FakeAudio(),events=[];
  const native={stop(){},pause(){},resume(){},speak(){}};
  const settings={provider:'openai',voices:{openai:'marin'},models:{openai:'gpt-4o-mini-tts'},speed:1};
  const player=new ReaderPlayer({native,audio,settings:()=>settings,key,synthesize,onChange:event=>events.push(event)});
  player.load([{text:'First passage.',blockId:'a'},{text:'Second passage.',blockId:'b'}]);
  return {player,audio,events,settings,native};
}
test('pause during generation waits without playing, then resume reuses audio',async()=>{
  const pending=deferred();let count=0;
  const {player,audio}=setup(async()=>{count++;return pending.promise;});
  const start=player.play();await Promise.resolve();player.pause();pending.resolve(new Blob(['audio']));await start;
  assert.equal(player.phase,'paused');assert.equal(audio.plays,0);
  await player.play();assert.equal(audio.plays,1);assert.equal(count,1);
  player.stop();
});
test('stopping while a key loads prevents a paid API request',async()=>{
  const key=deferred();let count=0;
  const {player}=setup(async()=>{count++;return new Blob(['audio']);},()=>key.promise);
  const start=player.play();player.stop();key.resolve('key');await start;assert.equal(count,0);
});
test('late generation cannot play after seek or replace current passage',async()=>{
  const pending=deferred();
  const {player,audio}=setup(()=>pending.promise);
  const start=player.play();await Promise.resolve();player.seek(1,false);pending.resolve(new Blob(['audio']));await start;
  assert.equal(player.index,1);assert.equal(player.phase,'ready');assert.equal(audio.plays,0);player.stop();
});
test('next passage advances only on audio end; speed and replay reuse generation',async()=>{
  let count=0;const {player,audio}=setup(async()=>{count++;return new Blob(['audio']);});
  await player.play();assert.equal(count,1);assert.equal(player.index,0);
  player.setSpeed(2);assert.equal(count,1);assert.equal(audio.playbackRate,2);
  player.pause();await player.play();assert.equal(count,1);
  await player.seek(0,true);assert.equal(count,1);
  audio.onended();await new Promise(resolve=>setImmediate(resolve));assert.equal(player.index,1);assert.equal(count,2);
  audio.onended();assert.equal(player.phase,'ended');player.stop();
});
test('native pause, resume, and speed changes keep the passage index',async()=>{
  const {player,settings,native}=setup();settings.provider='browser';let spoke=0,paused=0,resumed=0;
  native.speak=()=>spoke++;native.pause=()=>paused++;native.resume=()=>resumed++;
  await player.play();player.pause();await player.play();assert.equal(paused,1);assert.equal(resumed,1);assert.equal(spoke,1);
  settings.speed=1.5;player.setSpeed(1.5);assert.equal(spoke,2);assert.equal(player.index,0);player.stop();
});
