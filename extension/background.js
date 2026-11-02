import {safeSettings} from './core.js';
const engineURL = chrome.runtime.getURL('engine.html');
const settingsURL = chrome.runtime.getURL('settings.html');
const prepareStorage = () => Promise.all(['local','session'].map(area => chrome.storage[area].setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'})));
prepareStorage().catch(() => {});
// Retire the old selection menu when upgrading to the floating reader.
chrome.runtime.onInstalled.addListener(() => {prepareStorage().catch(()=>{});chrome.contextMenus?.removeAll();});
let creating;
async function hasEngine(){return (await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[engineURL]})).length>0;}
async function ensureEngine(){
  if(await hasEngine())return;
  if(!creating)creating=chrome.offscreen.createDocument({url:'engine.html',reasons:['BLOBS'],justification:'Create, cache, and play synthesized speech Blob URLs outside the article page.'}).finally(()=>{creating=null;});
  await creating;
}
async function engine(action,extra={}){await ensureEngine();return chrome.runtime.sendMessage({target:'engine',action,...extra});}
let commands=Promise.resolve();
function command(action,extra={}){
  const task=commands.then(async()=>{
    if(action==='configure'&&!await hasEngine())return {ok:true};
    return engine(action,typeof extra==='function'?await extra():extra);
  });
  commands=task.catch(()=>{});return task;
}
async function source(){return (await chrome.storage.session.get('readerTabId')).readerTabId;}
async function settings(){return safeSettings((await chrome.storage.local.get('settings')).settings);}
async function sendPage(tabId,action,extra={}){if(tabId!=null)return chrome.tabs.sendMessage(tabId,{target:'content',action,...extra}).catch(()=>{});}
async function closeReader(tabId){
  if(await source()!==tabId)return;
  await chrome.storage.session.remove(['readerTabId','readerUrl']);
  chrome.tts.stop();
  if(await hasEngine()){await chrome.runtime.sendMessage({target:'engine',action:'stop'}).catch(()=>{});await chrome.offscreen.closeDocument().catch(()=>{});}
}
async function activate(tab){
  try{
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
    const result=await sendPage(tab.id,'toggle-toolbar');
    if(!result?.visible){await closeReader(tab.id);return;}
    const previous=await source();
    if(previous!=null&&previous!==tab.id)await sendPage(previous,'hide-toolbar');
    await chrome.storage.session.set({readerTabId:tab.id,readerUrl:result.page.url});
    await command('load',async()=>({tabId:tab.id,page:result.page,settings:await settings()}));
    await chrome.action.setBadgeText({tabId:tab.id,text:''});
  }catch(error){
    console.error('Reader activation failed:',error);
    await chrome.action.setBadgeText({tabId:tab.id,text:'!'}).catch(()=>{});
    await chrome.action.setTitle({tabId:tab.id,title:'Open a normal web article to use Read from here. Chrome settings, store pages, and PDF viewers are not supported.'}).catch(()=>{});
  }
}
chrome.action.onClicked.addListener(tab=>{void activate(tab);});
async function openSettings(){
  const contexts=await chrome.runtime.getContexts({documentUrls:[settingsURL]});
  const existing=contexts.find(context=>context.windowId>=0);
  if(existing){await chrome.windows.update(existing.windowId,{focused:true});return;}
  await chrome.windows.create({url:settingsURL,type:'popup',width:420,height:740,focused:true});
}
async function handle(message,sender){
  const internal=sender.url===engineURL;
  const settingsPage=sender.url===settingsURL;
  if(internal){
    if(message.action==='get-key'){
      const [local,session]=await Promise.all([chrome.storage.local.get('keys'),chrome.storage.session.get('keys')]);
      return {key:session.keys?.[message.provider]||local.keys?.[message.provider]||''};
    }
    if(message.action==='save-speed'){const value=await settings();value.speed=Math.min(3,Math.max(.5,Number(message.speed)||1));await chrome.storage.local.set({settings:value});return {ok:true};}
    if(message.action==='native'){
      if(message.command==='stop')chrome.tts.stop();
      if(message.command==='pause')chrome.tts.pause();
      if(message.command==='resume')chrome.tts.resume();
      if(message.command==='speak'){
        const {speechId,text,options}=message;
        chrome.tts.speak(text,{...options,enqueue:false,onEvent:event=>{chrome.runtime.sendMessage({target:'engine',action:'tts-event',speechId,event}).catch(()=>{});}},()=>{
          if(chrome.runtime.lastError)chrome.runtime.sendMessage({target:'engine',action:'tts-event',speechId,event:{type:'error',errorMessage:chrome.runtime.lastError.message}}).catch(()=>{});
        });
      }
      return {ok:true};
    }
    if(message.action==='state'){
      if(message.tabId===await source())await sendPage(message.tabId,'state',{state:message.state});
      return {ok:true};
    }
    if(message.action==='highlight'){
      if(message.tabId===await source())await sendPage(message.tabId,'highlight',message.passage);
      return {ok:true};
    }
  }
  if(settingsPage){
    if(message.action==='preview')return command('preview',async()=>({settings:await settings()}));
    if(message.action==='stop-preview'){if(await hasEngine())return command('stop-preview');return {ok:true};}
  }
  if(sender.tab?.id!=null && sender.frameId===0 && sender.tab.id===await source()){
    const tabId=sender.tab.id;
    if(message.action==='toggle')return command('toggle');
    if(message.action==='jump')return command('jump',{page:message.page});
    if(message.action==='speed')return command('speed',{delta:message.delta===-1?-0.25:0.25});
    if(message.action==='settings'){await openSettings();return {ok:true};}
    if(message.action==='close'){await closeReader(tabId);return {ok:true};}
  }
  return {ok:false,error:'This action is not available in this context.'};
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message.target!=='background'||sender.id!==chrome.runtime.id)return;
  handle(message,sender).then(value=>respond(value||{ok:true})).catch(error=>respond({ok:false,error:error.message}));return true;
});
chrome.storage.onChanged.addListener((changes,area)=>{
  if((area==='local'&&changes.settings)||changes.keys){void command('configure',async()=>({settings:await settings(),keysChanged:Boolean(changes.keys)})).catch(()=>{});}
});
chrome.tabs.onRemoved.addListener(tabId=>{void closeReader(tabId);});
chrome.tabs.onUpdated.addListener((tabId,change,tab)=>{
  if(!change.url&&change.status!=='loading')return;
  void (async()=>{
    const {readerTabId,readerUrl}=await chrome.storage.session.get(['readerTabId','readerUrl']);
    if(readerTabId!==tabId)return;
    const next=change.url||tab.url;
    // Anchor links do not replace the document or end a listening session.
    if(!next||next.split('#')[0]!==readerUrl?.split('#')[0])await closeReader(tabId);
  })();
});
