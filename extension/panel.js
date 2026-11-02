import {PROVIDERS,OPENAI_VOICES,GEMINI_VOICES,DEFAULTS,makeQueue,estimateMinutes,safeSettings} from './core.js';
import {elevenVoices} from './providers.js';
import {ReaderPlayer} from './player.js';
const $=id=>document.getElementById(id);
let settings=safeSettings(), page=null, sourceTabId=null, voiceList=[], picking=false, voiceVersion=0, voiceAbort;
let renderedQueue=[];
const port=chrome.runtime.connect({name:'reader-panel'});
port.onDisconnect.addListener(()=>{});
function notice(message,error=false){$('notice').hidden=!message;$('notice').textContent=message;$('notice').classList.toggle('error',error);}
async function saveSettings(){await chrome.storage.local.set({settings});}
async function getKey(provider=settings.provider){
  const [local,session]=await Promise.all([chrome.storage.local.get('keys'),chrome.storage.session.get('keys')]);
  return session.keys?.[provider] || local.keys?.[provider] || '';
}
async function content(action,extra={}){
  if(sourceTabId==null)throw new Error('Open a web page, then click the extension icon to connect it.');
  return chrome.tabs.sendMessage(sourceTabId,{target:'content',action,...extra});
}
const native={
  stop:()=>chrome.tts.stop(), pause:()=>chrome.tts.pause(), resume:()=>chrome.tts.resume(),
  speak(text,{voice,rate,lang,onEvent}){
    let chosen={};try{chosen=JSON.parse(voice||'{}');}catch{}
    const options={rate,onEvent,enqueue:false};
    if(chosen.name)options.voiceName=chosen.name;
    if(chosen.lang||lang)options.lang=chosen.lang||lang;
    chrome.tts.speak(text,options,()=>{if(chrome.runtime.lastError)onEvent({type:'error',errorMessage:chrome.runtime.lastError.message});});
  }
};
const player=new ReaderPlayer({native,settings:()=>({...settings,lang:page?.lang}),key:getKey,onChange:updatePlayer,onPassage:(item,index)=>{
  content('highlight',{id:item.blockId,follow:settings.follow}).catch(()=>{});
  setCurrent(index);
}});
function setCurrent(index){
  const previous=document.querySelector('.passage[aria-current="true"]');
  previous?.removeAttribute('aria-current');
  const current=$('transcript').children[index]?.firstElementChild;
  current?.setAttribute('aria-current','true');
  if(current && settings.follow && $('settings').hidden)current.scrollIntoView({block:'nearest'});
}
function updatePlayer({phase,index,total,error}){
  const playing=phase==='playing'||phase==='loading';
  $('play-label').textContent=playing?'Pause':'Play';$('play').setAttribute('aria-label',playing?'Pause':'Play');
  $('play-icon').innerHTML=playing?'<path d="M7 5h4v14H7zM15 5h4v14h-4z"/>':'<path d="m9 5 11 7-11 7V5Z"/>';
  $('play').disabled=!total;$('previous').disabled=!total||index===0;$('next').disabled=!total||index>=total-1;
  $('passage-count').textContent=total?`${index+1} / ${total}`:'No text loaded';
  $('progress').max=total||1;$('progress').value=phase==='ended'?total:index;
  const labels={idle:'Ready when you are',ready:'Ready to listen',loading:'Preparing your voice…',playing:'Listening',paused:'Paused',ended:'Finished',error:'Playback stopped'};
  $('playback-status').textContent=labels[phase];
  if(error)notice(error,true);
}
function renderQueue(){
  const fragment=document.createDocumentFragment();
  renderedQueue.forEach((item,index)=>{
    const li=document.createElement('li'),button=document.createElement('button');
    button.className='passage'+(/^h[1-6]$/.test(item.kind)?' heading':'');button.textContent=item.text;
    button.addEventListener('click',()=>{finishPreview();notice('');void player.seek(index,player.want);});
    li.append(button);fragment.append(li);
  });
  $('transcript').replaceChildren(fragment);$('empty-state').hidden=renderedQueue.length>0;setCurrent(0);
}
function loadPage(data,tabId=sourceTabId){
  finishPreview();
  page=data;sourceTabId=tabId;renderedQueue=makeQueue(data.blocks||[]);
  player.load(renderedQueue);renderQueue();
  $('page-title').textContent=data.title||'Selected text';
  try{$('site-name').textContent=new URL(data.url).hostname;}catch{$('site-name').textContent='Your text';}
  $('source-hint').textContent=renderedQueue.length?'Choose a voice and press play. You can change your starting point anytime.':'No readable text found. Try selecting text on the page, or open the article outside a PDF viewer.';
  updateTime();notice(renderedQueue.length?'':'No readable text was found here. Try another part of the page or use selected text.',!renderedQueue.length);
}
function updateTime(){$('reading-time').textContent=renderedQueue.length?`About ${estimateMinutes(renderedQueue,settings.speed)} min`:'';}
async function connectPage(action='snapshot'){
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id)throw new Error('Open a web page first.');
  const result=await chrome.runtime.sendMessage({target:'background',action:'attach',tabId:tab.id});
  if(!result?.ok)throw new Error(result?.error||'Click the extension icon on the page to allow reading.');
  sourceTabId=tab.id;
  return content(action);
}
function showSettings(open=true){$('settings').hidden=!open;$('settings-toggle').setAttribute('aria-expanded',String(open));if(open)$('provider').focus();}
function summary(){
  const selected=voiceList.find(voice=>voice.id===settings.voices[settings.provider]);
  $('voice-summary').textContent=`${PROVIDERS[settings.provider].name} · ${selected?.name||'choose a voice'}`;
}
function populate(select,options,selected){select.replaceChildren(...options.map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.name;return option;}));if(options.some(item=>item.id===selected))select.value=selected;}
async function refreshVoices(){
  const version=++voiceVersion,provider=settings.provider;
  voiceAbort?.abort();voiceAbort=new AbortController();
  $('refresh-voices').disabled=true;$('voice').disabled=true;$('preview-voice').disabled=true;
  try{
    let list=[];
    if(provider==='browser')list=await new Promise(resolve=>chrome.tts.getVoices(voices=>resolve(voices.map(v=>({id:JSON.stringify({name:v.voiceName,lang:v.lang}),name:`${v.voiceName}${v.lang?' · '+v.lang:''}${v.remote?' · online':''}`})))));
    if(provider==='openai')list=OPENAI_VOICES;
    if(provider==='gemini')list=GEMINI_VOICES;
    if(provider==='elevenlabs')list=await elevenVoices(await getKey(provider),voiceAbort.signal);
    if(version!==voiceVersion)return;
    voiceList=list;populate($('voice'),list,settings.voices[provider]);
    if(!list.length){populate($('voice'),[{id:'',name:provider==='elevenlabs'?'Save your key, then refresh voices':'No voices found. Install a system voice, then refresh.'}]);}
    else if(!list.some(v=>v.id===settings.voices[provider])){settings.voices[provider]=list[0].id;await saveSettings();}
    summary();$('preview-voice').disabled=!list.length;
  }catch(error){if(version===voiceVersion && error.name!=='AbortError'){voiceList=[];populate($('voice'),[{id:'',name:'Could not load voices'}]);notice(error.message,true);summary();}}
  finally{if(version===voiceVersion){$('refresh-voices').disabled=false;$('voice').disabled=!voiceList.length;}}
}
async function renderProvider(){
  const provider=settings.provider;
  $('provider').value=provider;$('provider-hint').textContent=PROVIDERS[provider].hint;$('cloud-fields').hidden=provider==='browser';
  populate($('model'),PROVIDERS[provider].models.map(([id,name])=>({id,name})),settings.models[provider]);
  if(provider!=='browser' && !settings.models[provider])settings.models[provider]=$('model').value;
  const local=await chrome.storage.local.get('keys');
  if(provider!==settings.provider)return;
  $('remember-key').checked=Boolean(local.keys?.[provider]);$('api-key').value=await getKey(provider);$('api-key').type='password';$('show-key').textContent='Show';$('show-key').setAttribute('aria-label','Show API key');$('key-status').textContent='';
  await refreshVoices();await saveSettings();
}
async function cancelPick(){if(picking)await content('cancel-pick').catch(()=>{});picking=false;$('pick-start').classList.remove('is-picking');$('pick-start').lastChild.textContent='Pick a starting point';}
$('settings-toggle').addEventListener('click',()=>showSettings($('settings').hidden));
$('settings-close').addEventListener('click',()=>{showSettings(false);$('settings-toggle').focus();});
$('voice-summary').addEventListener('click',()=>showSettings());
$('load-page').addEventListener('click',async()=>{try{finishPreview();await cancelPick();player.stop();await content('clear').catch(()=>{});loadPage(await connectPage());}catch(error){notice(error.message,true);}});
$('pick-start').addEventListener('click',async()=>{
  try{
    if(picking){await cancelPick();notice('');return;}
    finishPreview();player.pause();await content('clear').catch(()=>{});
    await connectPage('pick');picking=true;$('pick-start').classList.add('is-picking');$('pick-start').lastChild.textContent='Cancel picking';notice('Click a paragraph or photo on the page. Press Esc to cancel.');
  }catch(error){notice(error.message,true);}
});
$('read-selection').addEventListener('click',async()=>{try{await cancelPick();const data=await connectPage('selection');if(!data.blocks[0]?.text.trim())throw new Error('Select some text on the page first, then choose Use selected text.');loadPage(data);}catch(error){notice(error.message,true);}});
$('play').addEventListener('click',()=>{finishPreview();notice('');void player.toggle();});
$('previous').addEventListener('click',()=>{finishPreview();notice('');void player.seek(player.index-1);});
$('next').addEventListener('click',()=>{finishPreview();notice('');void player.seek(player.index+1);});
$('speed').addEventListener('input',()=>{settings.speed=Number($('speed').value);$('speed-value').textContent=`${Number(settings.speed.toFixed(2))}×`;if(previewActive)previewPlayer.setSpeed(settings.speed);if(player.setSpeed(settings.speed))notice('Browser voice speed changed. The current passage restarts.');updateTime();});
$('speed').addEventListener('change',saveSettings);
$('provider').addEventListener('change',async()=>{finishPreview();player.stop();player.clearCache();settings.provider=$('provider').value;notice('');await renderProvider();});
$('voice').addEventListener('change',async()=>{finishPreview();player.stop();settings.voices[settings.provider]=$('voice').value;summary();await saveSettings();});
$('model').addEventListener('change',async()=>{finishPreview();player.stop();settings.models[settings.provider]=$('model').value;await saveSettings();});
$('follow').addEventListener('change',async()=>{settings.follow=$('follow').checked;await saveSettings();});
$('refresh-voices').addEventListener('click',()=>{notice('');void refreshVoices();});
$('show-key').addEventListener('click',()=>{const show=$('api-key').type==='password';$('api-key').type=show?'text':'password';$('show-key').textContent=show?'Hide':'Show';$('show-key').setAttribute('aria-label',show?'Hide API key':'Show API key');});
$('save-key').addEventListener('click',async()=>{
  const provider=settings.provider,key=$('api-key').value.trim();if(!key){$('key-status').textContent='Paste an API key first.';return;}
  finishPreview();player.stop();player.clearCache();
  for(const area of ['local','session']){const result=await chrome.storage[area].get('keys');const keys={...result.keys};delete keys[provider];if((area==='local')===$('remember-key').checked)keys[provider]=key;await chrome.storage[area].set({keys});}
  $('key-status').textContent=$('remember-key').checked?'Key saved on this device.':'Key saved for this browser session.';
  notice('');await refreshVoices();
});
$('delete-key').addEventListener('click',async()=>{
  finishPreview();player.stop();player.clearCache();const provider=settings.provider;
  for(const area of ['local','session']){const result=await chrome.storage[area].get('keys');const keys={...result.keys};delete keys[provider];await chrome.storage[area].set({keys});}
  $('api-key').value='';$('key-status').textContent='Key removed.';await refreshVoices();
});
let previewActive=false;
const previewPlayer=new ReaderPlayer({native,settings:()=>settings,key:getKey,onChange:state=>{
  if(previewActive && (state.phase==='ended'||state.phase==='error')){const error=state.error;finishPreview();if(error)notice(error,true);}
}});
$('preview-voice').addEventListener('click',async()=>{
  if(!voiceList.length)return;
  if(previewActive){finishPreview();return;}
  player.stop();previewActive=true;
  previewPlayer.load([{text:'Here is your voice. Take a breath, settle in, and let the words come to you.',blockId:'preview'}]);
  $('preview-voice').textContent='Stop voice preview';notice('Voice preview. Your place in the page is saved.');await previewPlayer.play();
});
function finishPreview(){if(!previewActive)return;previewActive=false;previewPlayer.stop();$('preview-voice').textContent='Listen to this voice';notice('');}
chrome.runtime.onMessage.addListener((message,sender)=>{
  if(message.target!=='panel'||sender.id!==chrome.runtime.id)return;
  if(message.action==='picked' && sender.tab?.id===sourceTabId){picking=false;$('pick-start').classList.remove('is-picking');$('pick-start').lastChild.textContent='Pick a starting point';finishPreview();loadPage(message.page,sender.tab.id);}
  if(message.action==='pick-cancelled'){picking=false;$('pick-start').classList.remove('is-picking');$('pick-start').lastChild.textContent='Pick a starting point';notice('');}
});
async function pendingSelection(value){
  if(!value)return;
  finishPreview();await cancelPick();loadPage({title:value.title,url:value.url,blocks:[{id:'selection',text:value.text,kind:'p'}]},value.tabId);
  await chrome.storage.session.remove('pendingSelection');
}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='session'&&changes.pendingSelection?.newValue)void pendingSelection(changes.pendingSelection.newValue);});
chrome.tabs.onRemoved.addListener(tabId=>{if(tabId===sourceTabId){finishPreview();player.stop();notice('The source tab was closed. Open another page and choose Load page.');sourceTabId=null;}});
chrome.tabs.onUpdated.addListener((tabId,change)=>{if(tabId===sourceTabId&&change.status==='loading'){finishPreview();player.stop();void cancelPick();notice('The page changed. Choose Load page to read the new page.');}});
addEventListener('pagehide',()=>{finishPreview();player.stop();void cancelPick();void content('clear').catch(()=>{});});
async function init(){
  const result=await chrome.storage.local.get('settings');settings=safeSettings(result.settings);
  $('speed').value=settings.speed;$('speed-value').textContent=`${settings.speed}×`;$('follow').checked=settings.follow;
  await renderProvider();
  const pending=await chrome.storage.session.get('pendingSelection');
  if(pending.pendingSelection){await pendingSelection(pending.pendingSelection);return;}
  try{loadPage(await connectPage());}catch(error){notice(error.message,true);}
}
init().catch(error=>notice(error.message,true));
