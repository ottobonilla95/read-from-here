import {safeSettings,makeQueue} from './core.js';
import {ReaderPlayer} from './player.js';
let settings=safeSettings(),page=null,tabId=null,speechId=0,nativeEvent=null,previewActive=false;
const send=(action,extra={})=>chrome.runtime.sendMessage({target:'background',action,...extra});
const native={
  stop(){nativeEvent=null;void send('native',{command:'stop'});},
  pause(){void send('native',{command:'pause'});},
  resume(){void send('native',{command:'resume'});},
  speak(text,{voice,rate,lang,onEvent}){
    let chosen={};try{chosen=JSON.parse(voice||'{}');}catch{}
    const options={rate};if(chosen.name)options.voiceName=chosen.name;if(chosen.lang||lang)options.lang=chosen.lang||lang;
    const id=++speechId;nativeEvent=onEvent;
    void send('native',{command:'speak',speechId:id,text,options}).then(result=>{if(result?.error&&id===speechId)onEvent({type:'error',errorMessage:result.error});});
  }
};
const usedKeys=new Map();
const readKey=async provider=>(await send('get-key',{provider})).key;
const key=async provider=>{const value=await readKey(provider);usedKeys.set(provider,value);return value;};
function highlight(item,charIndex,charLength){
  if(tabId==null)return;
  void send('highlight',{tabId,passage:{id:item.blockId,text:item.text,follow:charIndex==null&&settings.follow,charIndex,charLength}});
}
const player=new ReaderPlayer({native,settings:()=>({...settings,lang:page?.lang}),key,
  onChange:state=>{void send('state',{tabId,state:{...state,speed:settings.speed}});},
  onPassage:item=>highlight(item),onWord:(item,event)=>highlight(item,event.charIndex,event.length)
});
const preview=new ReaderPlayer({native,settings:()=>settings,key,onChange:state=>{
  if(previewActive){chrome.runtime.sendMessage({target:'settings',action:'preview-state',phase:state.phase,error:state.error}).catch(()=>{});if(state.phase==='ended'||state.phase==='error')previewActive=false;}
}});
function stopPreview(){if(previewActive){previewActive=false;preview.stop();}}
function load(data){page=data;const queue=makeQueue(data.blocks||[]),index=Math.max(0,queue.findIndex(item=>item.blockId===data.startBlockId));player.load(queue,index);if(!queue.length)player.fail(new Error('No readable text found. Try another article.'));}
async function handle(message){
  if(message.action==='load'){stopPreview();tabId=message.tabId;settings=safeSettings(message.settings);load(message.page);return;}
  if(message.action==='jump'){
    const autoplay=player.want,paused=player.phase==='paused';stopPreview();load(message.page);void player.seek(player.index,autoplay);if(paused&&!autoplay)player.pause();return;
  }
  if(message.action==='toggle'){stopPreview();void player.toggle();return;}
  if(message.action==='speed'){
    settings.speed=Math.min(3,Math.max(.5,Math.round((settings.speed+message.delta)*100)/100));
    player.setSpeed(settings.speed);if(previewActive)preview.setSpeed(settings.speed);
    await send('state',{tabId,state:{phase:player.phase,index:player.index,total:player.queue.length,speed:settings.speed}});
    // Persist through the trusted worker, without exposing keys to page scripts.
    chrome.runtime.sendMessage({target:'settings',action:'speed-changed',speed:settings.speed}).catch(()=>{});
    await send('save-speed',{speed:settings.speed});return;
  }
  if(message.action==='configure'){
    const next=safeSettings(message.settings);
    const voiceChanged=next.provider!==settings.provider||JSON.stringify(next.voices)!==JSON.stringify(settings.voices)||JSON.stringify(next.models)!==JSON.stringify(settings.models);
    const keyChanged=message.keysChanged&&usedKeys.has(next.provider)&&(await readKey(next.provider))!==usedKeys.get(next.provider);
    if(voiceChanged||keyChanged){stopPreview();player.stop();player.clearCache();preview.clearCache();}
    settings=next;return;
  }
  if(message.action==='preview'){
    if(previewActive){stopPreview();return;}
    player.pause();settings=safeSettings(message.settings);previewActive=true;
    preview.load([{text:'Here is your voice. Take a breath, settle in, and let the words come to you.',blockId:'preview'}]);void preview.play();return;
  }
  if(message.action==='stop-preview'){stopPreview();return;}
  if(message.action==='stop'){stopPreview();player.stop();tabId=null;return;}
  if(message.action==='tts-event'&&message.speechId===speechId)nativeEvent?.(message.event);
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message.target!=='engine'||sender.id!==chrome.runtime.id||sender.tab||sender.documentId)return;
  handle(message).then(()=>respond({ok:true})).catch(error=>{player.fail(error);respond({ok:false,error:error.message});});return true;
});
