import {PROVIDERS,OPENAI_VOICES,GEMINI_VOICES,safeSettings} from './core.js';
import {elevenVoices} from './providers.js';
const $=id=>document.getElementById(id);
let settings=safeSettings(),voiceList=[],voiceVersion=0,voiceAbort,previewActive=false;
const send=(action,extra={})=>chrome.runtime.sendMessage({target:'background',action,...extra});
function notice(message,error=false){$('notice').hidden=!message;$('notice').textContent=message;$('notice').classList.toggle('error',error);}
async function saveSettings(){await chrome.storage.local.set({settings});}
async function getKey(provider=settings.provider){const [local,session]=await Promise.all([chrome.storage.local.get('keys'),chrome.storage.session.get('keys')]);return session.keys?.[provider]||local.keys?.[provider]||'';}
function finishPreview(){if(previewActive){previewActive=false;void send('stop-preview');$('preview-voice').textContent='Listen to this voice';}}
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
    $('preview-voice').disabled=!list.length;
  }catch(error){if(version===voiceVersion && error.name!=='AbortError'){voiceList=[];populate($('voice'),[{id:'',name:'Could not load voices'}]);notice(error.message,true);}}
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
$('provider').addEventListener('change',async()=>{finishPreview();settings.provider=$('provider').value;notice('');await renderProvider();});
$('voice').addEventListener('change',async()=>{finishPreview();settings.voices[settings.provider]=$('voice').value;await saveSettings();});
$('model').addEventListener('change',async()=>{finishPreview();settings.models[settings.provider]=$('model').value;await saveSettings();});
$('follow').addEventListener('change',async()=>{settings.follow=$('follow').checked;await saveSettings();});
$('refresh-voices').addEventListener('click',()=>{notice('');void refreshVoices();});
$('show-key').addEventListener('click',()=>{const show=$('api-key').type==='password';$('api-key').type=show?'text':'password';$('show-key').textContent=show?'Hide':'Show';$('show-key').setAttribute('aria-label',show?'Hide API key':'Show API key');});
$('save-key').addEventListener('click',async()=>{
  const provider=settings.provider,key=$('api-key').value.trim();if(!key){$('key-status').textContent='Paste an API key first.';return;}
  finishPreview();
  for(const area of ['local','session']){const result=await chrome.storage[area].get('keys');const keys={...result.keys};delete keys[provider];if((area==='local')===$('remember-key').checked)keys[provider]=key;await chrome.storage[area].set({keys});}
  $('key-status').textContent=$('remember-key').checked?'Key saved on this device.':'Key saved for this browser session.';
  notice('');await refreshVoices();
});
$('delete-key').addEventListener('click',async()=>{
  finishPreview();const provider=settings.provider;
  for(const area of ['local','session']){const result=await chrome.storage[area].get('keys');const keys={...result.keys};delete keys[provider];await chrome.storage[area].set({keys});}
  $('api-key').value='';$('key-status').textContent='Key removed.';await refreshVoices();
});

$('settings-close').addEventListener('click',async()=>{
  finishPreview();
  try{
    const {id:windowId}=await chrome.windows.getCurrent();
    if(chrome.sidePanel.close)await chrome.sidePanel.close({windowId});
    else {await chrome.sidePanel.setOptions({enabled:false});await chrome.sidePanel.setOptions({enabled:true});}
  }catch(error){notice(error.message,true);}
});
$('preview-voice').addEventListener('click',async()=>{if(!voiceList.length)return;if(previewActive){finishPreview();return;}previewActive=true;$('preview-voice').textContent='Stop voice preview';notice('');const result=await send('preview');if(result?.error){finishPreview();notice(result.error,true);}});
chrome.runtime.onMessage.addListener(message=>{if(message.target!=='settings')return;if(message.action==='preview-state'&&(message.phase==='ended'||message.phase==='error')){previewActive=false;$('preview-voice').textContent='Listen to this voice';if(message.error)notice(message.error,true);}if(message.action==='speed-changed')settings.speed=message.speed;});
addEventListener('pagehide',()=>{void send('stop-preview');});
async function init(){settings=safeSettings((await chrome.storage.local.get('settings')).settings);$('follow').checked=settings.follow;await renderProvider();}
init().catch(error=>notice(error.message,true));
