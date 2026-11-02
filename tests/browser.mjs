import {chromium} from 'playwright';
import {mkdtemp,cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
await mkdir(path.join(root,'artifacts'),{recursive:true});
const temp=await mkdtemp(path.join(tmpdir(),'read-from-here-test-'));
const extension=path.join(temp,'extension');await cp(path.join(root,'extension'),extension,{recursive:true});
const server=http.createServer(async(req,res)=>{
  if(/^\/assets\/AtkinsonHyperlegible-(Regular|Bold)\.ttf$/.test(req.url)){res.setHeader('Content-Type','font/ttf');res.end(await readFile(path.join(root,'extension',req.url)));return;}
  if(req.url.startsWith('/mockup')){res.setHeader('Content-Type','text/html');res.end(await readFile(path.join(root,'tests/mockup.html')));return;}
  res.setHeader('Content-Type','text/html');
  if(req.url.startsWith('/strict'))res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; media-src 'none'; connect-src 'none'");
  res.end(await readFile(path.join(root,'tests/article.html')));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,message){for(let i=0;i<100;i++){if(await check())return;await delay(75);}throw new Error(message);}
function wav(){const size=24000*2*20,b=Buffer.alloc(44+size);b.write('RIFF');b.writeUInt32LE(size+36,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(size,40);return b;}
let context;
try{
  context=await chromium.launchPersistentContext(path.join(temp,'profile'),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--autoplay-policy=no-user-gesture-required','--enable-unsafe-extension-debugging'],viewport:{width:1030,height:733}});
  const errors=[];context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker'),id=new URL(worker.url()).host;
  await until(()=>worker.evaluate(async()=>chrome.action.onClicked.hasListeners()&&!(await chrome.sidePanel.getPanelBehavior()).openPanelOnActionClick),'Toolbar behavior did not initialize');
  const cdp=await context.browser().newBrowserCDPSession();
  const requests=[],sessions=new Map();let sequence=0;
  cdp.on('Target.receivedMessageFromTarget',event=>{
    const session=sessions.get(event.sessionId);if(!session)return;
    const message=JSON.parse(event.message);
    if(message.id){const pending=session.pending.get(message.id);if(pending){session.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result);}return;}
    if(message.method==='Fetch.requestPaused'){
      const {requestId,request}=message.params;
      const gemini=request.url.includes('generativelanguage');
      if(request.url.includes('api.openai'))requests.push(JSON.parse(request.postData));
      const body=gemini?Buffer.from(JSON.stringify({steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/wav',data:wav().toString('base64')}]}]})):wav();
      void session.call('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:gemini?'application/json':'audio/wav'}],body:body.toString('base64')});
    }
  });
  async function mockEngine(){
    const targets=await cdp.send('Target.getTargets');
    const target=targets.targetInfos.find(target=>target.url===`chrome-extension://${id}/engine.html`);assert.ok(target,'Audio target missing');
    const {sessionId}=await cdp.send('Target.attachToTarget',{targetId:target.targetId,flatten:false});
    const session={pending:new Map(),call(method,params={}){const messageId=++sequence;return new Promise((resolve,reject)=>{this.pending.set(messageId,{resolve,reject});cdp.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id:messageId,method,params})}).catch(reject);});}};
    sessions.set(sessionId,session);
    // Offscreen targets are not covered by Playwright's page routing. Intercept their
    // network requests at the target itself before any speech can be requested.
    await session.call('Fetch.enable',{patterns:[{urlPattern:'https://api.openai.com/*'},{urlPattern:'https://api.elevenlabs.io/*'},{urlPattern:'https://generativelanguage.googleapis.com/*'}]});
  }
  async function activate(page){
    await page.bringToFront();
    const targets=await cdp.send('Target.getTargets',{filter:[{type:'tab',exclude:false}]});
    const target=targets.targetInfos.find(t=>t.url===page.url());assert.ok(target);
    await cdp.send('Extensions.triggerAction',{id,targetId:target.targetId});
  }
  const article=await context.newPage();await article.goto(base);
  await article.evaluate(()=>{const old=document.createElement('rfh-reader');old.dataset.rfhUi='';old.textContent='Previous extension controls';document.documentElement.append(old);});
  await activate(article);
  const ui=article.locator('rfh-reader');
  await ui.getByRole('button',{name:'Play',exact:true}).waitFor();
  await until(async()=>!(await ui.getByRole('button',{name:'Play',exact:true}).isDisabled()),'Reader did not connect');
  assert.equal(await ui.getByRole('button').count(),4);
  assert.equal(await ui.getByRole('slider').count(),0);
  assert.equal(await article.locator('rfh-reader').count(),1,'Old controls survived activation');
  await article.evaluate(()=>document.querySelector('rfh-reader').remove());
  await activate(article);await ui.getByRole('button',{name:'Play',exact:true}).waitFor();
  assert.equal(await article.locator('rfh-reader').count(),1,'Detached controls were not restored');
  const snapshot=await worker.evaluate(async()=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith('http://127.0.0.1:'));return chrome.tabs.sendMessage(tab.id,{target:'content',action:'snapshot'});});
  assert.equal(snapshot.blocks.length,9);assert.ok(!JSON.stringify(snapshot).includes('must not be read'));
  const highlighted=()=>article.evaluate(()=>Array.from(CSS.highlights.get('read-from-here-passage')||[]).map(range=>range.toString()).join(''));
  await article.locator('#cursor-word').hover();
  assert.equal(await article.locator('#cursor-word').evaluate(el=>getComputedStyle(el).cursor),'pointer','Nested text did not show the picker hand');
  await article.locator('#normal-link').hover();
  assert.equal(await article.locator('#cursor-word').evaluate(el=>getComputedStyle(el).cursor),'help','Picker did not restore the page cursor');
  assert.equal(await article.locator('#normal-link').getAttribute('data-rfh-cursor'),null,'Picker changed a real link');
  await article.locator('#lesson-toggle').click();await article.locator('#new-lesson').hover();
  assert.equal(await article.locator('#new-lesson').evaluate(el=>getComputedStyle(el).cursor),'pointer','Expanded lesson had no picker hand');
  await article.locator('#new-lesson').click();await until(async()=>(await highlighted()).startsWith('A newly opened lesson'),'Expanded lesson outside initial root could not be picked');
  await article.locator('#second').click();await until(async()=>(await highlighted()).startsWith('Researchers'),'Direct paragraph jump failed');
  await article.evaluate(()=>{document.body.style.background='#1e293b';document.body.style.color='#cbd5e1';});
  assert.equal(await article.locator('#second').evaluate(el=>getComputedStyle(el,'::highlight(read-from-here-passage)').color),'rgb(24, 40, 70)','Highlight inherited low-contrast dark-theme text');
  await article.locator('#second').hover();await article.screenshot({path:path.join(root,'artifacts/picker-dark.png')});
  await article.evaluate(()=>{document.body.style.removeProperty('background');document.body.style.removeProperty('color');});
  await article.locator('#photo').click();await until(async()=>(await highlighted()).startsWith('A quiet place'),'Photo jump failed');
  await article.locator('#normal-link').click();assert.equal(new URL(article.url()).hash,'#normal-link');
  assert.match(await highlighted(),/^A quiet place/);
  await article.locator('#normal-button').click();assert.equal(await article.locator('#normal-button').textContent(),'Clicked');
  await article.locator('#normal-input').fill('Study notes');
  await article.locator('#first').dispatchEvent('click',{button:0,ctrlKey:true});assert.match(await highlighted(),/^A quiet place/);
  await article.locator('#first').scrollIntoViewIfNeeded();const bounds=await article.locator('#first').boundingBox();
  await article.mouse.move(bounds.x+5,bounds.y+10);await article.mouse.down();await article.mouse.move(bounds.x+200,bounds.y+10,{steps:10});await article.mouse.up();
  assert.ok(await article.evaluate(()=>!getSelection().isCollapsed));assert.match(await highlighted(),/^A quiet place/);
  await article.evaluate(()=>getSelection().removeAllRanges());
  console.log('PASS four-control floating toolbar, extraction, pointer cursors, expanded lessons, direct paragraph/photo jumps, links/forms/text selection');
  await ui.getByRole('button',{name:'Faster',exact:true}).click();await until(async()=>(await ui.locator('#speed').textContent())==='1.25×','Speed did not update');
  assert.equal((await worker.evaluate(async()=>(await chrome.storage.local.get('settings')).settings)).speed,1.25);
  await ui.getByRole('button',{name:'Slower',exact:true}).click();
  const windowCount=await worker.evaluate(async()=>(await chrome.windows.getAll()).length);
  await worker.evaluate(()=>{
    const open=chrome.sidePanel.open.bind(chrome.sidePanel);
    globalThis.settingsOpen=null;
    chrome.sidePanel.open=async options=>{
      try{await open(options);globalThis.settingsOpen={options,ok:true};}
      catch(error){globalThis.settingsOpen={options,error:error.message};throw error;}
    };
  });
  await ui.getByRole('button',{name:'Voice settings'}).click();
  await until(()=>worker.evaluate(()=>Boolean(globalThis.settingsOpen)),'Sidebar open request missing');
  const opened=await worker.evaluate(()=>globalThis.settingsOpen);assert.equal(opened.ok,true,opened.error);
  assert.equal(typeof opened.options.windowId,'number');
  assert.equal(await worker.evaluate(async()=>(await chrome.windows.getAll()).length),windowCount,'Settings opened a separate window');
  assert.equal(await worker.evaluate(async()=>(await chrome.sidePanel.getOptions({})).path),'settings.html');
  // Headless Chrome accepts sidePanel.open but does not render native browser chrome.
  // Exercise the unchanged private settings form in a tab; verify the native sidebar in personal Chrome.
  const prefs=await context.newPage();await prefs.setViewportSize({width:360,height:780});await prefs.goto(`chrome-extension://${id}/settings.html`);
  await mockEngine();
  await prefs.locator('#provider').selectOption('openai');await prefs.locator('#voice').selectOption('marin');
  await prefs.locator('#api-key').fill('test-fixture-key');await prefs.locator('#save-key').click();
  await until(async()=>(await prefs.locator('#key-status').textContent()).includes('session'),'Key not saved');
  const stored=await worker.evaluate(async()=>({local:await chrome.storage.local.get('keys'),session:await chrome.storage.session.get('keys')}));
  assert.equal(stored.local.keys?.openai,undefined);assert.equal(stored.session.keys.openai,'test-fixture-key');
  await article.locator('#second').click();await ui.getByRole('button',{name:'Play',exact:true}).click();
  await until(async()=>(await ui.locator('#status').textContent())==='Listening','Cloud playback did not start');
  assert.match(requests[0].input,/^Researchers/);
  await ui.getByRole('button',{name:'Pause',exact:true}).click();await until(async()=>(await ui.locator('#status').textContent())==='Paused','Pause state did not arrive');
  await ui.getByRole('button',{name:'Faster',exact:true}).click();await ui.getByRole('button',{name:'Play',exact:true}).click();
  await delay(200);assert.equal(requests.length,1);
  await article.locator('#first').click();await until(async()=>requests.length===2,'Playing jump did not generate');
  await until(async()=>(await ui.locator('#status').textContent())==='Listening','Playing jump did not continue');
  assert.match(requests[1].input,/^Learning/);
  await ui.getByRole('button',{name:'Pause',exact:true}).click();await until(async()=>(await ui.locator('#status').textContent())==='Paused','Pause state did not arrive');await article.locator('#photo').click();
  await until(async()=>(await highlighted()).startsWith('A quiet place'),'Paused jump failed');await delay(250);
  assert.equal(await ui.locator('#status').textContent(),'Paused');assert.equal(requests.length,2);
  console.log('PASS isolated cloud audio, pause/resume, cached speed changes, playing/paused jumps, and session keys');
  await prefs.locator('#preview-voice').click();await until(async()=>requests.length===3,'Voice preview did not generate');
  await prefs.locator('#preview-voice').click();assert.match(await highlighted(),/^A quiet place/);
  await prefs.locator('#remember-key').check();await prefs.locator('#save-key').click();
  await until(async()=>(await prefs.locator('#key-status').textContent()).includes('device'),'Device key not saved');
  const remembered=await worker.evaluate(async()=>({local:await chrome.storage.local.get('keys'),session:await chrome.storage.session.get('keys')}));
  assert.equal(remembered.local.keys.openai,'test-fixture-key');assert.equal(remembered.session.keys.openai,undefined);
  await prefs.locator('#delete-key').click();await until(async()=>(await prefs.locator('#api-key').inputValue())==='','Key not removed');
  await context.route('https://api.elevenlabs.io/v2/voices**',route=>route.fulfill({json:{voices:[{voice_id:'test-voice',name:'Study voice',labels:{accent:'British'}}],has_more:false}}));
  await prefs.locator('#provider').selectOption('elevenlabs');await prefs.locator('#api-key').fill('test-eleven-key');await prefs.locator('#save-key').click();
  await until(async()=>(await prefs.locator('#voice').textContent()).includes('Study voice'),'ElevenLabs voices missing');
  await prefs.locator('#provider').selectOption('gemini');await until(async()=>await prefs.locator('#voice option').count()===30,'Gemini voices missing');
  await prefs.locator('#api-key').fill('test-gemini-key');await prefs.locator('#save-key').click();
  await context.route('https://generativelanguage.googleapis.com/**',route=>route.fulfill({json:{steps:[{type:'model_output',content:[{type:'audio',mime_type:'audio/wav',data:wav().toString('base64')}]}]}}));
  await ui.getByRole('button',{name:'Play',exact:true}).click();await until(async()=>(await ui.locator('#status').textContent())==='Listening','Gemini did not play');
  await ui.getByRole('button',{name:'Pause',exact:true}).click();
  await prefs.screenshot({path:path.join(root,'artifacts/settings.png'),fullPage:true});
  await ui.getByRole('button',{name:'Play',exact:true}).click();
  await until(async()=>(await ui.locator('#status').textContent())==='Listening','Reader did not resume before closing settings');
  await prefs.locator('#settings-close').click();
  assert.equal(await worker.evaluate(async()=>(await chrome.windows.getAll()).length),windowCount,'Done closed the browser window');
  assert.equal(await ui.locator('#status').textContent(),'Listening','Closing settings stopped the reader');
  await ui.getByRole('button',{name:'Pause',exact:true}).click();
  // Only internal extension pages can retrieve credentials or control the audio engine directly.
  const denied=await worker.evaluate(async()=>{
    const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith('http://127.0.0.1:'));
    const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:async()=>{
      const key=await chrome.runtime.sendMessage({target:'background',action:'get-key',provider:'gemini'});
      let access;try{await chrome.storage.session.get('keys');access=true;}catch{access=false;}
      return {key,access};
    }});return result.result;
  });
  assert.equal(denied.key.key,undefined);assert.equal(denied.access,false);
  assert.ok(!(await article.content()).includes('test-gemini-key'));
  console.log('PASS preview, key removal/remember-device, provider voices, Gemini playback, and page credential isolation');
  await article.locator('#cursor-word').hover();
  await activate(article);await ui.waitFor({state:'detached'});
  assert.equal(await article.locator('[data-rfh-cursor]').count(),0,'Picker cursor markers survived closing');
  assert.equal(await article.locator('#cursor-word').evaluate(el=>getComputedStyle(el).cursor),'help');
  assert.equal(await article.evaluate(()=>CSS.highlights.has('read-from-here-passage')),false);
  await until(async()=>!(await worker.evaluate(async()=>(await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length)),'Audio context survived closing toolbar');
  // A hostile page CSP cannot block the isolated audio engine or the toolbar icons.
  await article.goto(base+'/strict');await activate(article);await until(async()=>await worker.evaluate(async()=>(await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length>0),'Strict audio context missing');await mockEngine();await ui.getByRole('button',{name:'Play',exact:true}).waitFor();
  await article.locator('#second').click();await ui.getByRole('button',{name:'Play',exact:true}).click();
  await until(async()=>(await ui.locator('#status').textContent())==='Listening','Strict CSP blocked audio');
  await ui.getByRole('button',{name:'Pause',exact:true}).click();
  assert.ok(await ui.locator('#play img').evaluate(img=>img.complete&&img.naturalWidth>0),'Strict CSP blocked toolbar icons');
  await article.setViewportSize({width:280,height:650});
  const toolbarBounds=await ui.locator('.toolbar').boundingBox();assert.ok(toolbarBounds.x>=0&&toolbarBounds.x+toolbarBounds.width<=280);
  await article.screenshot({path:path.join(root,'artifacts/toolbar-narrow.png')});
  await article.reload();await ui.waitFor({state:'detached'});
  await until(async()=>!(await worker.evaluate(async()=>(await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length)),'Navigation did not stop audio');
  console.log('PASS toolbar toggle cleanup, strict CSP audio/icons, 280px viewport, and navigation cleanup');
  // Use native word callbacks for a deterministic visual reference; no device voice
  // or network dependency is needed to check sentence/word Range mapping.
  await worker.evaluate(()=>{chrome.tts.speak=(text,options,done)=>{const index=text.indexOf('helps turn');options.onEvent({type:'word',charIndex:index>=0?index:0,length:5});done?.();};});
  await prefs.locator('#provider').selectOption('browser');
  await until(()=>worker.evaluate(async()=>(await chrome.storage.local.get('settings')).settings.provider==='browser'),'Native provider not saved');
  await article.setViewportSize({width:1030,height:733});await article.goto(base+'/mockup');await activate(article);await until(async()=>await worker.evaluate(async()=>(await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length>0),'Mockup audio context missing');await mockEngine();
  await article.locator('#current').click();await ui.getByRole('button',{name:'Play',exact:true}).click();
  await until(async()=>(await ui.locator('#status').textContent())==='Listening','Mockup playback missing');
  await until(async()=>await article.evaluate(()=>CSS.highlights.has('read-from-here-word')),'Native word highlight missing');
  assert.equal(await article.evaluate(()=>Array.from(CSS.highlights.get('read-from-here-word'))[0].toString()),'helps');
  await article.mouse.move(0,0);await article.screenshot({path:path.join(root,'artifacts/toolbar-desktop.png')});
  await ui.getByRole('button',{name:'Voice settings'}).hover();await ui.locator('.toolbar').screenshot({path:path.join(root,'artifacts/toolbar-settings-hover.png')});
  await ui.getByRole('button',{name:'Pause',exact:true}).click();
  assert.deepEqual(errors,[]);console.log('PASS desktop capture and no uncaught page errors');
  await writeFile(path.join(root,'artifacts/browser-test.txt'),'All floating extension checks passed. Shipped activeTab permissions. Provider responses mocked. No real API calls.\n');
}finally{await context?.close();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
